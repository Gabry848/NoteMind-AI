"""
Summary generation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.utils.dependencies import get_current_user
from app.services.gemini_service import gemini_service
from app.utils.background_tasks import process_summary_generation
from app.schemas.document import SummaryRequest, SummaryResponse

router = APIRouter(prefix="/summaries", tags=["Summaries"])


@router.post("/generate", response_model=SummaryResponse)
async def generate_summary(
    summary_request: SummaryRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a summary for a document

    Args:
        summary_request: Summary request data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Generated summary and key topics
    """
    # Verify document belongs to user
    document = (
        db.query(Document)
        .filter(
            Document.id == summary_request.document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if document.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document is not ready. Status: {document.status}",
        )

    # Start background task to generate summary
    background_tasks.add_task(
        process_summary_generation,
        document_id=document.id,
        file_id=document.gemini_file_id,
        summary_type=summary_request.summary_type,
        db_url=settings.DATABASE_URL,
    )

    # Return immediately with processing status
    return SummaryResponse(
        document_id=document.id,
        summary="Generating summary in background...",
        topics=[],
    )


@router.get("/{document_id}", response_model=SummaryResponse)
async def get_summary(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get existing summary for a document

    Args:
        document_id: Document ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Document summary and topics
    """
    # Verify document belongs to user
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if not document.summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not generated yet. Generate one first.",
        )

    # Get topics (or empty list if not cached)
    topics = []
    if document.gemini_file_id:
        try:
            topics = await gemini_service.extract_key_topics(document.gemini_file_id)
        except:
            pass

    return SummaryResponse(
        document_id=document.id,
        summary=document.summary,
        topics=topics,
    )
