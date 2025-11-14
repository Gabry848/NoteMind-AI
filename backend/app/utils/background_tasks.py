"""
Background task utilities for long-running operations
"""
import asyncio
from typing import Callable, Any
from app.models.document import Document
from app.models.conversation import Message, Conversation
from app.services.gemini_service import gemini_service


async def process_chat_response(
    conversation_id: int,
    message: str,
    file_ids: list[str],
    history: list[dict],
    db_url: str,
    is_multi_document: bool = False,
):
    """
    Background task to process chat response

    Args:
        conversation_id: Conversation ID
        message: User message
        file_ids: List of Gemini file IDs
        history: Conversation history
        db_url: Database URL for new session
        is_multi_document: Whether to use multi-document chat
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Get AI response
        if is_multi_document:
            response_text, citations = await gemini_service.chat_with_documents(
                query=message,
                file_ids=file_ids,
                conversation_history=history,
            )
        else:
            response_text, citations = await gemini_service.chat_with_document(
                query=message,
                file_id=file_ids[0],
                conversation_history=history,
            )

        # Update or create the assistant message
        # First, check if there's already a "Processing" message
        existing_msg = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.role == "assistant",
                Message.content.like("%Processing%")
            )
            .order_by(Message.created_at.desc())
            .first()
        )
        
        if existing_msg:
            # Update the existing message
            existing_msg.content = response_text
            existing_msg.citations = citations if citations else None
        else:
            # Create new message
            ai_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=response_text,
                citations=citations if citations else None,
            )
            db.add(ai_message)
        
        # Update conversation timestamp
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conversation:
            from datetime import datetime
            conversation.updated_at = datetime.utcnow()
        
        db.commit()

    except Exception as e:
        # Log error and update/save error message
        existing_msg = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.role == "assistant",
                Message.content.like("%Processing%")
            )
            .order_by(Message.created_at.desc())
            .first()
        )
        
        error_text = f"Error generating response: {str(e)}"
        
        if existing_msg:
            existing_msg.content = error_text
        else:
            error_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=error_text,
                citations=None,
            )
            db.add(error_message)
        
        db.commit()
    finally:
        db.close()


async def process_summary_generation(
    document_id: int,
    file_id: str,
    summary_type: str,
    db_url: str,
):
    """
    Background task to generate document summary

    Args:
        document_id: Document ID
        file_id: Gemini file ID
        summary_type: Type of summary to generate
        db_url: Database URL for new session
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Generate summary
        summary = await gemini_service.generate_summary(
            file_id=file_id,
            summary_type=summary_type,
        )

        # Update document
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.summary = summary
            db.commit()

    except Exception as e:
        print(f"Error generating summary for document {document_id}: {str(e)}")
        # Save error to document
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.summary = f"Error: {str(e)}"
            db.commit()
    finally:
        db.close()


async def process_schema_generation(
    document_id: int,
    file_id: str,
    diagram_type: str,
    detail_level: str,
    db_url: str,
):
    """
    Background task to generate Mermaid schema

    Args:
        document_id: Document ID
        file_id: Gemini file ID
        diagram_type: Type of diagram
        detail_level: Level of detail
        db_url: Database URL for new session
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Generate schema
        mermaid_schema = await gemini_service.generate_mermaid_schema(
            file_id=file_id,
            diagram_type=diagram_type,
            detail_level=detail_level,
        )

        # Update document (only if default parameters)
        if diagram_type == "auto" and detail_level == "compact":
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.mermaid_schema = mermaid_schema
                db.commit()

    except Exception as e:
        print(f"Error generating schema for document {document_id}: {str(e)}")
        # Save error schema
        if diagram_type == "auto" and detail_level == "compact":
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.mermaid_schema = f"graph TD\\n    A[Error: {str(e)}]"
                db.commit()
    finally:
        db.close()


async def process_quiz_generation(
    quiz_id: str,
    file_ids: list[str],
    question_count: int,
    question_type: str,
    difficulty: str,
    language: str,
    user_id: int,
    document_ids: list[int],
    quiz_storage: dict,
):
    """
    Background task to generate quiz questions

    Args:
        quiz_id: Quiz ID
        file_ids: List of Gemini file IDs
        question_count: Number of questions
        question_type: Type of questions
        difficulty: Difficulty level
        language: Language for quiz
        user_id: User ID
        document_ids: List of document IDs
        quiz_storage: Shared quiz storage dictionary
    """
    try:
        from datetime import datetime
        
        # Generate quiz using Gemini
        quiz_data = await gemini_service.generate_quiz(
            file_ids=file_ids,
            question_count=question_count,
            question_type=question_type,
            difficulty=difficulty,
            language=language,
        )

        # Update quiz storage with generated questions
        if quiz_id in quiz_storage:
            quiz_storage[quiz_id]["questions"] = quiz_data["questions"]
            quiz_storage[quiz_id]["status"] = "ready"
            quiz_storage[quiz_id]["question_count"] = len(quiz_data["questions"])
        else:
            # Create new entry if it doesn't exist
            quiz_storage[quiz_id] = {
                "document_ids": document_ids,
                "file_ids": file_ids,
                "questions": quiz_data["questions"],
                "question_count": len(quiz_data["questions"]),
                "question_type": question_type,
                "difficulty": difficulty,
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "status": "ready",
            }

    except Exception as e:
        print(f"Error generating quiz {quiz_id}: {str(e)}")
        # Mark quiz as failed in storage
        if quiz_id in quiz_storage:
            quiz_storage[quiz_id]["status"] = "error"
            quiz_storage[quiz_id]["error"] = str(e)
