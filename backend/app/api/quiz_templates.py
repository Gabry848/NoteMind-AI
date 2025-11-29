"""
Quiz Templates API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.database import get_db
from app.models.user import User
from app.models.quiz_template import QuizTemplate
from app.utils.dependencies import get_current_user
from app.schemas.quiz_template import (
    QuizTemplateCreate,
    QuizTemplateUpdate,
    QuizTemplateResponse,
)

router = APIRouter(prefix="/quiz-templates", tags=["Quiz Templates"])
limiter = Limiter(key_func=get_remote_address)


@router.post("", response_model=QuizTemplateResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_template(
    request: Request,
    template_data: QuizTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new quiz template

    Rate limit: 30 requests per minute per IP
    """
    template = QuizTemplate(
        user_id=current_user.id,
        name=template_data.name,
        description=template_data.description,
        settings=template_data.settings,
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return QuizTemplateResponse.from_orm(template)


@router.get("", response_model=List[QuizTemplateResponse])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all quiz templates for current user
    """
    templates = (
        db.query(QuizTemplate)
        .filter(QuizTemplate.user_id == current_user.id)
        .order_by(QuizTemplate.created_at.desc())
        .all()
    )

    return [QuizTemplateResponse.from_orm(t) for t in templates]


@router.get("/{template_id}", response_model=QuizTemplateResponse)
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific quiz template
    """
    template = (
        db.query(QuizTemplate)
        .filter(QuizTemplate.id == template_id, QuizTemplate.user_id == current_user.id)
        .first()
    )

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    return QuizTemplateResponse.from_orm(template)


@router.put("/{template_id}", response_model=QuizTemplateResponse)
async def update_template(
    template_id: int,
    template_data: QuizTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a quiz template
    """
    template = (
        db.query(QuizTemplate)
        .filter(QuizTemplate.id == template_id, QuizTemplate.user_id == current_user.id)
        .first()
    )

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    if template_data.name is not None:
        template.name = template_data.name
    if template_data.description is not None:
        template.description = template_data.description
    if template_data.settings is not None:
        template.settings = template_data.settings

    db.commit()
    db.refresh(template)

    return QuizTemplateResponse.from_orm(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a quiz template
    """
    template = (
        db.query(QuizTemplate)
        .filter(QuizTemplate.id == template_id, QuizTemplate.user_id == current_user.id)
        .first()
    )

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    db.delete(template)
    db.commit()

    return None
