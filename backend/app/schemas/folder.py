"""
Folder schemas for request/response validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class FolderBase(BaseModel):
    """Base schema for folder"""
    name: str
    parent_id: Optional[int] = None
    color: str = "#3B82F6"
    icon: str = "📁"


class FolderCreate(FolderBase):
    """Schema for creating a folder"""
    pass


class FolderUpdate(BaseModel):
    """Schema for updating a folder"""
    name: Optional[str] = None
    parent_id: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class FolderResponse(FolderBase):
    """Schema for folder response"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FolderWithChildren(FolderResponse):
    """Schema for folder with nested children"""
    children: List['FolderWithChildren'] = []
    document_count: int = 0


class FolderTreeResponse(BaseModel):
    """Schema for folder tree response"""
    folders: List[FolderWithChildren]
    total: int


# Enable forward references
FolderWithChildren.model_rebuild()
