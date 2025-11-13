"""
Chat schemas for request/response validation
"""
from pydantic import BaseModel, field_validator
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

    document_id: Optional[int] = None  # Single document (backward compatibility)
    document_ids: Optional[List[int]] = None  # Multiple documents
    message: str
    conversation_id: Optional[int] = None

    @field_validator('document_ids', 'document_id')
    def validate_documents(cls, v, info):
        """Ensure at least one document is specified"""
        return v

    def get_document_ids(self) -> List[int]:
        """Get list of document IDs from request"""
        if self.document_ids:
            return self.document_ids
        elif self.document_id:
            return [self.document_id]
        return []


class ChatResponse(BaseModel):
    """Schema for chat response"""

    conversation_id: int
    message: ChatMessage
    context: Optional[str] = None


class ConversationResponse(BaseModel):
    """Schema for conversation response"""

    id: int
    document_id: Optional[int] = None  # Backward compatibility
    document_ids: List[int] = []  # Multiple documents
    title: str
    created_at: datetime
    messages: List[ChatMessage]

    class Config:
        from_attributes = True

