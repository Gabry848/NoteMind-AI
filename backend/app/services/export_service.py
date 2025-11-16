"""
Export service for conversations
"""
from datetime import datetime
from typing import List
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT
from app.models.conversation import Conversation
import json


class ExportService:
    """Service for exporting conversations to different formats"""

    @staticmethod
    def export_conversation_to_json(conversation: Conversation) -> dict:
        """
        Export conversation to JSON format

        Args:
            conversation: Conversation model

        Returns:
            Dictionary representation
        """
        return {
            "conversation_id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat(),
            "document_id": conversation.document_id,
            "messages": [
                {
                    "role": message.role,
                    "content": message.content,
                    "citations": message.citations,
                    "created_at": message.created_at.isoformat(),
                }
                for message in conversation.messages
            ],
        }

    @staticmethod
    def export_conversation_to_markdown(conversation: Conversation) -> str:
        """
        Export conversation to Markdown format

        Args:
            conversation: Conversation model

        Returns:
            Markdown formatted string
        """
        lines = []

        # Header
        lines.append(f"# {conversation.title}")
        lines.append("")
        lines.append(f"**Created:** {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"**Last Updated:** {conversation.updated_at.strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Messages
        for idx, message in enumerate(conversation.messages, 1):
            role_icon = "👤" if message.role == "user" else "🤖"
            role_title = "User" if message.role == "user" else "Assistant"

            lines.append(f"## {role_icon} {role_title} - Message {idx}")
            lines.append("")
            lines.append(f"*{message.created_at.strftime('%Y-%m-%d %H:%M:%S')}*")
            lines.append("")
            lines.append(message.content)
            lines.append("")

            # Citations if present
            if message.citations:
                lines.append("**Citations:**")
                for citation in message.citations:
                    if isinstance(citation, dict):
                        text = citation.get('text', '')
                        lines.append(f"- {text}")
                lines.append("")

            lines.append("---")
            lines.append("")

        return "\n".join(lines)

    @staticmethod
    def export_conversation_to_pdf(conversation: Conversation, filename: str) -> str:
        """
        Export conversation to PDF format

        Args:
            conversation: Conversation model
            filename: Output filename

        Returns:
            Path to generated PDF
        """
        # Create PDF document
        doc = SimpleDocTemplate(filename, pagesize=letter)
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#1E40AF',
            spaceAfter=30,
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor='#374151',
            spaceAfter=10,
        )

        user_style = ParagraphStyle(
            'UserMessage',
            parent=styles['Normal'],
            fontSize=11,
            leftIndent=20,
            rightIndent=20,
            spaceAfter=15,
            backgroundColor='#EFF6FF',
        )

        assistant_style = ParagraphStyle(
            'AssistantMessage',
            parent=styles['Normal'],
            fontSize=11,
            leftIndent=20,
            rightIndent=20,
            spaceAfter=15,
            backgroundColor='#F3F4F6',
        )

        meta_style = ParagraphStyle(
            'Meta',
            parent=styles['Normal'],
            fontSize=9,
            textColor='#6B7280',
            spaceAfter=20,
        )

        # Build PDF content
        content = []

        # Title
        content.append(Paragraph(conversation.title, title_style))
        content.append(Spacer(1, 0.2 * inch))

        # Metadata
        meta_text = f"""
        <b>Created:</b> {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}<br/>
        <b>Last Updated:</b> {conversation.updated_at.strftime('%Y-%m-%d %H:%M:%S')}<br/>
        <b>Total Messages:</b> {len(conversation.messages)}
        """
        content.append(Paragraph(meta_text, meta_style))
        content.append(Spacer(1, 0.3 * inch))

        # Messages
        for idx, message in enumerate(conversation.messages, 1):
            # Message header
            role_title = "User" if message.role == "user" else "Assistant"
            header = f"<b>{role_title}</b> - {message.created_at.strftime('%H:%M:%S')}"
            content.append(Paragraph(header, heading_style))

            # Message content
            # Clean content for PDF (escape HTML entities)
            clean_content = message.content.replace('<', '&lt;').replace('>', '&gt;')
            # Convert newlines to <br/> for PDF
            clean_content = clean_content.replace('\n', '<br/>')

            style = user_style if message.role == "user" else assistant_style
            content.append(Paragraph(clean_content, style))

            content.append(Spacer(1, 0.2 * inch))

        # Build PDF
        doc.build(content)

        return filename


# Global instance
export_service = ExportService()
