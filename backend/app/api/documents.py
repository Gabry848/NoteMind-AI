"""
Document management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.folder import Folder
from app.utils.dependencies import get_current_user
from app.utils.file_handler import FileHandler
from app.services.gemini_service import gemini_service
from app.services.ocr_service import ocr_service
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

        # Create document record
        document = Document(
            user_id=current_user.id,
            folder_id=folder_id,
            filename=unique_filename,
            original_filename=original_filename,
            file_path=file_path,
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

    # Read file content
    content = FileHandler.read_file_content(document.file_path)

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get or generate Mermaid diagram schema for a document

    Args:
        document_id: Document ID
        regenerate: Force regeneration even if schema exists
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
    if document.mermaid_schema and not regenerate:
        return MermaidSchemaResponse(
            document_id=document.id,
            mermaid_schema=document.mermaid_schema,
        )

    # Generate new schema
    try:
        mermaid_schema = await gemini_service.generate_mermaid_schema(
            file_id=document.gemini_file_id
        )

        # Save to database
        document.mermaid_schema = mermaid_schema
        db.commit()
        db.refresh(document)

        return MermaidSchemaResponse(
            document_id=document.id,
            mermaid_schema=mermaid_schema,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Mermaid schema: {str(e)}",
        )
