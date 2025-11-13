"""
Quiz export service for generating Markdown and PDF files
"""
import json
from typing import Dict, List
from datetime import datetime
import markdown
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib import colors


def generate_quiz_markdown(quiz_data: Dict, include_answers: bool = False) -> str:
    """
    Generate a Markdown document from quiz data
    
    Args:
        quiz_data: Quiz data dictionary
        include_answers: Whether to include correct answers
        
    Returns:
        Markdown formatted string
    """
    questions = quiz_data.get("questions", [])
    question_type = quiz_data.get("question_type", "mixed")
    difficulty = quiz_data.get("difficulty", "medium")
    created_at = quiz_data.get("created_at", datetime.utcnow().isoformat())
    
    # Parse datetime if it's a string
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        except:
            created_at = datetime.utcnow()
    
    # Start building markdown
    md_lines = []
    
    # Title and metadata
    md_lines.append("# 📝 Quiz")
    md_lines.append("")
    md_lines.append("---")
    md_lines.append("")
    md_lines.append(f"**Data creazione:** {created_at.strftime('%d/%m/%Y %H:%M')}")
    md_lines.append(f"**Difficoltà:** {difficulty.capitalize()}")
    md_lines.append(f"**Tipo domande:** {question_type.replace('_', ' ').title()}")
    md_lines.append(f"**Numero domande:** {len(questions)}")
    md_lines.append("")
    md_lines.append("---")
    md_lines.append("")
    
    # Questions
    for idx, question in enumerate(questions, 1):
        q_id = question.get("id", f"q{idx}")
        q_text = question.get("question", "")
        q_type = question.get("type", "open_ended")
        
        # Question header
        md_lines.append(f"## Domanda {idx}")
        md_lines.append("")
        md_lines.append(f"**{q_text}**")
        md_lines.append("")
        
        # Question type indicator
        if q_type == "multiple_choice":
            md_lines.append("*Tipo: Scelta multipla*")
            md_lines.append("")
            
            # Options
            options = question.get("options", [])
            correct_answer = question.get("correct_answer", "")
            
            for option in options:
                opt_id = option.get("id", "")
                opt_text = option.get("text", "")
                
                if include_answers and opt_id == correct_answer:
                    md_lines.append(f"- **{opt_id}.** {opt_text} ✓")
                else:
                    md_lines.append(f"- {opt_id}. {opt_text}")
            
            md_lines.append("")
            
            if include_answers:
                md_lines.append(f"**Risposta corretta:** {correct_answer}")
                md_lines.append("")
        else:
            md_lines.append("*Tipo: Risposta aperta*")
            md_lines.append("")
            md_lines.append("**La tua risposta:**")
            md_lines.append("")
            md_lines.append("_" * 50)
            md_lines.append("")
            md_lines.append("_" * 50)
            md_lines.append("")
            
            if include_answers:
                correct_answer = question.get("correct_answer", "")
                if correct_answer:
                    md_lines.append("**Risposta attesa:**")
                    md_lines.append("")
                    md_lines.append(correct_answer)
                    md_lines.append("")
        
        md_lines.append("---")
        md_lines.append("")
    
    # Footer
    if not include_answers:
        md_lines.append("")
        md_lines.append("## 📊 Come completare questo quiz")
        md_lines.append("")
        md_lines.append("1. Leggi attentamente ogni domanda")
        md_lines.append("2. Per le domande a scelta multipla, seleziona l'opzione corretta")
        md_lines.append("3. Per le domande aperte, scrivi la tua risposta negli spazi indicati")
        md_lines.append("4. Carica questo documento completato su NoteMind AI per la correzione automatica")
        md_lines.append("")
    
    md_lines.append("---")
    md_lines.append("")
    md_lines.append("*Generato da NoteMind AI*")
    
    return "\n".join(md_lines)


def generate_quiz_pdf(quiz_data: Dict, include_answers: bool = False) -> bytes:
    """
    Generate a PDF document from quiz data using ReportLab
    
    Args:
        quiz_data: Quiz data dictionary
        include_answers: Whether to include correct answers
        
    Returns:
        PDF file as bytes
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=20
    )
    question_style = ParagraphStyle(
        'Question',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=8,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    option_style = ParagraphStyle(
        'Option',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=4,
        leftIndent=20
    )
    
    story = []
    
    # Parse datetime
    created_at = quiz_data.get("created_at", datetime.utcnow().isoformat())
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        except:
            created_at = datetime.utcnow()
    
    questions = quiz_data.get("questions", [])
    difficulty = quiz_data.get("difficulty", "medium")
    question_type = quiz_data.get("question_type", "mixed")
    
    # Title
    story.append(Paragraph("📝 Quiz", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Metadata
    info_text = f"<b>Data creazione:</b> {created_at.strftime('%d/%m/%Y %H:%M')}<br/>"
    info_text += f"<b>Difficoltà:</b> {difficulty.capitalize()}<br/>"
    info_text += f"<b>Tipo domande:</b> {question_type.replace('_', ' ').title()}<br/>"
    info_text += f"<b>Numero domande:</b> {len(questions)}"
    story.append(Paragraph(info_text, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Questions
    for idx, question in enumerate(questions, 1):
        q_text = question.get("question", "")
        q_type = question.get("type", "open_ended")
        
        # Question
        story.append(Paragraph(f"Domanda {idx}", heading_style))
        story.append(Paragraph(q_text, question_style))
        
        if q_type == "multiple_choice":
            story.append(Paragraph("<i>Tipo: Scelta multipla</i>", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
            
            # Options
            options = question.get("options", [])
            correct_answer = question.get("correct_answer", "")
            
            for option in options:
                opt_id = option.get("id", "")
                opt_text = option.get("text", "")
                
                if include_answers and opt_id == correct_answer:
                    story.append(Paragraph(f"<b>{opt_id}.</b> {opt_text} ✓", option_style))
                else:
                    story.append(Paragraph(f"{opt_id}. {opt_text}", option_style))
            
            if include_answers:
                story.append(Spacer(1, 0.1*inch))
                story.append(Paragraph(f"<b>Risposta corretta:</b> {correct_answer}", option_style))
        else:
            story.append(Paragraph("<i>Tipo: Risposta aperta</i>", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph("<b>La tua risposta:</b>", option_style))
            story.append(Spacer(1, 0.8*inch))
            
            if include_answers:
                correct_answer = question.get("correct_answer", "")
                if correct_answer:
                    story.append(Paragraph(f"<b>Risposta attesa:</b> {correct_answer}", option_style))
        
        story.append(Spacer(1, 0.2*inch))
    
    # Footer
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("<i>Generato da NoteMind AI</i>", styles['Normal']))
    
    # Build PDF
    doc.build(story)
    return buffer.getvalue()


def generate_quiz_results_markdown(
    quiz_data: Dict,
    corrections: List[Dict],
    score_percentage: float,
    correct_answers: int,
    total_questions: int,
    overall_feedback: str = ""
) -> str:
    """
    Generate a Markdown document from quiz results with corrections
    
    Args:
        quiz_data: Original quiz data
        corrections: List of corrections
        score_percentage: Score percentage
        correct_answers: Number of correct answers
        total_questions: Total number of questions
        overall_feedback: Overall feedback text
        
    Returns:
        Markdown formatted string
    """
    difficulty = quiz_data.get("difficulty", "medium")
    completed_at = datetime.utcnow()
    
    md_lines = []
    
    # Title and score
    md_lines.append("# 📊 Risultati Quiz")
    md_lines.append("")
    md_lines.append("---")
    md_lines.append("")
    md_lines.append(f"## 🎯 Punteggio: {score_percentage:.1f}%")
    md_lines.append("")
    md_lines.append(f"**Risposte corrette:** {correct_answers}/{total_questions}")
    md_lines.append(f"**Difficoltà:** {difficulty.capitalize()}")
    md_lines.append(f"**Data completamento:** {completed_at.strftime('%d/%m/%Y %H:%M')}")
    md_lines.append("")
    
    if overall_feedback:
        md_lines.append("### 💬 Feedback Generale")
        md_lines.append("")
        md_lines.append(overall_feedback)
        md_lines.append("")
    
    md_lines.append("---")
    md_lines.append("")
    
    # Detailed corrections
    md_lines.append("## 📝 Revisione Dettagliata")
    md_lines.append("")
    
    for idx, correction in enumerate(corrections, 1):
        question = correction.get("question", "")
        user_answer = correction.get("user_answer", "")
        correct_answer = correction.get("correct_answer", "")
        is_correct = correction.get("is_correct", False)
        explanation = correction.get("explanation", "")
        score = correction.get("score", 0.0)
        
        # Question header with status
        status_emoji = "✅" if is_correct else "❌"
        md_lines.append(f"### Domanda {idx} {status_emoji}")
        md_lines.append("")
        md_lines.append(f"**{question}**")
        md_lines.append("")
        
        # User answer
        md_lines.append("**La tua risposta:**")
        md_lines.append(f"> {user_answer if user_answer else '(Nessuna risposta)'}")
        md_lines.append("")
        
        # Correct answer (if wrong)
        if not is_correct:
            md_lines.append("**Risposta corretta:**")
            md_lines.append(f"> {correct_answer}")
            md_lines.append("")
        
        # Explanation
        if explanation:
            md_lines.append("**💡 Spiegazione:**")
            md_lines.append("")
            md_lines.append(explanation)
            md_lines.append("")
        
        # Score
        md_lines.append(f"**Punteggio:** {score * 100:.0f}%")
        md_lines.append("")
        md_lines.append("---")
        md_lines.append("")
    
    # Footer
    md_lines.append("*Generato da NoteMind AI*")
    
    return "\n".join(md_lines)


def generate_quiz_results_pdf(
    quiz_data: Dict,
    corrections: List[Dict],
    score_percentage: float,
    correct_answers: int,
    total_questions: int,
    overall_feedback: str = ""
) -> bytes:
    """
    Generate a PDF document from quiz results using ReportLab
    
    Args:
        quiz_data: Original quiz data
        corrections: List of corrections
        score_percentage: Score percentage
        correct_answers: Number of correct answers
        total_questions: Total number of questions
        overall_feedback: Overall feedback text
        
    Returns:
        PDF file as bytes
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    score_style = ParagraphStyle(
        'Score',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#10b981'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=10,
        spaceBefore=15
    )
    question_style = ParagraphStyle(
        'Question',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    correct_style = ParagraphStyle(
        'Correct',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#10b981'),
        leftIndent=20
    )
    incorrect_style = ParagraphStyle(
        'Incorrect',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#ef4444'),
        leftIndent=20
    )
    normal_indent = ParagraphStyle(
        'NormalIndent',
        parent=styles['Normal'],
        fontSize=11,
        leftIndent=20
    )
    
    story = []
    
    difficulty = quiz_data.get("difficulty", "medium")
    completed_at = datetime.utcnow()
    
    # Title
    story.append(Paragraph("📊 Risultati Quiz", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Score
    story.append(Paragraph(f"🎯 Punteggio: {score_percentage:.1f}%", score_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Metadata
    info_text = f"<b>Risposte corrette:</b> {correct_answers}/{total_questions}<br/>"
    info_text += f"<b>Difficoltà:</b> {difficulty.capitalize()}<br/>"
    info_text += f"<b>Data completamento:</b> {completed_at.strftime('%d/%m/%Y %H:%M')}"
    story.append(Paragraph(info_text, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Overall feedback
    if overall_feedback:
        story.append(Paragraph("💬 Feedback Generale", heading_style))
        story.append(Paragraph(overall_feedback, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
    
    # Detailed corrections
    story.append(Paragraph("📝 Revisione Dettagliata", heading_style))
    story.append(Spacer(1, 0.1*inch))
    
    for idx, correction in enumerate(corrections, 1):
        question = correction.get("question", "")
        user_answer = correction.get("user_answer", "")
        correct_answer = correction.get("correct_answer", "")
        is_correct = correction.get("is_correct", False)
        explanation = correction.get("explanation", "")
        score = correction.get("score", 0.0)
        
        # Question with status
        status_emoji = "✅" if is_correct else "❌"
        story.append(Paragraph(f"Domanda {idx} {status_emoji}", question_style))
        story.append(Paragraph(question, normal_indent))
        story.append(Spacer(1, 0.05*inch))
        
        # User answer
        if is_correct:
            story.append(Paragraph(f"<b>Tua risposta:</b> {user_answer} ✓", correct_style))
        else:
            story.append(Paragraph(f"<b>Tua risposta:</b> {user_answer} ✗", incorrect_style))
            story.append(Paragraph(f"<b>Risposta corretta:</b> {correct_answer}", correct_style))
        
        # Explanation
        if explanation:
            story.append(Spacer(1, 0.05*inch))
            story.append(Paragraph(f"<b>💡 Spiegazione:</b> {explanation}", normal_indent))
        
        # Score
        story.append(Spacer(1, 0.05*inch))
        story.append(Paragraph(f"<b>Punteggio:</b> {score * 100:.0f}%", normal_indent))
        story.append(Spacer(1, 0.15*inch))
    
    # Footer
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("<i>Generato da NoteMind AI</i>", styles['Normal']))
    
    # Build PDF
    doc.build(story)
    return buffer.getvalue()
