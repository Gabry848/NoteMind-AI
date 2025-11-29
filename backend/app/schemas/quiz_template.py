"""
Quiz Template schemas for request/response validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class QuizTemplateSettings(BaseModel):
    """Schema for quiz template settings"""
    num_questions: int
    quiz_type: str  # "multiple_choice", "open_ended", "mixed"
    difficulty: Optional[str] = "medium"  # "easy", "medium", "hard"
    language: Optional[str] = "it"


class QuizTemplateCreate(BaseModel):
    """Schema for creating a quiz template"""
    name: str
    description: Optional[str] = None
    settings: Dict[str, Any]


class QuizTemplateUpdate(BaseModel):
    """Schema for updating a quiz template"""
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class QuizTemplateResponse(BaseModel):
    """Schema for quiz template response"""
    id: int
    user_id: int
    name: str
    description: Optional[str]
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
