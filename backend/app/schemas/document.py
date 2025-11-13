"""
Document schemas for request/response validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentResponse(BaseModel):
    """Schema for document response"""

    id: int
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    folder_id: Optional[int] = None
    status: str
    error_message: Optional[str]
    summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Schema for document list response"""

    documents: list[DocumentResponse]
    total: int


class DocumentUpdate(BaseModel):
    """Schema for document update request"""

    folder_id: Optional[int] = None


class SummaryRequest(BaseModel):
    """Schema for summary generation request"""

    document_id: int
    summary_type: str = "medium"  # brief, medium, detailed


class SummaryResponse(BaseModel):
    """Schema for summary response"""

    document_id: int
    summary: str
    topics: list[str]
