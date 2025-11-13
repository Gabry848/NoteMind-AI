"""
Chat API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation, Message
from app.utils.dependencies import get_current_user
from app.services.gemini_service import gemini_service
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage, ConversationResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a chat message

    Args:
        chat_request: Chat request data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Chat response with AI message
    """
    # Verify document belongs to user
    document = (
        db.query(Document)
        .filter(
            Document.id == chat_request.document_id,
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
            document_id=document.id,
            title=chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message,
        )
        db.add(conversation)
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

    try:
        # Get conversation history
        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at)
            .all()
        )

        history = [{"role": msg.role, "content": msg.content} for msg in messages[:-1]]  # Exclude current message

        # Get AI response
        response_text, citations = await gemini_service.chat_with_document(
            query=chat_request.message,
            file_id=document.gemini_file_id,
            conversation_history=history,
        )

        # Save AI message
        ai_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=response_text,
            citations=citations if citations else None,
        )
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)

        return ChatResponse(
            conversation_id=conversation.id,
            message=ChatMessage(
                role=ai_message.role,
                content=ai_message.content,
                citations=ai_message.citations,
                created_at=ai_message.created_at,
            ),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}",
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

        result.append(
            ConversationResponse(
                id=conv.id,
                document_id=conv.document_id,
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
