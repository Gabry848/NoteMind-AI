"""
Search API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.services.search_service import search_service
from app.schemas.search import (
    SearchRequest,
    SearchResponse,
    SearchSuggestionsResponse,
    SearchSuggestion,
)

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search documents and conversations

    Args:
        request: Search request with query and filters
        current_user: Current authenticated user
        db: Database session

    Returns:
        Search results
    """
    try:
        # Search documents
        documents, total_docs = search_service.search_documents(
            db=db,
            user_id=current_user.id,
            query=request.query,
            filters=request.filters,
            sort_by=request.sort_by,
            limit=request.limit,
            offset=request.offset,
        )

        # Search conversations
        conversations, total_convs = search_service.search_conversations(
            db=db,
            user_id=current_user.id,
            query=request.query,
            limit=request.limit,
            offset=request.offset,
        )

        return SearchResponse(
            documents=documents,
            conversations=conversations,
            total_documents=total_docs,
            total_conversations=total_convs,
            query=request.query,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.get("/suggestions", response_model=SearchSuggestionsResponse)
async def get_suggestions(
    query: str,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get search suggestions based on partial query

    Args:
        query: Partial search query
        limit: Max number of suggestions
        current_user: Current authenticated user
        db: Database session

    Returns:
        Search suggestions
    """
    try:
        suggestions_list = search_service.get_search_suggestions(
            db=db, user_id=current_user.id, query=query, limit=limit
        )

        suggestions = [
            SearchSuggestion(text=text, type="document") for text in suggestions_list
        ]

        return SearchSuggestionsResponse(suggestions=suggestions)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggestions: {str(e)}",
        )
