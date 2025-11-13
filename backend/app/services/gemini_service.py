"""
Gemini AI service for file search and RAG
"""
import os
import time
import json
import uuid
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
            
            # Wait for file to be processed
            print(f"Waiting for file {file.name} to be processed...")
            while file.state.name == "PROCESSING":
                time.sleep(2)
                file = genai.get_file(name=file.name)
            
            if file.state.name == "FAILED":
                raise Exception(f"File processing failed: {file.state}")
            
            print(f"File {file.name} is ready")
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
            # Get the file
            file = genai.get_file(name=file_id)
            
            # Build the prompt with context
            system_instruction = (
                "You are a helpful AI assistant that answers questions based on the provided document. "
                "Always cite specific parts of the document when answering. "
                "If the answer is not in the document, say so clearly."
            )
            
            # Build conversation context
            context_parts = [system_instruction]
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    context_parts.append(f"{msg['role']}: {msg['content']}")
            
            # Combine context with query
            full_prompt = "\n\n".join(context_parts) + f"\n\nuser: {query}\n\nassistant:"
            
            # Generate response with file context
            response = self.model.generate_content(
                [full_prompt, file],
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
            print(f"Error in chat_with_document: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to chat with document: {str(e)}")

    async def chat_with_documents(
        self,
        query: str,
        file_ids: List[str],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[str, List[Dict]]:
        """
        Chat with multiple documents using RAG

        Args:
            query: User query
            file_ids: List of Gemini file IDs
            conversation_history: Previous conversation messages

        Returns:
            Tuple of (response text, citations)
        """
        try:
            # Get all files
            files = [genai.get_file(name=file_id) for file_id in file_ids]
            
            # Build the prompt with context
            system_instruction = (
                f"You are a helpful AI assistant that answers questions based on {len(files)} provided documents. "
                "Always cite specific documents and parts when answering. "
                "If you find information across multiple documents, mention which documents contain what information. "
                "If the answer is not in any of the documents, say so clearly."
            )
            
            # Build conversation context
            context_parts = [system_instruction]
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    context_parts.append(f"{msg['role']}: {msg['content']}")
            
            # Combine context with query
            full_prompt = "\n\n".join(context_parts) + f"\n\nuser: {query}\n\nassistant:"
            
            # Generate response with all files context
            content_parts = [full_prompt] + files
            response = self.model.generate_content(
                content_parts,
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
            print(f"Error in chat_with_documents: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to chat with documents: {str(e)}")

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
            print(f"Error in generate_summary: {str(e)}")
            import traceback
            traceback.print_exc()
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

    async def generate_quiz(
        self,
        file_ids: List[str],
        question_count: int = 5,
        question_type: str = "mixed",
        difficulty: str = "medium",
        language: str = "it",
    ) -> Dict:
        """
        Generate a quiz based on document(s) content

        Args:
            file_ids: List of Gemini file IDs
            question_count: Number of questions to generate
            question_type: Type of questions (multiple_choice, open_ended, mixed)
            difficulty: Difficulty level (easy, medium, hard)
            language: Language for questions (it, en, es, fr, de, etc.)

        Returns:
            Dictionary containing quiz data with questions
        """
        try:
            # Get all files
            files = [genai.get_file(name=file_id) for file_id in file_ids]
            
            # Language instructions
            language_names = {
                "it": "Italian",
                "en": "English",
                "es": "Spanish",
                "fr": "French",
                "de": "German",
                "pt": "Portuguese",
                "ru": "Russian",
                "zh": "Chinese",
                "ja": "Japanese",
                "ko": "Korean",
            }
            language_name = language_names.get(language, "Italian")
            language_instruction = f"Generate all questions and answers in {language_name}."
            
            # Define difficulty instructions
            difficulty_instructions = {
                "easy": "Create straightforward questions that test basic understanding of key concepts.",
                "medium": "Create questions that require understanding and some analysis of the material.",
                "hard": "Create challenging questions that require deep understanding, analysis, and synthesis of information.",
            }
            
            difficulty_instruction = difficulty_instructions.get(difficulty, difficulty_instructions["medium"])
            
            # Define question type instructions
            if question_type == "multiple_choice":
                type_instruction = f"Generate exactly {question_count} multiple choice questions with 4 options each (A, B, C, D)."
            elif question_type == "open_ended":
                type_instruction = f"Generate exactly {question_count} open-ended questions that require written explanations."
            else:  # mixed
                # For mixed type, generate mostly multiple choice (70-80%) with some open-ended questions
                mc_count = int(question_count * 0.7)  # 70% multiple choice
                oe_count = question_count - mc_count
                # Ensure at least 1 of each type if possible
                if question_count >= 2:
                    if mc_count == 0:
                        mc_count = 1
                        oe_count = question_count - 1
                    elif oe_count == 0:
                        oe_count = 1
                        mc_count = question_count - 1
                type_instruction = f"Generate exactly {mc_count} multiple choice questions with 4 options each (A, B, C, D) and exactly {oe_count} open-ended questions."
            
            prompt = f"""Based on the provided document(s), generate a quiz to test understanding of the material.

{language_instruction}
{difficulty_instruction}
{type_instruction}

CRITICAL REQUIREMENTS:
1. You MUST generate EXACTLY the number of questions specified above - no more, no less
2. Questions should be clear and unambiguous
3. Cover different topics from the document(s)
4. For multiple choice questions, include exactly 4 options where only one is correct
5. For open-ended questions, provide questions that require substantive answers
6. ALL text (questions, options, answers) must be in {language_name}
7. STRICTLY FOLLOW the question count and type distribution specified above

Return your response in JSON format with the following structure:
{{
  "questions": [
    {{
      "id": "q1",
      "question": "Question text here?",
      "type": "multiple_choice",
      "options": [
        {{"id": "A", "text": "First option"}},
        {{"id": "B", "text": "Second option"}},
        {{"id": "C", "text": "Third option"}},
        {{"id": "D", "text": "Fourth option"}}
      ],
      "correct_answer": "B"
    }},
    {{
      "id": "q2",
      "question": "Another question?",
      "type": "open_ended",
      "correct_answer": "Expected answer explanation"
    }}
  ]
}}

IMPORTANT: 
- Return ONLY the JSON object, no additional text
- Ensure you generate the EXACT number and types of questions specified
- Total questions must be exactly {question_count}"""

            content_parts = [prompt] + files
            response = self.model.generate_content(
                content_parts,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    top_p=0.9,
                    max_output_tokens=4096,
                ),
            )

            # Parse JSON response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            elif response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            quiz_data = json.loads(response_text)
            
            # Validate question count
            questions = quiz_data.get("questions", [])
            if len(questions) != question_count:
                print(f"Warning: Generated {len(questions)} questions but {question_count} were requested")
                # Trim or pad to match requested count
                if len(questions) > question_count:
                    quiz_data["questions"] = questions[:question_count]
                elif len(questions) < question_count:
                    # Log warning but continue - better to have fewer questions than fail
                    print(f"Warning: Only {len(questions)} questions generated, expected {question_count}")
            
            # Validate question types for mixed quizzes
            if question_type == "mixed":
                mc_questions = [q for q in quiz_data["questions"] if q.get("type") == "multiple_choice"]
                oe_questions = [q for q in quiz_data["questions"] if q.get("type") == "open_ended"]
                print(f"Generated quiz with {len(mc_questions)} multiple choice and {len(oe_questions)} open-ended questions")
            
            # Generate unique quiz ID
            quiz_data["quiz_id"] = str(uuid.uuid4())
            quiz_data["question_type"] = question_type
            quiz_data["difficulty"] = difficulty
            
            return quiz_data

        except json.JSONDecodeError as e:
            print(f"Failed to parse quiz JSON: {str(e)}")
            print(f"Response text: {response_text}")
            raise Exception(f"Failed to parse quiz response: {str(e)}")
        except Exception as e:
            print(f"Error in generate_quiz: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to generate quiz: {str(e)}")

    async def correct_quiz(
        self,
        file_ids: List[str],
        quiz_questions: List[Dict],
        user_answers: List[Dict],
    ) -> Dict:
        """
        Correct a quiz submission and provide detailed feedback

        Args:
            file_ids: List of Gemini file IDs (original documents)
            quiz_questions: Original quiz questions with correct answers
            user_answers: User's submitted answers

        Returns:
            Dictionary containing corrections and feedback
        """
        try:
            # Get all files
            files = [genai.get_file(name=file_id) for file_id in file_ids]
            
            # Build answers mapping
            answers_map = {answer["question_id"]: answer["answer"] for answer in user_answers}
            
            # Build correction prompt
            corrections_needed = []
            for question in quiz_questions:
                user_answer = answers_map.get(question["id"], "")
                corrections_needed.append({
                    "question_id": question["id"],
                    "question": question["question"],
                    "type": question["type"],
                    "user_answer": user_answer,
                    "correct_answer": question.get("correct_answer", "")
                })
            
            prompt = f"""Based on the provided document(s), correct this quiz submission and provide detailed feedback.

Quiz questions and user answers:
{json.dumps(corrections_needed, indent=2)}

For each question:
1. Evaluate if the user's answer is correct
2. For multiple choice: check if the selected option matches the correct answer exactly
3. For open-ended questions: BE VERY TOLERANT and FLEXIBLE
   - Accept answers that demonstrate understanding even if not perfectly worded
   - Focus on the CORE CONCEPTS rather than exact wording
   - Give credit for partial understanding
   - Accept paraphrasing and different explanations if they capture the main idea
   - Consider the answer correct if it shows the student understood the key points
4. Provide a clear explanation of the correct answer
5. If the answer is wrong or incomplete, explain what was missing or incorrect
6. Reference specific parts of the document(s) when explaining

Return your response in JSON format:
{{
  "corrections": [
    {{
      "question_id": "q1",
      "question": "Original question text",
      "user_answer": "User's answer",
      "correct_answer": "Correct answer",
      "is_correct": true,
      "explanation": "Detailed explanation referencing the document",
      "score": 1.0
    }}
  ],
  "overall_feedback": "General feedback about the quiz performance and areas for improvement"
}}

Score guidelines:
- Multiple choice: 1.0 if correct, 0.0 if wrong
- Open-ended: Be generous with scoring (0.0-1.0 based on understanding)
  * 1.0: Answer demonstrates clear understanding (even if not perfect)
  * 0.7-0.9: Answer shows good understanding but missing minor details
  * 0.5-0.6: Answer shows partial understanding
  * 0.0-0.4: Answer is mostly incorrect or missing key concepts

IMPORTANT: For open-ended questions, prioritize understanding over perfection. Don't penalize for different wording or style.

Return ONLY the JSON object, no additional text."""

            content_parts = [prompt] + files
            response = self.model.generate_content(
                content_parts,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,  # Lower temperature for more consistent grading
                    top_p=0.9,
                    max_output_tokens=4096,
                ),
            )

            # Parse JSON response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            elif response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            correction_data = json.loads(response_text)
            
            return correction_data

        except json.JSONDecodeError as e:
            print(f"Failed to parse correction JSON: {str(e)}")
            print(f"Response text: {response_text}")
            raise Exception(f"Failed to parse correction response: {str(e)}")
        except Exception as e:
            print(f"Error in correct_quiz: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to correct quiz: {str(e)}")


# Global instance
gemini_service = GeminiService()
