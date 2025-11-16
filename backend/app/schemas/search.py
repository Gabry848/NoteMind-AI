"""
Search schemas for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SearchFilters(BaseModel):
    """Schema for search filters"""

    file_types: Optional[List[str]] = None  # e.g., [".pdf", ".md"]
    folder_ids: Optional[List[int]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    status: Optional[str] = None  # processing, ready, error


class SearchRequest(BaseModel):
    """Schema for search request"""

    query: str
    filters: Optional[SearchFilters] = None
    sort_by: str = "relevance"  # relevance, date_desc, date_asc, name_asc, name_desc
    limit: int = 50
    offset: int = 0


class DocumentSearchResult(BaseModel):
    """Schema for document search result"""

    id: int
    filename: str
    original_filename: str
    file_type: str
    folder_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    highlight: Optional[str] = None  # Snippet with highlighted match

    class Config:
        from_attributes = True


class ConversationSearchResult(BaseModel):
    """Schema for conversation search result"""

    id: int
    conversation_id: int
    document_id: Optional[int]
    title: str
    message_content: str
    created_at: datetime
    highlight: Optional[str] = None

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    """Schema for search response"""

    documents: List[DocumentSearchResult]
    conversations: List[ConversationSearchResult]
    total_documents: int
    total_conversations: int
    query: str


class SearchSuggestion(BaseModel):
    """Schema for search suggestion"""

    text: str
    type: str  # document, folder, recent_search


class SearchSuggestionsResponse(BaseModel):
    """Schema for search suggestions response"""

    suggestions: List[SearchSuggestion]
