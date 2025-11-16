"""
Document model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Document(Base):
    """Document model for uploaded files"""

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)  # Optional folder
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_content = Column(LargeBinary, nullable=True)  # Store file content in database
    file_size = Column(Integer, nullable=False)
    file_type = Column(String, nullable=False)
    gemini_file_id = Column(String, nullable=True)  # Gemini API file ID
    gemini_corpus_id = Column(String, nullable=True)  # For File Search
    status = Column(String, default="processing")  # processing, ready, error
    error_message = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    mermaid_schema = Column(Text, nullable=True)  # Mermaid diagram schema
    media_duration = Column(Integer, nullable=True)  # Duration in seconds for audio/video
    transcript_content = Column(Text, nullable=True)  # Transcription for media files
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="documents")
    folder = relationship("Folder", back_populates="documents")
    conversations = relationship("Conversation", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Document {self.filename}>"
