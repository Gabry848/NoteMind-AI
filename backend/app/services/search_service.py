"""
Search service for documents and conversations
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from typing import List, Tuple
from app.models.document import Document
from app.models.conversation import Conversation, Message
from app.schemas.search import SearchFilters, DocumentSearchResult, ConversationSearchResult


class SearchService:
    """Service for searching documents and conversations"""

    @staticmethod
    def search_documents(
        db: Session,
        user_id: int,
        query: str,
        filters: SearchFilters = None,
        sort_by: str = "relevance",
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[DocumentSearchResult], int]:
        """
        Search documents by filename and content

        Args:
            db: Database session
            user_id: Current user ID
            query: Search query
            filters: Optional filters
            sort_by: Sorting option
            limit: Max results
            offset: Pagination offset

        Returns:
            Tuple of (results, total_count)
        """
        # Base query
        base_query = db.query(Document).filter(Document.user_id == user_id)

        # Apply text search
        if query:
            search_term = f"%{query}%"
            base_query = base_query.filter(
                or_(
                    Document.original_filename.ilike(search_term),
                    Document.summary.ilike(search_term),
                    Document.transcript_content.ilike(search_term),
                )
            )

        # Apply filters
        if filters:
            if filters.file_types:
                base_query = base_query.filter(Document.file_type.in_(filters.file_types))

            if filters.folder_ids:
                base_query = base_query.filter(Document.folder_id.in_(filters.folder_ids))

            if filters.date_from:
                base_query = base_query.filter(Document.created_at >= filters.date_from)

            if filters.date_to:
                base_query = base_query.filter(Document.created_at <= filters.date_to)

            if filters.status:
                base_query = base_query.filter(Document.status == filters.status)

        # Get total count
        total = base_query.count()

        # Apply sorting
        if sort_by == "date_desc":
            base_query = base_query.order_by(desc(Document.created_at))
        elif sort_by == "date_asc":
            base_query = base_query.order_by(asc(Document.created_at))
        elif sort_by == "name_asc":
            base_query = base_query.order_by(asc(Document.original_filename))
        elif sort_by == "name_desc":
            base_query = base_query.order_by(desc(Document.original_filename))
        else:  # relevance (default to date_desc for now)
            base_query = base_query.order_by(desc(Document.created_at))

        # Apply pagination
        documents = base_query.limit(limit).offset(offset).all()

        # Convert to response with highlights
        results = []
        for doc in documents:
            highlight = SearchService._generate_highlight(
                query,
                doc.original_filename,
                doc.summary,
                doc.transcript_content,
            )
            results.append(
                DocumentSearchResult(
                    id=doc.id,
                    filename=doc.filename,
                    original_filename=doc.original_filename,
                    file_type=doc.file_type,
                    folder_id=doc.folder_id,
                    created_at=doc.created_at,
                    updated_at=doc.updated_at,
                    highlight=highlight,
                )
            )

        return results, total

    @staticmethod
    def search_conversations(
        db: Session,
        user_id: int,
        query: str,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[ConversationSearchResult], int]:
        """
        Search conversations by message content

        Args:
            db: Database session
            user_id: Current user ID
            query: Search query
            limit: Max results
            offset: Pagination offset

        Returns:
            Tuple of (results, total_count)
        """
        # Search in messages
        search_term = f"%{query}%"

        # Join messages with conversations
        base_query = (
            db.query(Message, Conversation)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .filter(
                and_(
                    Conversation.user_id == user_id,
                    Message.content.ilike(search_term),
                )
            )
        )

        # Get total count
        total = base_query.count()

        # Order by most recent
        base_query = base_query.order_by(desc(Message.created_at))

        # Apply pagination
        results_data = base_query.limit(limit).offset(offset).all()

        # Convert to response with highlights
        results = []
        for message, conversation in results_data:
            highlight = SearchService._generate_highlight(query, message.content)
            results.append(
                ConversationSearchResult(
                    id=message.id,
                    conversation_id=conversation.id,
                    document_id=conversation.document_id,
                    title=conversation.title,
                    message_content=message.content[:200] + "..."
                    if len(message.content) > 200
                    else message.content,
                    created_at=message.created_at,
                    highlight=highlight,
                )
            )

        return results, total

    @staticmethod
    def get_search_suggestions(
        db: Session, user_id: int, query: str, limit: int = 5
    ) -> List[str]:
        """
        Get search suggestions based on partial query

        Args:
            db: Database session
            user_id: Current user ID
            query: Partial search query
            limit: Max suggestions

        Returns:
            List of suggestion strings
        """
        if not query or len(query) < 2:
            return []

        search_term = f"%{query}%"

        # Get document name suggestions
        documents = (
            db.query(Document.original_filename)
            .filter(
                and_(
                    Document.user_id == user_id,
                    Document.original_filename.ilike(search_term),
                )
            )
            .limit(limit)
            .all()
        )

        suggestions = [doc.original_filename for doc in documents]

        return suggestions

    @staticmethod
    def _generate_highlight(query: str, *texts) -> str:
        """
        Generate highlighted snippet from texts

        Args:
            query: Search query
            *texts: Text fields to search in

        Returns:
            Highlighted snippet
        """
        query_lower = query.lower()

        for text in texts:
            if not text:
                continue

            text_lower = text.lower()
            idx = text_lower.find(query_lower)

            if idx != -1:
                # Extract context around match
                start = max(0, idx - 50)
                end = min(len(text), idx + len(query) + 50)

                snippet = text[start:end]

                # Add ellipsis if truncated
                if start > 0:
                    snippet = "..." + snippet
                if end < len(text):
                    snippet = snippet + "..."

                # Highlight the query (case-insensitive)
                # Simple highlighting without complex regex
                import re

                pattern = re.compile(re.escape(query), re.IGNORECASE)
                highlighted = pattern.sub(f"**{query}**", snippet)

                return highlighted

        # No match found, return first text snippet
        for text in texts:
            if text:
                snippet = text[:100]
                if len(text) > 100:
                    snippet += "..."
                return snippet

        return ""


# Global instance
search_service = SearchService()
