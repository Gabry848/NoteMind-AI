"""
Quiz schemas for request/response validation
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Literal


class QuizOption(BaseModel):
    """Schema for a single quiz option in multiple choice questions"""
    id: str
    text: str


class QuizQuestion(BaseModel):
    """Schema for a quiz question"""
    id: str
    question: str
    type: Literal["multiple_choice", "open_ended"]
    options: Optional[List[QuizOption]] = None  # Only for multiple_choice
    correct_answer: Optional[str] = None  # For internal use only


class QuizCreateRequest(BaseModel):
    """Schema for quiz creation request"""
    document_ids: List[int] = Field(..., min_length=1, description="List of document IDs to base the quiz on")
    question_count: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")
    question_type: Literal["multiple_choice", "open_ended", "mixed"] = Field(
        default="mixed",
        description="Type of questions to generate"
    )
    difficulty: Literal["easy", "medium", "hard"] = Field(
        default="medium",
        description="Difficulty level of the quiz"
    )
    language: Optional[str] = Field(
        default=None,
        description="Language for quiz questions (it, en, es, fr, de, etc.). If not provided, user's preferred language is used"
    )


class QuizResponse(BaseModel):
    """Schema for quiz response (without answers)"""
    quiz_id: str
    document_ids: List[int]
    questions: List[QuizQuestion]
    question_count: int
    question_type: str
    difficulty: str
    created_at: datetime


class UserAnswer(BaseModel):
    """Schema for a user's answer to a question"""
    question_id: str
    answer: str


class QuizSubmission(BaseModel):
    """Schema for quiz submission"""
    quiz_id: str
    answers: List[UserAnswer]


class QuestionCorrection(BaseModel):
    """Schema for a single question correction"""
    question_id: str
    question: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str
    score: float  # 0.0 to 1.0


class QuizCorrectionResponse(BaseModel):
    """Schema for quiz correction response"""
    quiz_id: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    corrections: List[QuestionCorrection]
    overall_feedback: str
    created_at: datetime


class QuizResultResponse(BaseModel):
    """Schema for quiz result summary"""
    id: int
    quiz_id: str
    question_count: int
    question_type: str
    difficulty: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    overall_feedback: Optional[str]
    document_ids: List[int]
    completed_at: datetime
    created_at: datetime


class SharedQuizCreate(BaseModel):
    """Schema for creating a shared quiz"""
    quiz_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    expires_in_days: Optional[int] = Field(None, ge=1, le=365, description="Number of days until expiration")


class SharedQuizResponse(BaseModel):
    """Schema for shared quiz response"""
    id: int
    share_token: str
    quiz_id: str
    title: Optional[str]
    description: Optional[str]
    question_count: int
    question_type: str
    difficulty: str
    view_count: int
    completion_count: int
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime


class SharedQuizSubmission(BaseModel):
    """Schema for shared quiz submission (no quiz_id needed, it's in the URL)"""
    answers: List[UserAnswer]
