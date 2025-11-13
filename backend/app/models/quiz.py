"""
Quiz models for database
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


# Association table for quiz_results and documents (many-to-many)
quiz_result_documents = Table(
    'quiz_result_documents',
    Base.metadata,
    Column('quiz_result_id', Integer, ForeignKey('quiz_results.id', ondelete='CASCADE'), primary_key=True),
    Column('document_id', Integer, ForeignKey('documents.id', ondelete='CASCADE'), primary_key=True)
)


class QuizResult(Base):
    """Model for storing quiz results"""
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Quiz configuration
    question_count = Column(Integer, nullable=False)
    question_type = Column(String(50), nullable=False)  # multiple_choice, open_ended, mixed
    difficulty = Column(String(50), nullable=False)  # easy, medium, hard
    
    # Quiz results
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    
    # Store questions and corrections as JSON (Text field)
    questions_data = Column(Text, nullable=False)  # JSON string
    corrections_data = Column(Text, nullable=False)  # JSON string
    overall_feedback = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", backref="quiz_results")
    documents = relationship("Document", secondary=quiz_result_documents, backref="quiz_results")


class SharedQuiz(Base):
    """Model for publicly shared quizzes"""
    __tablename__ = "shared_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    share_token = Column(String(255), unique=True, index=True, nullable=False)
    quiz_id = Column(String(255), nullable=False)  # Original quiz_id from storage
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Quiz data (stored as JSON)
    questions_data = Column(Text, nullable=False)  # JSON string with questions
    correct_answers_data = Column(Text, nullable=False)  # JSON string with correct answers
    
    # Quiz configuration
    question_count = Column(Integer, nullable=False)
    question_type = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    
    # Metadata
    title = Column(String(255))
    description = Column(Text)
    
    # Stats
    view_count = Column(Integer, default=0)
    completion_count = Column(Integer, default=0)
    
    # Control
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)  # Optional expiration
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", backref="shared_quizzes")

    @staticmethod
    def generate_share_token():
        """Generate a unique share token"""
        return str(uuid.uuid4())
