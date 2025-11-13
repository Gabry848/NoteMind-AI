"""
File handling utilities
"""
import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile
from app.core.config import settings


class FileHandler:
    """Utility class for handling file operations"""

    @staticmethod
    def ensure_upload_dir():
        """Ensure upload directory exists"""
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir

    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Get file extension"""
        return Path(filename).suffix.lower()

    @staticmethod
    def is_allowed_file(filename: str) -> bool:
        """Check if file extension is allowed"""
        ext = FileHandler.get_file_extension(filename)
        return ext in settings.ALLOWED_EXTENSIONS

    @staticmethod
    async def save_upload_file(upload_file: UploadFile) -> Tuple[str, str]:
        """
        Save uploaded file to disk

        Args:
            upload_file: FastAPI UploadFile object

        Returns:
            Tuple of (file_path, unique_filename)
        """
        # Ensure directory exists
        upload_dir = FileHandler.ensure_upload_dir()

        # Generate unique filename
        ext = FileHandler.get_file_extension(upload_file.filename)
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = upload_dir / unique_filename

        # Save file
        with open(file_path, "wb") as f:
            content = await upload_file.read()
            f.write(content)

        return str(file_path), unique_filename

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Delete file from disk

        Args:
            file_path: Path to file

        Returns:
            True if successful
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Failed to delete file: {str(e)}")
            return False

    @staticmethod
    def get_file_size(file_path: str) -> int:
        """Get file size in bytes"""
        return os.path.getsize(file_path) if os.path.exists(file_path) else 0
