"""
Gemini AI service for file search and RAG
"""
import os
from typing import List, Dict, Optional, Tuple
import google.generativeai as genai
from app.core.config import settings


class GeminiService:
    """Service for interacting with Google Gemini API"""

    def __init__(self):
        """Initialize Gemini service"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def upload_file(self, file_path: str, display_name: str) -> str:
        """
        Upload a file to Gemini API

        Args:
            file_path: Path to the file to upload
            display_name: Display name for the file

        Returns:
            File ID from Gemini API
        """
        try:
            file = genai.upload_file(path=file_path, display_name=display_name)
            return file.name
        except Exception as e:
            raise Exception(f"Failed to upload file to Gemini: {str(e)}")

    async def delete_file(self, file_id: str) -> bool:
        """
        Delete a file from Gemini API

        Args:
            file_id: File ID to delete

        Returns:
            True if successful
        """
        try:
            genai.delete_file(name=file_id)
            return True
        except Exception as e:
            print(f"Failed to delete file from Gemini: {str(e)}")
            return False

    async def get_file_info(self, file_id: str) -> Optional[Dict]:
        """
        Get file information from Gemini API

        Args:
            file_id: File ID

        Returns:
            File information dictionary
        """
        try:
            file = genai.get_file(name=file_id)
            return {
                "name": file.name,
                "display_name": file.display_name,
                "size_bytes": file.size_bytes,
                "state": file.state.name,
            }
        except Exception as e:
            print(f"Failed to get file info: {str(e)}")
            return None

    async def chat_with_document(
        self,
        query: str,
        file_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[str, List[Dict]]:
        """
        Chat with a document using RAG

        Args:
            query: User query
            file_id: Gemini file ID
            conversation_history: Previous conversation messages

        Returns:
            Tuple of (response text, citations)
        """
        try:
            # Build the prompt with context
            prompt_parts = []

            # Add system instruction
            prompt_parts.append(
                "You are a helpful AI assistant that answers questions based on the provided document. "
                "Always cite specific parts of the document when answering. "
                "If the answer is not in the document, say so clearly."
            )

            # Add conversation history
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    prompt_parts.append(f"{msg['role']}: {msg['content']}")

            # Add current query
            prompt_parts.append(f"user: {query}")

            # Get the file
            file = genai.get_file(name=file_id)

            # Generate response with file context
            response = self.model.generate_content(
                ["\n\n".join(prompt_parts), file],
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=2048,
                ),
            )

            # Extract citations (if available in response metadata)
            citations = self._extract_citations(response)

            return response.text, citations

        except Exception as e:
            raise Exception(f"Failed to chat with document: {str(e)}")

    async def generate_summary(self, file_id: str, summary_type: str = "medium") -> str:
        """
        Generate a summary of the document

        Args:
            file_id: Gemini file ID
            summary_type: Type of summary (brief, medium, detailed)

        Returns:
            Generated summary text
        """
        try:
            # Define summary instructions based on type
            instructions = {
                "brief": "Provide a brief 2-3 sentence summary of the main points.",
                "medium": "Provide a comprehensive summary in 1-2 paragraphs covering the key points.",
                "detailed": "Provide a detailed summary with bullet points covering all major sections and key information.",
            }

            instruction = instructions.get(summary_type, instructions["medium"])

            # Get the file
            file = genai.get_file(name=file_id)

            # Generate summary
            prompt = f"""Analyze this document and {instruction}

Focus on:
- Main topics and themes
- Key findings or arguments
- Important conclusions or recommendations

Provide a clear, well-structured summary."""

            response = self.model.generate_content(
                [prompt, file],
                generation_config=genai.GenerationConfig(
                    temperature=0.5,
                    top_p=0.9,
                    max_output_tokens=2048,
                ),
            )

            return response.text

        except Exception as e:
            raise Exception(f"Failed to generate summary: {str(e)}")

    async def extract_key_topics(self, file_id: str) -> List[str]:
        """
        Extract key topics from the document

        Args:
            file_id: Gemini file ID

        Returns:
            List of key topics
        """
        try:
            file = genai.get_file(name=file_id)

            prompt = """Analyze this document and extract 5-10 key topics or themes.
Return only the topics as a comma-separated list, nothing else."""

            response = self.model.generate_content(
                [prompt, file],
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=256,
                ),
            )

            # Parse topics from response
            topics = [topic.strip() for topic in response.text.split(",")]
            return topics[:10]  # Max 10 topics

        except Exception as e:
            print(f"Failed to extract key topics: {str(e)}")
            return []

    def _extract_citations(self, response) -> List[Dict]:
        """
        Extract citations from Gemini response

        Args:
            response: Gemini response object

        Returns:
            List of citation dictionaries
        """
        citations = []
        try:
            # Check if response has grounding metadata
            if hasattr(response, "grounding_metadata") and response.grounding_metadata:
                for chunk in response.grounding_metadata.grounding_chunks:
                    if hasattr(chunk, "retrieved_context"):
                        citations.append(
                            {
                                "text": chunk.retrieved_context.text,
                                "title": chunk.retrieved_context.title if hasattr(chunk.retrieved_context, "title") else None,
                                "uri": chunk.retrieved_context.uri if hasattr(chunk.retrieved_context, "uri") else None,
                            }
                        )
        except Exception as e:
            print(f"Failed to extract citations: {str(e)}")

        return citations


# Global instance
gemini_service = GeminiService()
