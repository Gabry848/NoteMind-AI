"""
Chat schemas for request/response validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict


class ChatMessage(BaseModel):
    """Schema for chat message"""

    role: str
    content: str
    citations: Optional[List[Dict]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """Schema for chat request"""

    document_id: int
    message: str
    conversation_id: Optional[int] = None


class ChatResponse(BaseModel):
    """Schema for chat response"""

    conversation_id: int
    message: ChatMessage
    context: Optional[str] = None


class ConversationResponse(BaseModel):
    """Schema for conversation response"""

    id: int
    document_id: int
    title: str
    created_at: datetime
    messages: List[ChatMessage]

    class Config:
        from_attributes = True
