"""
OCR service for extracting text from images
"""
import os
import re
from typing import Tuple
from pathlib import Path
import google.generativeai as genai
from PIL import Image
from app.core.config import settings


class OCRService:
    """Service for OCR and text processing from images"""

    def __init__(self):
        """Initialize OCR service"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def extract_text_from_image(self, image_path: str) -> str:
        """
        Extract text from image using Gemini Vision
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Extracted text from the image
        """
        try:
            # Open and process image
            image = Image.open(image_path)
            
            # Use Gemini Vision to extract text
            prompt = """Extract all text from this image. 
This appears to be a handwritten or printed note/document page.

Instructions:
1. Extract ALL text you can see in the image
2. Preserve the original structure and paragraphs
3. If you see any handwriting, do your best to interpret it accurately
4. Ignore any non-text elements (drawings, decorations, etc.)
5. Return ONLY the extracted text, no explanations or additional comments

Extracted text:"""

            response = self.model.generate_content(
                [prompt, image],
                generation_config=genai.GenerationConfig(
                    temperature=0.1,  # Low temperature for accuracy
                    max_output_tokens=2048,
                ),
            )

            extracted_text = response.text.strip()
            
            if not extracted_text or len(extracted_text) < 10:
                raise Exception("No substantial text was extracted from the image")
            
            return extracted_text

        except Exception as e:
            raise Exception(f"Failed to extract text from image: {str(e)}")

    async def correct_and_improve_text(self, raw_text: str) -> str:
        """
        Correct OCR errors and improve text quality
        
        Args:
            raw_text: Raw extracted text from OCR
            
        Returns:
            Corrected and improved text
        """
        try:
            prompt = f"""You are an expert text correction assistant. You have received text that was extracted from an image (OCR).

Original text:
{raw_text}

Your task:
1. Fix any OCR errors (broken words, typos, misread characters)
2. Fix incomplete or truncated sentences
3. Correct spacing and punctuation
4. Maintain the original meaning and content
5. DO NOT add new information or content that wasn't in the original
6. DO NOT remove any substantive content
7. Keep the same language as the original text

Return only the corrected text, no explanations."""

            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=2048,
                ),
            )

            return response.text.strip()

        except Exception as e:
            raise Exception(f"Failed to correct text: {str(e)}")

    async def format_as_markdown(self, text: str) -> str:
        """
        Format text as markdown with proper structure
        
        Args:
            text: Corrected text
            
        Returns:
            Text formatted in markdown
        """
        try:
            prompt = f"""Convert the following text to well-structured markdown format.

Text:
{text}

Instructions:
1. Add appropriate markdown headings (# ## ###) where suitable
2. Format lists as markdown lists (- or 1. 2. 3.)
3. Use **bold** for emphasis where appropriate
4. Use `code` formatting for any code or technical terms
5. Add proper paragraph breaks
6. Keep ALL the original content - don't remove anything
7. Maintain the same language as the original
8. Make it clean and readable

Return only the markdown formatted text."""

            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.4,
                    max_output_tokens=2048,
                ),
            )

            return response.text.strip()

        except Exception as e:
            raise Exception(f"Failed to format as markdown: {str(e)}")

    async def generate_document_title(self, text: str) -> str:
        """
        Generate a short, descriptive title for the document
        
        Args:
            text: Document text content
            
        Returns:
            Short descriptive title (max 60 chars)
        """
        try:
            prompt = f"""Based on the following text content, generate a SHORT and DESCRIPTIVE title.

Content:
{text[:500]}...

Requirements:
1. Maximum 6 words
2. Descriptive and clear
3. Captures the main topic
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
            
            return safe_title if safe_title else "document"

        except Exception as e:
            print(f"Failed to generate title: {str(e)}")
            return "document"

    async def process_image_to_document(self, image_path: str) -> Tuple[str, str]:
        """
        Complete pipeline: Extract text, correct, format, and generate title
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Tuple of (markdown_content, document_title)
        """
        try:
            print("Step 1: Extracting text from image...")
            raw_text = await self.extract_text_from_image(image_path)
            
            print("Step 2: Correcting text errors...")
            corrected_text = await self.correct_and_improve_text(raw_text)
            
            print("Step 3: Formatting as markdown...")
            markdown_text = await self.format_as_markdown(corrected_text)
            
            print("Step 4: Generating document title...")
            title = await self.generate_document_title(corrected_text)
            
            return markdown_text, title

        except Exception as e:
            raise Exception(f"Failed to process image: {str(e)}")


# Global instance
ocr_service = OCRService()
