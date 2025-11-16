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

    @staticmethod
    def read_file_content(file_path: str) -> str:
        """
        Read file content as text

        Args:
            file_path: Path to file

        Returns:
            File content as string
        """
        try:
            if not os.path.exists(file_path):
                return "File not found"

            ext = FileHandler.get_file_extension(file_path)

            # Handle text-based files
            if ext in ['.txt', '.md', '.json', '.py', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()

            # For PDF and DOCX, we'll return a message (these require special libraries)
            elif ext == '.pdf':
                return "PDF content preview not available. This file type requires special processing."
            elif ext in ['.doc', '.docx']:
                return "Word document content preview not available. This file type requires special processing."
            else:
                return f"Content preview not available for {ext} files"

        except Exception as e:
            return f"Error reading file: {str(e)}"

    @staticmethod
    def read_file_content_from_bytes(file_content: bytes, file_extension: str) -> str:
        """
        Read file content from bytes (database storage)

        Args:
            file_content: File content as bytes
            file_extension: File extension (e.g., '.txt', '.md')

        Returns:
            File content as string
        """
        try:
            if file_content is None:
                return "File content not available in database"

            # Handle text-based files
            if file_extension in ['.txt', '.md', '.json', '.py', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml']:
                return file_content.decode('utf-8')

            # For PDF and DOCX, we'll return a message
            elif file_extension == '.pdf':
                return "PDF content preview not available. This file type requires special processing."
            elif file_extension in ['.doc', '.docx']:
                return "Word document content preview not available. This file type requires special processing."
            else:
                return f"Content preview not available for {file_extension} files"

        except Exception as e:
            return f"Error reading file: {str(e)}"

    @staticmethod
    def is_media_file(filename: str) -> bool:
        """
        Check if file is audio or video

        Args:
            filename: File name or path

        Returns:
            True if file is audio or video
        """
        ext = FileHandler.get_file_extension(filename)
        return ext in ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.mp4', '.avi', '.mov', '.webm', '.mkv']

    @staticmethod
    def is_audio_file(filename: str) -> bool:
        """
        Check if file is audio

        Args:
            filename: File name or path

        Returns:
            True if file is audio
        """
        ext = FileHandler.get_file_extension(filename)
        return ext in ['.mp3', '.wav', '.m4a', '.ogg', '.flac']

    @staticmethod
    def is_video_file(filename: str) -> bool:
        """
        Check if file is video

        Args:
            filename: File name or path

        Returns:
            True if file is video
        """
        ext = FileHandler.get_file_extension(filename)
        return ext in ['.mp4', '.avi', '.mov', '.webm', '.mkv']
