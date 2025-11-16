"""
Media transcription service for audio and video files
"""
import os
import re
from typing import Tuple
from pathlib import Path
import google.generativeai as genai
from app.core.config import settings


class MediaService:
    """Service for transcribing audio and video files"""

    def __init__(self):
        """Initialize media service"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    def is_audio_file(self, file_path: str) -> bool:
        """Check if file is audio"""
        ext = Path(file_path).suffix.lower()
        return ext in ['.mp3', '.wav', '.m4a', '.ogg', '.flac']

    def is_video_file(self, file_path: str) -> bool:
        """Check if file is video"""
        ext = Path(file_path).suffix.lower()
        return ext in ['.mp4', '.avi', '.mov', '.webm', '.mkv']

    async def transcribe_media(self, file_path: str) -> str:
        """
        Transcribe audio or video file using Gemini API

        Args:
            file_path: Path to the media file

        Returns:
            Transcribed text from the media file
        """
        try:
            # Upload file to Gemini API for processing
            print(f"Uploading media file to Gemini API: {file_path}")
            uploaded_file = genai.upload_file(file_path)

            # Wait for file to be processed
            print("Waiting for file processing...")
            import time
            while uploaded_file.state.name == "PROCESSING":
                time.sleep(2)
                uploaded_file = genai.get_file(uploaded_file.name)

            if uploaded_file.state.name == "FAILED":
                raise Exception("File processing failed")

            # Create transcription prompt
            media_type = "audio" if self.is_audio_file(file_path) else "video"
            prompt = f"""You are an expert transcription assistant. Please transcribe this {media_type} file.

Instructions:
1. Transcribe ALL spoken content accurately
2. Use proper punctuation and paragraph breaks
3. If multiple speakers, indicate speaker changes (Speaker 1:, Speaker 2:, etc.)
4. Include timestamps for major sections if the content is long (e.g., [00:00] Introduction)
5. Note any important non-verbal sounds in [brackets] if relevant (e.g., [music], [applause])
6. Maintain the original language of the speech
7. Return ONLY the transcription, no additional comments

Transcription:"""

            # Generate transcription
            response = self.model.generate_content(
                [prompt, uploaded_file],
                generation_config=genai.GenerationConfig(
                    temperature=0.1,  # Low temperature for accuracy
                    max_output_tokens=8192,  # Allow longer transcriptions
                ),
            )

            transcribed_text = response.text.strip()

            # Clean up the uploaded file from Gemini
            try:
                genai.delete_file(uploaded_file.name)
            except:
                pass

            if not transcribed_text or len(transcribed_text) < 10:
                raise Exception("No substantial content was transcribed from the media file")

            return transcribed_text

        except Exception as e:
            raise Exception(f"Failed to transcribe media: {str(e)}")

    async def format_transcription_as_markdown(self, text: str, media_type: str) -> str:
        """
        Format transcription as markdown with proper structure

        Args:
            text: Transcribed text
            media_type: 'audio' or 'video'

        Returns:
            Text formatted in markdown
        """
        try:
            prompt = f"""Convert the following {media_type} transcription to well-structured markdown format.

Transcription:
{text}

Instructions:
1. Add a main title (# Transcription)
2. Add section headings (## ###) where appropriate based on topic changes
3. Format speaker labels as **Speaker Name:** if present
4. Keep timestamps in their original format
5. Format lists as markdown lists where appropriate
6. Add paragraph breaks for better readability
7. Keep ALL the original content - don't remove anything
8. Maintain the same language as the original
9. Use `code` formatting for technical terms if any
10. Make it clean and easy to read

Return only the markdown formatted text."""

            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.4,
                    max_output_tokens=8192,
                ),
            )

            return response.text.strip()

        except Exception as e:
            raise Exception(f"Failed to format transcription: {str(e)}")

    async def generate_media_title(self, text: str, file_path: str) -> str:
        """
        Generate a short, descriptive title for the media file

        Args:
            text: Transcribed content
            file_path: Original file path (for fallback)

        Returns:
            Short descriptive title
        """
        try:
            prompt = f"""Based on the following transcription, generate a SHORT and DESCRIPTIVE title.

Content:
{text[:800]}...

Requirements:
1. Maximum 6 words
2. Descriptive and clear
3. Captures the main topic or subject
4. No special characters except hyphens
5. Same language as the content
6. Return ONLY the title, nothing else

Title:"""

            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.5,
                    max_output_tokens=64,
                ),
            )

            title = response.text.strip()

            # Clean up the title
            title = re.sub(r'[^\w\s-]', '', title)
            title = re.sub(r'\s+', ' ', title)
            title = title[:60]  # Max 60 chars

            # Create safe filename
            safe_title = title.replace(' ', '_').lower()
            safe_title = re.sub(r'[^\w-]', '', safe_title)

            return safe_title if safe_title else "transcription"

        except Exception as e:
            print(f"Failed to generate title: {str(e)}")
            # Fallback to original filename
            return Path(file_path).stem

    async def get_media_duration(self, file_path: str) -> int:
        """
        Get media file duration in seconds (if possible)

        Args:
            file_path: Path to media file

        Returns:
            Duration in seconds (0 if unable to determine)
        """
        try:
            # Try to get duration using file metadata
            # For now, return 0 as this would require additional libraries (ffmpeg)
            # This can be enhanced later with proper media info extraction
            return 0
        except Exception as e:
            print(f"Failed to get media duration: {str(e)}")
            return 0

    async def process_media_to_document(self, file_path: str) -> Tuple[str, str, int]:
        """
        Complete pipeline: Transcribe, format, and generate title

        Args:
            file_path: Path to the media file

        Returns:
            Tuple of (markdown_content, document_title, duration_seconds)
        """
        try:
            media_type = "audio" if self.is_audio_file(file_path) else "video"

            print(f"Step 1: Transcribing {media_type} file...")
            transcribed_text = await self.transcribe_media(file_path)

            print("Step 2: Formatting transcription as markdown...")
            markdown_text = await self.format_transcription_as_markdown(transcribed_text, media_type)

            print("Step 3: Generating document title...")
            title = await self.generate_media_title(transcribed_text, file_path)

            print("Step 4: Getting media duration...")
            duration = await self.get_media_duration(file_path)

            return markdown_text, title, duration

        except Exception as e:
            raise Exception(f"Failed to process {media_type}: {str(e)}")


# Global instance
media_service = MediaService()
