"""
Summary generation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.utils.dependencies import get_current_user
from app.services.gemini_service import gemini_service
from app.schemas.document import SummaryRequest, SummaryResponse

router = APIRouter(prefix="/summaries", tags=["Summaries"])


@router.post("/generate", response_model=SummaryResponse)
async def generate_summary(
    summary_request: SummaryRequest,
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

    try:
        # Generate summary
        summary = await gemini_service.generate_summary(
            file_id=document.gemini_file_id,
            summary_type=summary_request.summary_type,
        )

        # Extract key topics
        topics = await gemini_service.extract_key_topics(
            file_id=document.gemini_file_id
        )

        # Save summary to document
        document.summary = summary
        db.commit()

        return SummaryResponse(
            document_id=document.id,
            summary=summary,
            topics=topics,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}",
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
