"""
Chat API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation, Message
from app.utils.dependencies import get_current_user
from app.services.gemini_service import gemini_service
from app.utils.background_tasks import process_chat_response_sync
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage, ConversationResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a chat message (supports single or multiple documents)

    Args:
        chat_request: Chat request data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Chat response with AI message
    """
    # Get document IDs from request
    document_ids = chat_request.get_document_ids()
    
    if not document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document ID is required",
        )

    # Verify all documents belong to user and are ready
    documents = (
        db.query(Document)
        .filter(
            Document.id.in_(document_ids),
            Document.user_id == current_user.id,
        )
        .all()
    )

    if len(documents) != len(document_ids):
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

    # Get or create conversation
    if chat_request.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == chat_request.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
    else:
        # Create new conversation
        conversation = Conversation(
            user_id=current_user.id,
            document_id=document_ids[0] if len(document_ids) == 1 else None,  # Backward compatibility
            title=chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message,
        )
        db.add(conversation)
        db.flush()  # Get conversation ID
        
        # Associate documents with conversation
        for doc in documents:
            conversation.documents.append(doc)
        
        db.commit()
        db.refresh(conversation)

    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=chat_request.message,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Get conversation history
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
        .all()
    )

    history = [{"role": msg.role, "content": msg.content} for msg in messages[:-1]]  # Exclude current message

    # Generate AI response in thread pool (non-blocking)
    file_ids = [doc.gemini_file_id for doc in documents]
    is_multi = len(documents) > 1

    try:
        response_text, citations = await run_in_threadpool(
            process_chat_response_sync,
            conversation_id=conversation.id,
            message=chat_request.message,
            file_ids=file_ids,
            history=history,
            is_multi_document=is_multi,
        )
    except Exception as e:
        response_text = f"Error generating response: {str(e)}"
        citations = None

    # Save AI response to database
    ai_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=response_text,
        citations=citations if citations else None,
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)

    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    db.commit()

    # Return with the actual AI response
    return ChatResponse(
        conversation_id=conversation.id,
        message=ChatMessage(
            role="assistant",
            content=response_text,
            citations=citations,
            created_at=ai_message.created_at,
        ),
    )


@router.get("/history/{document_id}", response_model=list[ConversationResponse])
async def get_conversation_history(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get conversation history for a document

    Args:
        document_id: Document ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of conversations with messages
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

    # Get conversations
    conversations = (
        db.query(Conversation)
        .filter(Conversation.document_id == document_id, Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    result = []
    for conv in conversations:
        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at)
            .all()
        )

        # Get document IDs for this conversation
        doc_ids = [doc.id for doc in conv.documents] if conv.documents else []
        if not doc_ids and conv.document_id:  # Backward compatibility
            doc_ids = [conv.document_id]

        result.append(
            ConversationResponse(
                id=conv.id,
                document_id=conv.document_id,
                document_ids=doc_ids,
                title=conv.title,
                created_at=conv.created_at,
                messages=[
                    ChatMessage(
                        role=msg.role,
                        content=msg.content,
                        citations=msg.citations,
                        created_at=msg.created_at,
                    )
                    for msg in messages
                ],
            )
        )

    return result


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a conversation

    Args:
        conversation_id: Conversation ID
        current_user: Current authenticated user
        db: Database session
    """
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    db.delete(conversation)
    db.commit()

    return None
