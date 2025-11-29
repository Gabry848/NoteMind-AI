"""
Quiz Template model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class QuizTemplate(Base):
    """Quiz Template model for saving quiz configurations"""

    __tablename__ = "quiz_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # Template name
    description = Column(String, nullable=True)  # Optional description
    settings = Column(JSON, nullable=False)  # Quiz configuration as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="quiz_templates")

    def __repr__(self):
        return f"<QuizTemplate {self.name}>"
