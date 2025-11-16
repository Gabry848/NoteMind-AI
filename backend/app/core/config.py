"""
Configuration management for NoteMind AI
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
env_path = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "NoteMind AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./notemind.db"

    # Security
    SECRET_KEY: str = "changeme"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days

    # Gemini API
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 52428800  # 50MB (per file multimediali)
    ALLOWED_EXTENSIONS: List[str] = [
        # Documenti
        ".pdf", ".txt", ".docx", ".json", ".md",
        # Codice
        ".py", ".js", ".ts",
        # Immagini
        ".jpg", ".jpeg", ".png", ".webp",
        # Audio
        ".mp3", ".wav", ".m4a", ".ogg", ".flac",
        # Video
        ".mp4", ".avi", ".mov", ".webm", ".mkv"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
