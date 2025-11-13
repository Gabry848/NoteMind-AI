"""
Analytics API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation, Message
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get analytics overview for the current user
    
    Returns statistics about documents, conversations, messages, and activity trends
    """
    # Total documents
    total_documents = db.query(Document).filter(Document.user_id == current_user.id).count()
    ready_documents = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.status == "ready"
    ).count()
    processing_documents = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.status == "processing"
    ).count()
    
    # Total storage used
    total_storage = db.query(func.sum(Document.file_size)).filter(
        Document.user_id == current_user.id
    ).scalar() or 0
    
    # Conversations statistics
    total_conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).count()
    
    # Messages statistics
    total_messages = db.query(Message).join(Conversation).filter(
        Conversation.user_id == current_user.id
    ).count()
    
    user_messages = db.query(Message).join(Conversation).filter(
        Conversation.user_id == current_user.id,
        Message.role == "user"
    ).count()
    
    ai_messages = db.query(Message).join(Conversation).filter(
        Conversation.user_id == current_user.id,
        Message.role == "assistant"
    ).count()
    
    # Calculate activity for the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    recent_documents = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.created_at >= thirty_days_ago
    ).count()
    
    recent_conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id,
        Conversation.created_at >= thirty_days_ago
    ).count()
    
    recent_messages = db.query(Message).join(Conversation).filter(
        Conversation.user_id == current_user.id,
        Message.created_at >= thirty_days_ago
    ).count()
    
    # Most active documents (by conversation count)
    most_active_docs = db.query(
        Document.id,
        Document.original_filename,
        func.count(Conversation.id).label("conversation_count")
    ).join(
        Conversation, Document.id == Conversation.document_id
    ).filter(
        Document.user_id == current_user.id
    ).group_by(
        Document.id, Document.original_filename
    ).order_by(
        desc("conversation_count")
    ).limit(5).all()
    
    # File type distribution
    file_type_stats = db.query(
        Document.file_type,
        func.count(Document.id).label("count"),
        func.sum(Document.file_size).label("total_size")
    ).filter(
        Document.user_id == current_user.id
    ).group_by(
        Document.file_type
    ).all()
    
    return {
        "documents": {
            "total": total_documents,
            "ready": ready_documents,
            "processing": processing_documents,
            "total_storage_bytes": total_storage,
            "total_storage_mb": round(total_storage / (1024 * 1024), 2),
            "recent_uploads": recent_documents
        },
        "conversations": {
            "total": total_conversations,
            "recent": recent_conversations
        },
        "messages": {
            "total": total_messages,
            "user_messages": user_messages,
            "ai_messages": ai_messages,
            "recent": recent_messages
        },
        "most_active_documents": [
            {
                "id": doc.id,
                "filename": doc.original_filename,
                "conversation_count": doc.conversation_count
            }
            for doc in most_active_docs
        ],
        "file_types": [
            {
                "type": ft.file_type,
                "count": ft.count,
                "total_size_mb": round(ft.total_size / (1024 * 1024), 2)
            }
            for ft in file_type_stats
        ]
    }


@router.get("/activity")
async def get_activity_timeline(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Get activity timeline for the specified number of days
    
    Args:
        days: Number of days to look back (default: 7)
    """
    if days < 1 or days > 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days must be between 1 and 90"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Documents uploaded per day
    doc_activity = db.query(
        func.date(Document.created_at).label("date"),
        func.count(Document.id).label("count")
    ).filter(
        Document.user_id == current_user.id,
        Document.created_at >= start_date
    ).group_by(
        func.date(Document.created_at)
    ).all()
    
    # Messages sent per day
    msg_activity = db.query(
        func.date(Message.created_at).label("date"),
        func.count(Message.id).label("count")
    ).join(Conversation).filter(
        Conversation.user_id == current_user.id,
        Message.created_at >= start_date,
        Message.role == "user"
    ).group_by(
        func.date(Message.created_at)
    ).all()
    
    # Conversations started per day
    conv_activity = db.query(
        func.date(Conversation.created_at).label("date"),
        func.count(Conversation.id).label("count")
    ).filter(
        Conversation.user_id == current_user.id,
        Conversation.created_at >= start_date
    ).group_by(
        func.date(Conversation.created_at)
    ).all()
    
    # Create a dictionary to merge all activities
    activity_dict = {}
    
    # Initialize all dates with zero values
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=i)).date()
        activity_dict[str(date)] = {
            "date": str(date),
            "documents": 0,
            "messages": 0,
            "conversations": 0
        }
    
    # Fill in the actual values
    for item in doc_activity:
        date_str = str(item.date)
        if date_str in activity_dict:
            activity_dict[date_str]["documents"] = item.count
    
    for item in msg_activity:
        date_str = str(item.date)
        if date_str in activity_dict:
            activity_dict[date_str]["messages"] = item.count
    
    for item in conv_activity:
        date_str = str(item.date)
        if date_str in activity_dict:
            activity_dict[date_str]["conversations"] = item.count
    
    # Convert to list and sort by date
    result = sorted(activity_dict.values(), key=lambda x: x["date"])
    
    return result


@router.get("/summary")
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a quick analytics summary with key metrics
    """
    # Get recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_docs = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.created_at >= seven_days_ago
    ).count()
    
    recent_chats = db.query(Message).join(Conversation).filter(
        Conversation.user_id == current_user.id,
        Message.created_at >= seven_days_ago,
        Message.role == "user"
    ).count()
    
    # Average messages per conversation
    avg_messages = db.query(
        func.avg(func.count(Message.id))
    ).join(Conversation).filter(
        Conversation.user_id == current_user.id
    ).group_by(
        Conversation.id
    ).scalar() or 0
    
    # Most used file type
    most_used_type = db.query(
        Document.file_type,
        func.count(Document.id).label("count")
    ).filter(
        Document.user_id == current_user.id
    ).group_by(
        Document.file_type
    ).order_by(
        desc("count")
    ).first()
    
    return {
        "recent_uploads": recent_docs,
        "recent_chats": recent_chats,
        "avg_messages_per_conversation": round(float(avg_messages), 1),
        "most_used_file_type": most_used_type.file_type if most_used_type else None,
        "period_days": 7
    }
