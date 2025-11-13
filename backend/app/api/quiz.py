"""
Quiz API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import json
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.quiz import QuizResult, SharedQuiz
from app.utils.dependencies import get_current_user
from app.services.gemini_service import gemini_service
from app.services.quiz_export_service import (
    generate_quiz_markdown,
    generate_quiz_pdf,
    generate_quiz_results_markdown,
    generate_quiz_results_pdf,
)
from app.schemas.quiz import (
    QuizCreateRequest,
    QuizResponse,
    QuizSubmission,
    QuizCorrectionResponse,
    QuizQuestion,
    QuestionCorrection,
    QuizResultResponse,
    SharedQuizCreate,
    SharedQuizResponse,
    SharedQuizSubmission,
)

router = APIRouter(prefix="/quiz", tags=["Quiz"])

# In-memory storage for quizzes (in production, use database)
quiz_storage = {}


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    quiz_request: QuizCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a quiz based on selected documents

    Args:
        quiz_request: Quiz generation request
        current_user: Current authenticated user
        db: Database session

    Returns:
        Generated quiz without answers
    """
    # Verify all documents belong to user and are ready
    documents = (
        db.query(Document)
        .filter(
            Document.id.in_(quiz_request.document_ids),
            Document.user_id == current_user.id,
        )
        .all()
    )

    if len(documents) != len(quiz_request.document_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more documents not found",
        )

    # Check if all documents are ready
    not_ready = [d for d in documents if d.status != "ready"]
    if not_ready:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Some documents are not ready: {', '.join([d.filename for d in not_ready])}",
        )

    try:
        # Generate quiz using Gemini
        file_ids = [doc.gemini_file_id for doc in documents]
        
        # Use provided language or user's preferred language
        quiz_language = quiz_request.language or current_user.preferred_language
        
        quiz_data = await gemini_service.generate_quiz(
            file_ids=file_ids,
            question_count=quiz_request.question_count,
            question_type=quiz_request.question_type,
            difficulty=quiz_request.difficulty,
            language=quiz_language,
        )

        # Store quiz data (including correct answers) for later correction
        quiz_id = quiz_data["quiz_id"]
        quiz_storage[quiz_id] = {
            "document_ids": quiz_request.document_ids,
            "file_ids": file_ids,
            "questions": quiz_data["questions"],
            "question_count": len(quiz_data["questions"]),
            "question_type": quiz_request.question_type,
            "difficulty": quiz_request.difficulty,
            "user_id": current_user.id,
            "created_at": datetime.utcnow(),
        }

        # Return quiz without correct answers
        questions_without_answers = []
        for q in quiz_data["questions"]:
            question = {
                "id": q["id"],
                "question": q["question"],
                "type": q["type"],
            }
            if q["type"] == "multiple_choice":
                question["options"] = q["options"]
            questions_without_answers.append(QuizQuestion(**question))

        return QuizResponse(
            quiz_id=quiz_id,
            document_ids=quiz_request.document_ids,
            questions=questions_without_answers,
            question_count=len(questions_without_answers),
            question_type=quiz_request.question_type,
            difficulty=quiz_request.difficulty,
            created_at=quiz_storage[quiz_id]["created_at"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}",
        )


@router.post("/submit", response_model=QuizCorrectionResponse)
async def submit_quiz(
    submission: QuizSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit quiz answers for correction and save results

    Args:
        submission: Quiz submission with user answers
        current_user: Current authenticated user
        db: Database session

    Returns:
        Quiz correction with feedback
    """
    # Verify quiz exists
    if submission.quiz_id not in quiz_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found or expired",
        )

    quiz_data = quiz_storage[submission.quiz_id]

    # Verify quiz belongs to user
    if quiz_data["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit this quiz",
        )

    try:
        # Get corrections from Gemini
        correction_data = await gemini_service.correct_quiz(
            file_ids=quiz_data["file_ids"],
            quiz_questions=quiz_data["questions"],
            user_answers=[{"question_id": a.question_id, "answer": a.answer} for a in submission.answers],
        )

        # Calculate statistics
        corrections = []
        correct_count = 0
        total_score = 0.0

        for corr in correction_data["corrections"]:
            correction = QuestionCorrection(
                question_id=corr["question_id"],
                question=corr["question"],
                user_answer=corr["user_answer"],
                correct_answer=corr["correct_answer"],
                is_correct=corr["is_correct"],
                explanation=corr["explanation"],
                score=corr["score"],
            )
            corrections.append(correction)
            if corr["is_correct"]:
                correct_count += 1
            total_score += corr["score"]

        score_percentage = (total_score / len(corrections)) * 100 if corrections else 0

        # Save quiz result to database
        quiz_result = QuizResult(
            quiz_id=submission.quiz_id,
            user_id=current_user.id,
            question_count=quiz_data["question_count"],
            question_type=quiz_data["question_type"],
            difficulty=quiz_data["difficulty"],
            total_questions=len(corrections),
            correct_answers=correct_count,
            score_percentage=round(score_percentage, 2),
            questions_data=json.dumps([q for q in quiz_data["questions"]]),
            corrections_data=json.dumps([corr.dict() for corr in corrections]),
            overall_feedback=correction_data.get("overall_feedback", ""),
            completed_at=datetime.utcnow(),
        )
        
        # Add document associations
        documents = db.query(Document).filter(Document.id.in_(quiz_data["document_ids"])).all()
        quiz_result.documents = documents
        
        db.add(quiz_result)
        db.commit()
        db.refresh(quiz_result)

        return QuizCorrectionResponse(
            quiz_id=submission.quiz_id,
            total_questions=len(corrections),
            correct_answers=correct_count,
            score_percentage=round(score_percentage, 2),
            corrections=corrections,
            overall_feedback=correction_data.get("overall_feedback", ""),
            created_at=datetime.utcnow(),
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to correct quiz: {str(e)}",
        )


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a quiz from storage

    Args:
        quiz_id: Quiz ID
        current_user: Current authenticated user
    """
    if quiz_id not in quiz_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )

    quiz_data = quiz_storage[quiz_id]

    # Verify quiz belongs to user
    if quiz_data["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this quiz",
        )

    del quiz_storage[quiz_id]
    return None


@router.get("/results", response_model=List[QuizResultResponse])
async def get_quiz_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: Optional[int] = 50,
    offset: Optional[int] = 0,
):
    """
    Get quiz results for the current user

    Args:
        current_user: Current authenticated user
        db: Database session
        limit: Maximum number of results to return
        offset: Number of results to skip

    Returns:
        List of quiz results
    """
    results = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == current_user.id)
        .order_by(QuizResult.completed_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return [
        QuizResultResponse(
            id=result.id,
            quiz_id=result.quiz_id,
            question_count=result.question_count,
            question_type=result.question_type,
            difficulty=result.difficulty,
            total_questions=result.total_questions,
            correct_answers=result.correct_answers,
            score_percentage=result.score_percentage,
            overall_feedback=result.overall_feedback,
            document_ids=[doc.id for doc in result.documents],
            completed_at=result.completed_at,
            created_at=result.created_at,
        )
        for result in results
    ]


@router.get("/results/{result_id}", response_model=QuizCorrectionResponse)
async def get_quiz_result_detail(
    result_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed quiz result including corrections

    Args:
        result_id: Quiz result ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Detailed quiz correction response
    """
    result = db.query(QuizResult).filter(
        QuizResult.id == result_id,
        QuizResult.user_id == current_user.id
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz result not found",
        )

    corrections_data = json.loads(result.corrections_data)
    corrections = [QuestionCorrection(**corr) for corr in corrections_data]

    return QuizCorrectionResponse(
        quiz_id=result.quiz_id,
        total_questions=result.total_questions,
        correct_answers=result.correct_answers,
        score_percentage=result.score_percentage,
        corrections=corrections,
        overall_feedback=result.overall_feedback or "",
        created_at=result.completed_at,
    )


@router.get("/download/{quiz_id}")
async def download_quiz_questions(
    quiz_id: str,
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download quiz questions in various formats (json, markdown, pdf)

    Args:
        quiz_id: Quiz ID
        format: Output format (json, markdown, pdf)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Quiz questions data in requested format
    """
    # Validate format
    if format not in ["json", "markdown", "md", "pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Supported formats: json, markdown, pdf",
        )
    
    quiz_data = None
    
    # Check in memory storage first
    if quiz_id in quiz_storage:
        quiz_storage_data = quiz_storage[quiz_id]
        if quiz_storage_data["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to download this quiz",
            )
        quiz_data = {
            "quiz_id": quiz_id,
            "questions": quiz_storage_data["questions"],
            "question_type": quiz_storage_data["question_type"],
            "difficulty": quiz_storage_data["difficulty"],
            "question_count": quiz_storage_data["question_count"],
            "created_at": quiz_storage_data["created_at"].isoformat(),
        }
    else:
        # Check in database
        result = db.query(QuizResult).filter(
            QuizResult.quiz_id == quiz_id,
            QuizResult.user_id == current_user.id
        ).first()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found",
            )

        questions_data = json.loads(result.questions_data)
        quiz_data = {
            "quiz_id": quiz_id,
            "questions": questions_data,
            "question_type": result.question_type,
            "difficulty": result.difficulty,
            "question_count": result.question_count,
            "created_at": result.created_at.isoformat(),
        }
    
    # Return based on format
    if format == "json":
        return quiz_data
    elif format in ["markdown", "md"]:
        md_content = generate_quiz_markdown(quiz_data, include_answers=False)
        return Response(
            content=md_content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=quiz_{quiz_id}.md"
            }
        )
    elif format == "pdf":
        pdf_content = generate_quiz_pdf(quiz_data, include_answers=False)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=quiz_{quiz_id}.pdf"
            }
        )


@router.get("/results/{result_id}/download")
async def download_quiz_results(
    result_id: int,
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download quiz results with corrections in various formats (json, markdown, pdf)

    Args:
        result_id: Quiz result ID
        format: Output format (json, markdown, pdf)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Quiz results data in requested format
    """
    # Validate format
    if format not in ["json", "markdown", "md", "pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Supported formats: json, markdown, pdf",
        )
    
    result = db.query(QuizResult).filter(
        QuizResult.id == result_id,
        QuizResult.user_id == current_user.id
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz result not found",
        )

    corrections_data = json.loads(result.corrections_data)
    questions_data = json.loads(result.questions_data)
    
    if format == "json":
        return {
            "quiz_id": result.quiz_id,
            "score_percentage": result.score_percentage,
            "correct_answers": result.correct_answers,
            "total_questions": result.total_questions,
            "corrections": corrections_data,
            "overall_feedback": result.overall_feedback,
            "completed_at": result.completed_at.isoformat(),
        }
    elif format in ["markdown", "md"]:
        quiz_data = {
            "difficulty": result.difficulty,
            "question_type": result.question_type,
        }
        md_content = generate_quiz_results_markdown(
            quiz_data,
            corrections_data,
            result.score_percentage,
            result.correct_answers,
            result.total_questions,
            result.overall_feedback or ""
        )
        return Response(
            content=md_content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=quiz_results_{result_id}.md"
            }
        )
    elif format == "pdf":
        quiz_data = {
            "difficulty": result.difficulty,
            "question_type": result.question_type,
        }
        pdf_content = generate_quiz_results_pdf(
            quiz_data,
            corrections_data,
            result.score_percentage,
            result.correct_answers,
            result.total_questions,
            result.overall_feedback or ""
        )
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=quiz_results_{result_id}.pdf"
            }
        )


@router.post("/share", response_model=SharedQuizResponse)
async def share_quiz(
    share_request: SharedQuizCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a shareable link for a quiz

    Args:
        share_request: Share request with quiz_id and optional metadata
        current_user: Current authenticated user
        db: Database session

    Returns:
        Shared quiz response with share token
    """
    quiz_id = share_request.quiz_id

    # Check if quiz exists in storage
    if quiz_id not in quiz_storage:
        # Check in database
        result = db.query(QuizResult).filter(
            QuizResult.quiz_id == quiz_id,
            QuizResult.user_id == current_user.id
        ).first()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found",
            )
        
        questions_data = result.questions_data
        # For stored results, we don't have correct answers stored separately
        # So we'll use the questions data
        correct_answers_data = result.questions_data
        question_count = result.question_count
        question_type = result.question_type
        difficulty = result.difficulty
    else:
        quiz_data = quiz_storage[quiz_id]
        
        if quiz_data["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to share this quiz",
            )
        
        questions_data = json.dumps(quiz_data["questions"])
        correct_answers_data = json.dumps(quiz_data["questions"])
        question_count = len(quiz_data["questions"])
        question_type = quiz_data["question_type"]
        difficulty = quiz_data["difficulty"]

    # Create shared quiz
    share_token = SharedQuiz.generate_share_token()
    
    # Calculate expiration if days provided
    expires_at = None
    if share_request.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=share_request.expires_in_days)

    shared_quiz = SharedQuiz(
        share_token=share_token,
        quiz_id=quiz_id,
        user_id=current_user.id,
        questions_data=questions_data,
        correct_answers_data=correct_answers_data,
        question_count=question_count,
        question_type=question_type,
        difficulty=difficulty,
        title=share_request.title,
        description=share_request.description,
        expires_at=expires_at,
    )

    db.add(shared_quiz)
    db.commit()
    db.refresh(shared_quiz)

    return SharedQuizResponse(
        id=shared_quiz.id,
        share_token=shared_quiz.share_token,
        quiz_id=shared_quiz.quiz_id,
        title=shared_quiz.title,
        description=shared_quiz.description,
        question_count=shared_quiz.question_count,
        question_type=shared_quiz.question_type,
        difficulty=shared_quiz.difficulty,
        view_count=shared_quiz.view_count,
        completion_count=shared_quiz.completion_count,
        is_active=shared_quiz.is_active,
        expires_at=shared_quiz.expires_at,
        created_at=shared_quiz.created_at,
    )


@router.get("/shared/{share_token}", response_model=QuizResponse)
async def get_shared_quiz(
    share_token: str,
    db: Session = Depends(get_db),
):
    """
    Get a shared quiz (public access, no authentication required)

    Args:
        share_token: Share token
        db: Database session

    Returns:
        Quiz response without correct answers
    """
    shared_quiz = db.query(SharedQuiz).filter(
        SharedQuiz.share_token == share_token,
        SharedQuiz.is_active == True
    ).first()

    if not shared_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared quiz not found or inactive",
        )

    # Check expiration
    if shared_quiz.expires_at and shared_quiz.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This quiz has expired",
        )

    # Increment view count
    shared_quiz.view_count += 1
    db.commit()

    # Parse questions and remove correct answers
    questions_data = json.loads(shared_quiz.questions_data)
    questions_without_answers = []
    
    for q in questions_data:
        question = {
            "id": q["id"],
            "question": q["question"],
            "type": q["type"],
        }
        if q["type"] == "multiple_choice" and "options" in q:
            question["options"] = q["options"]
        questions_without_answers.append(QuizQuestion(**question))

    return QuizResponse(
        quiz_id=f"shared_{share_token}",
        document_ids=[],
        questions=questions_without_answers,
        question_count=shared_quiz.question_count,
        question_type=shared_quiz.question_type,
        difficulty=shared_quiz.difficulty,
        created_at=shared_quiz.created_at,
    )


@router.post("/shared/{share_token}/submit", response_model=QuizCorrectionResponse)
async def submit_shared_quiz(
    share_token: str,
    submission: SharedQuizSubmission,
    db: Session = Depends(get_db),
):
    """
    Submit answers for a shared quiz (public access, no authentication required)

    Args:
        share_token: Share token
        submission: Quiz submission with answers
        db: Database session

    Returns:
        Quiz correction response
    """
    shared_quiz = db.query(SharedQuiz).filter(
        SharedQuiz.share_token == share_token,
        SharedQuiz.is_active == True
    ).first()

    if not shared_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared quiz not found or inactive",
        )

    # Check expiration
    if shared_quiz.expires_at and shared_quiz.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This quiz has expired",
        )

    try:
        # Parse questions and correct answers
        questions_data = json.loads(shared_quiz.correct_answers_data)
        
        # Create a mapping of question_id to correct answer
        correct_answers_map = {}
        for q in questions_data:
            if "correct_answer" in q:
                correct_answers_map[q["id"]] = q["correct_answer"]
        
        # Calculate corrections
        corrections = []
        correct_count = 0
        
        for answer in submission.answers:
            question = next((q for q in questions_data if q["id"] == answer.question_id), None)
            if not question:
                continue
            
            correct_answer = correct_answers_map.get(answer.question_id, "")
            is_correct = answer.answer.strip().lower() == correct_answer.strip().lower()
            
            if is_correct:
                correct_count += 1
            
            correction = QuestionCorrection(
                question_id=answer.question_id,
                question=question["question"],
                user_answer=answer.answer,
                correct_answer=correct_answer,
                is_correct=is_correct,
                explanation="",  # No AI explanation for shared quizzes
                score=1.0 if is_correct else 0.0,
            )
            corrections.append(correction)
        
        score_percentage = (correct_count / len(corrections)) * 100 if corrections else 0
        
        # Increment completion count
        shared_quiz.completion_count += 1
        db.commit()
        
        return QuizCorrectionResponse(
            quiz_id=f"shared_{share_token}",
            total_questions=len(corrections),
            correct_answers=correct_count,
            score_percentage=round(score_percentage, 2),
            corrections=corrections,
            overall_feedback=f"You scored {correct_count} out of {len(corrections)} questions correctly!",
            created_at=datetime.utcnow(),
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to correct quiz: {str(e)}",
        )


@router.delete("/shared/{share_token}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shared_quiz(
    share_token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a shared quiz

    Args:
        share_token: Share token
        current_user: Current authenticated user
        db: Database session
    """
    shared_quiz = db.query(SharedQuiz).filter(
        SharedQuiz.share_token == share_token
    ).first()

    if not shared_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared quiz not found",
        )

    # Verify ownership
    if shared_quiz.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this shared quiz",
        )

    db.delete(shared_quiz)
    db.commit()
    return None
