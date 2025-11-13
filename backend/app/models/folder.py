"""
Folder model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Folder(Base):
    """Folder model for organizing documents"""

    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("folders.id"), nullable=True)  # For nested folders
    color = Column(String, default="#3B82F6")  # Hex color code
    icon = Column(String, default="📁")  # Emoji or icon identifier
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="folders")
    documents = relationship("Document", back_populates="folder")
    
    # Self-referential relationship for nested folders
    children = relationship(
        "Folder",
        backref="parent",
        remote_side=[id],
        cascade="all, delete"
    )

    def __repr__(self):
        return f"<Folder {self.name}>"
