"""
Quiz API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.utils.dependencies import get_current_user
from app.services.gemini_service import gemini_service
from app.schemas.quiz import (
    QuizCreateRequest,
    QuizResponse,
    QuizSubmission,
    QuizCorrectionResponse,
    QuizQuestion,
    QuestionCorrection,
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
        quiz_data = await gemini_service.generate_quiz(
            file_ids=file_ids,
            question_count=quiz_request.question_count,
            question_type=quiz_request.question_type,
            difficulty=quiz_request.difficulty,
        )

        # Store quiz data (including correct answers) for later correction
        quiz_id = quiz_data["quiz_id"]
        quiz_storage[quiz_id] = {
            "document_ids": quiz_request.document_ids,
            "file_ids": file_ids,
            "questions": quiz_data["questions"],
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
    Submit quiz answers for correction

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
