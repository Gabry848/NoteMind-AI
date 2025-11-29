"""
Podcast generation service using Gemini API
"""
import google.generativeai as genai
from app.core.config import settings
import base64
from typing import List, Tuple


class PodcastService:
    """Service for generating podcast audio from documents"""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        # Use Gemini 2.5 Flash for TTS (cost-efficient)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def generate_podcast_script(self, document_content: str, language: str = "it") -> str:
        """
        Generate a podcast-style conversation script from document content

        Args:
            document_content: The document text to convert
            language: Target language (default: it)

        Returns:
            Formatted script with two speakers
        """
        prompt = f"""
Sei un esperto nella creazione di podcast educativi. Converti il seguente contenuto in una conversazione naturale tra due speaker:

**Speaker 1 (Host)**: Una persona curiosa che fa domande e guida la conversazione
**Speaker 2 (Expert)**: Un esperto che spiega i concetti in modo chiaro e coinvolgente

Regole:
1. La conversazione deve essere in {language}
2. Durata totale: circa 3-5 minuti di parlato
3. Usa un tono informale e accessibile
4. Includi esempi pratici e analogie
5. Alterna tra i due speaker in modo naturale
6. Inizia con un'introduzione accattivante
7. Termina con un riassunto dei punti chiave

Formato output:
[Speaker 1]: testo...
[Speaker 2]: testo...

Contenuto del documento:
{document_content[:8000]}

Genera la conversazione podcast:
"""

        response = self.model.generate_content(prompt)
        return response.text

    def generate_audio_from_script(self, script: str) -> bytes:
        """
        Generate audio from podcast script using Gemini TTS

        Args:
            script: The formatted script with speaker labels

        Returns:
            Audio bytes in WAV format
        """
        # Parse script to identify speakers
        # Note: Gemini 2.5 with TTS is in preview, this is a placeholder
        # Real implementation would use the native audio output feature

        # For now, we'll use a single prompt to generate audio
        # In production, you'd use the native TTS API when available
        prompt = f"""
Generate natural-sounding audio for this podcast conversation.
Use distinct voices for each speaker.

{script}
"""

        # This would be replaced with actual TTS generation
        # when Gemini 2.5 Flash with audio output is fully available
        # response = self.model.generate_content(
        #     prompt,
        #     generation_config={"response_mime_type": "audio/wav"}
        # )

        # Placeholder: Return empty bytes for now
        # Real implementation will return audio bytes
        raise NotImplementedError(
            "Audio generation requires Gemini 2.5 with TTS support. "
            "This feature is in preview and requires specific model configuration."
        )

    def generate_podcast(self, document_content: str, language: str = "it") -> Tuple[str, bytes]:
        """
        Generate complete podcast from document

        Args:
            document_content: The document text
            language: Target language

        Returns:
            Tuple of (script_text, audio_bytes)
        """
        # Generate script
        script = self.generate_podcast_script(document_content, language)

        # Generate audio (placeholder for now)
        try:
            audio = self.generate_audio_from_script(script)
        except NotImplementedError:
            # Return script only if audio generation not available
            audio = b""

        return script, audio


# Create singleton instance
podcast_service = PodcastService()
