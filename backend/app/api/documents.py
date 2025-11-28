"""
Document management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
import uuid
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.models.folder import Folder
from app.utils.dependencies import get_current_user
from app.utils.file_handler import FileHandler
from app.services.gemini_service import gemini_service
from app.services.ocr_service import ocr_service
from app.utils.background_tasks import process_schema_generation_sync
from app.schemas.document import DocumentResponse, DocumentListResponse, DocumentUpdate, MermaidSchemaResponse

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    folder_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a new document

    Args:
        file: File to upload
        folder_id: Optional folder ID to organize document
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created document information
    """
    # Validate folder if provided
    if folder_id:
        folder = (
            db.query(Folder)
            .filter(Folder.id == folder_id, Folder.user_id == current_user.id)
            .first()
        )
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )
    
    # Validate file
    if not FileHandler.is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(FileHandler.get_file_extension(f) for f in ['.pdf', '.txt', '.docx', '.json', '.md', '.jpg', '.jpeg', '.png', '.webp'])}",
        )

    # Check file size
    content = await file.read()
    await file.seek(0)  # Reset file pointer
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit",
        )

    # Check if file is an image
    file_ext = FileHandler.get_file_extension(file.filename)
    is_image = file_ext in ['.jpg', '.jpeg', '.png', '.webp']

    try:
        # Save file to disk
        file_path, unique_filename = await FileHandler.save_upload_file(file)

        # Process image with OCR if it's an image
        if is_image:
            try:
                print(f"Processing image {file.filename} with OCR...")
                
                # Extract text, correct, format and get title
                markdown_content, doc_title = await ocr_service.process_image_to_document(file_path)
                
                # Save markdown content to a new file
                md_filename = f"{doc_title}.md"
                md_path = Path(file_path).parent / f"{Path(unique_filename).stem}.md"
                
                with open(md_path, 'w', encoding='utf-8') as f:
                    f.write(markdown_content)
                
                # Delete the original image file
                FileHandler.delete_file(file_path)
                
                # Update file info to point to markdown file
                file_path = str(md_path)
                unique_filename = md_path.name
                original_filename = md_filename
                
                print(f"Image processed successfully: {md_filename}")
                
            except Exception as e:
                # If OCR fails, delete the uploaded file and raise error
                FileHandler.delete_file(file_path)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to process image: {str(e)}",
                )
        else:
            original_filename = file.filename

        # Read file content for database storage
        file_content = None
        try:
            with open(file_path, 'rb') as f:
                file_content = f.read()
        except Exception as e:
            print(f"Warning: Could not read file content for database: {str(e)}")

        # Create document record
        document = Document(
            user_id=current_user.id,
            folder_id=folder_id,
            filename=unique_filename,
            original_filename=original_filename,
            file_path=file_path,
            file_content=file_content,  # Store file content in database
            file_size=FileHandler.get_file_size(file_path),
            file_type=FileHandler.get_file_extension(unique_filename),
            status="processing",
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # Upload to Gemini API (async task in production)
        try:
            gemini_file_id = await gemini_service.upload_file(
                file_path=file_path,
                display_name=file.filename,
            )

            document.gemini_file_id = gemini_file_id
            document.status = "ready"
            db.commit()
            db.refresh(document)

        except Exception as e:
            document.status = "error"
            document.error_message = str(e)
            db.commit()
            db.refresh(document)

        return DocumentResponse.from_orm(document)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}",
        )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all documents for current user

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of documents
    """
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )

    return DocumentListResponse(
        documents=[DocumentResponse.from_orm(doc) for doc in documents],
        total=len(documents),
    )


@router.get("/{document_id}/content")
async def get_document_content(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get document file content

    Args:
        document_id: Document ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Document file content as text
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Try to read file content from database first (most reliable)
    if document.file_content:
        file_ext = FileHandler.get_file_extension(document.filename)
        content = FileHandler.read_file_content_from_bytes(document.file_content, file_ext)
    else:
        # Fallback: Try to read from disk
        content = FileHandler.read_file_content(document.file_path)

        # If file not found on disk and we have a Gemini file ID, extract from Gemini
        # This handles cases where filesystem is temporary (like in Railway)
        if content == "File not found" and document.gemini_file_id:
            try:
                content = await run_in_threadpool(
                    gemini_service.extract_document_text,
                    file_id=document.gemini_file_id,
                )
            except Exception as e:
                content = f"Could not retrieve document content: {str(e)}"

    return {
        "document_id": document.id,
        "filename": document.original_filename,
        "content": content,
    }


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific document

    Args:
        document_id: Document ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Document information
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return DocumentResponse.from_orm(document)


@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download a document file

    Args:
        document_id: Document ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        File download response
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Check if file exists
    if not Path(document.file_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk",
        )

    return FileResponse(
        path=document.file_path,
        filename=document.original_filename,
        media_type="application/octet-stream",
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a document

    Args:
        document_id: Document ID
        current_user: Current authenticated user
        db: Database session
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Delete from Gemini API
    if document.gemini_file_id:
        await gemini_service.delete_file(document.gemini_file_id)

    # Delete file from disk
    FileHandler.delete_file(document.file_path)

    # Delete from database
    db.delete(document)
    db.commit()

    return None


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    update_data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a document (e.g., move to folder)

    Args:
        document_id: Document ID
        update_data: Update data with folder_id
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated document information
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Validate folder if provided
    if update_data.folder_id is not None:
        folder = (
            db.query(Folder)
            .filter(Folder.id == update_data.folder_id, Folder.user_id == current_user.id)
            .first()
        )
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

    # Update folder
    document.folder_id = update_data.folder_id
    db.commit()
    db.refresh(document)

    return DocumentResponse.from_orm(document)


@router.get("/{document_id}/mermaid", response_model=MermaidSchemaResponse)
async def get_mermaid_schema(
    document_id: int,
    regenerate: bool = False,
    diagram_type: str = "auto",
    detail_level: str = "compact",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get or generate Mermaid diagram schema for a document

    Args:
        document_id: Document ID
        regenerate: Force regeneration even if schema exists
        diagram_type: Type of diagram (auto, flowchart, mindmap, graph, sequence)
        detail_level: Level of detail (compact, balanced, detailed)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Mermaid schema for the document
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if document.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document is not ready for processing",
        )

    # Return existing schema if available and not forcing regeneration
    # Note: with new parameters, we always regenerate to apply new settings
    if document.mermaid_schema and not regenerate and diagram_type == "auto" and detail_level == "compact":
        return MermaidSchemaResponse(
            document_id=document.id,
            mermaid_schema=document.mermaid_schema,
            diagram_type="auto",
            detail_level="compact",
        )

    # Generate schema in thread pool (non-blocking)
    try:
        mermaid_schema = await run_in_threadpool(
            process_schema_generation_sync,
            file_id=document.gemini_file_id,
            diagram_type=diagram_type,
            detail_level=detail_level,
        )

        # Save to database (only if default parameters)
        if diagram_type == "auto" and detail_level == "compact":
            document.mermaid_schema = mermaid_schema
            db.commit()
            db.refresh(document)

        return MermaidSchemaResponse(
            document_id=document.id,
            mermaid_schema=mermaid_schema,
            diagram_type=diagram_type,
            detail_level=detail_level,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Mermaid schema: {str(e)}",
        )


@router.post("/generate-from-prompt", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def generate_document_from_prompt(
    prompt: str = Form(...),
    language: str = Form("it"),
    folder_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a new document from a text prompt using AI

    Args:
        prompt: Text prompt describing the content to generate
        language: Language for the generated content (default: it)
        folder_id: Optional folder ID to organize document
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created document information
    """
    # Validate folder if provided
    if folder_id:
        folder = (
            db.query(Folder)
            .filter(Folder.id == folder_id, Folder.user_id == current_user.id)
            .first()
        )
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

    try:
        # Generate content using Gemini
        content = await gemini_service.generate_content_from_prompt(
            prompt=prompt,
            language=language,
        )

        # Extract title from first heading or use prompt
        title = prompt[:50]  # Default to first 50 chars of prompt
        lines = content.split('\n')
        for line in lines:
            if line.strip().startswith('#'):
                # Extract title from first heading
                title = line.strip().lstrip('#').strip()
                break

        # Generate filename
        # Remove special characters and limit length
        safe_title = "".join(c if c.isalnum() or c.isspace() else "" for c in title)
        safe_title = safe_title.strip()[:50]
        if not safe_title:
            safe_title = "generated_document"

        original_filename = f"{safe_title}.md"
        unique_filename = f"{uuid.uuid4()}.md"

        # Save content to disk
        file_path = Path(settings.UPLOAD_DIR) / unique_filename
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        # Save content as bytes for database
        content_bytes = content.encode('utf-8')

        # Create document record
        document = Document(
            user_id=current_user.id,
            folder_id=folder_id,
            filename=unique_filename,
            original_filename=original_filename,
            file_path=str(file_path),
            file_content=content_bytes,
            file_size=len(content_bytes),
            file_type=".md",
            status="processing",
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # Upload to Gemini API for RAG capabilities
        try:
            gemini_file_id = await gemini_service.upload_file(
                file_path=str(file_path),
                display_name=original_filename,
            )

            document.gemini_file_id = gemini_file_id
            document.status = "ready"
            db.commit()
            db.refresh(document)

        except Exception as e:
            document.status = "error"
            document.error_message = str(e)
            db.commit()
            db.refresh(document)

        return DocumentResponse.from_orm(document)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate document: {str(e)}",
        )


@router.post("/merge", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def merge_documents(
    document_ids: List[int] = Form(...),
    merged_filename: Optional[str] = Form(None),
    folder_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Merge multiple documents into one

    Args:
        document_ids: List of document IDs to merge (at least 2)
        merged_filename: Optional name for the merged document
        folder_id: Optional folder ID for the merged document
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created merged document information
    """
    if len(document_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 documents are required to merge",
        )

    # Validate all documents exist and belong to user
    documents = []
    for doc_id in document_ids:
        doc = (
            db.query(Document)
            .filter(Document.id == doc_id, Document.user_id == current_user.id)
            .first()
        )
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {doc_id} not found",
            )
        if doc.status != "ready":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document {doc.original_filename} is not ready (status: {doc.status})",
            )
        documents.append(doc)

    # Validate folder if provided
    if folder_id:
        folder = (
            db.query(Folder)
            .filter(Folder.id == folder_id, Folder.user_id == current_user.id)
            .first()
        )
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

    try:
        # Read and merge content from all documents
        merged_content = []
        for doc in documents:
            # Try to read from database first (most reliable)
            if doc.file_content:
                file_ext = FileHandler.get_file_extension(doc.filename)
                content = FileHandler.read_file_content_from_bytes(doc.file_content, file_ext)
            else:
                # Fallback: Read from disk
                content = FileHandler.read_file_content(doc.file_path)

            merged_content.append(f"# {doc.original_filename}\n\n{content}\n\n")

        full_content = "\n---\n\n".join(merged_content)

        # Generate filename if not provided
        if not merged_filename:
            merged_filename = f"merged_{documents[0].original_filename}"

        # Ensure .md extension
        if not merged_filename.endswith('.md'):
            merged_filename = f"{merged_filename}.md"

        # Save merged content to disk
        unique_filename = f"{uuid.uuid4()}.md"
        file_path = Path(settings.UPLOAD_DIR) / unique_filename
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Save to disk
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(full_content)

        # Also save content as bytes for database
        merged_content_bytes = full_content.encode('utf-8')

        # Create document record
        merged_document = Document(
            user_id=current_user.id,
            folder_id=folder_id,
            filename=unique_filename,
            original_filename=merged_filename,
            file_path=str(file_path),
            file_content=merged_content_bytes,  # Store merged content in database
            file_size=FileHandler.get_file_size(str(file_path)),
            file_type=".md",
            status="processing",
        )

        db.add(merged_document)
        db.commit()
        db.refresh(merged_document)

        # Upload to Gemini API
        try:
            gemini_file_id = await gemini_service.upload_file(
                file_path=str(file_path),
                display_name=merged_filename,
            )

            merged_document.gemini_file_id = gemini_file_id
            merged_document.status = "ready"
            db.commit()
            db.refresh(merged_document)

        except Exception as e:
            merged_document.status = "error"
            merged_document.error_message = str(e)
            db.commit()
            db.refresh(merged_document)

        return DocumentResponse.from_orm(merged_document)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to merge documents: {str(e)}",
        )
