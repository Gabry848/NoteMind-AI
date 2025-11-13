"""
Folder management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.folder import Folder
from app.models.document import Document
from app.utils.dependencies import get_current_user
from app.schemas.folder import (
    FolderCreate,
    FolderUpdate,
    FolderResponse,
    FolderTreeResponse,
    FolderWithChildren,
)

router = APIRouter(prefix="/folders", tags=["Folders"])


def build_folder_tree(folders: List[Folder], parent_id: int = None, db: Session = None) -> List[FolderWithChildren]:
    """Recursively build folder tree structure"""
    tree = []
    for folder in folders:
        if folder.parent_id == parent_id:
            # Count documents in this folder
            doc_count = db.query(Document).filter(Document.folder_id == folder.id).count() if db else 0
            
            folder_data = FolderWithChildren(
                id=folder.id,
                name=folder.name,
                parent_id=folder.parent_id,
                color=folder.color,
                icon=folder.icon,
                user_id=folder.user_id,
                created_at=folder.created_at,
                updated_at=folder.updated_at,
                document_count=doc_count,
                children=build_folder_tree(folders, folder.id, db),
            )
            tree.append(folder_data)
    return tree


@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new folder

    Args:
        folder: Folder creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created folder information
    """
    # Check if parent folder exists and belongs to user
    if folder.parent_id:
        parent_folder = (
            db.query(Folder)
            .filter(Folder.id == folder.parent_id, Folder.user_id == current_user.id)
            .first()
        )
        if not parent_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found",
            )

    # Create folder
    new_folder = Folder(
        user_id=current_user.id,
        name=folder.name,
        parent_id=folder.parent_id,
        color=folder.color,
        icon=folder.icon,
    )

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    return FolderResponse.from_orm(new_folder)


@router.get("", response_model=FolderTreeResponse)
async def list_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all folders in tree structure

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        Folder tree structure
    """
    folders = (
        db.query(Folder)
        .filter(Folder.user_id == current_user.id)
        .order_by(Folder.name)
        .all()
    )

    tree = build_folder_tree(folders, None, db)

    return FolderTreeResponse(
        folders=tree,
        total=len(folders),
    )


@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific folder

    Args:
        folder_id: Folder ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Folder information
    """
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

    return FolderResponse.from_orm(folder)


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: int,
    folder_update: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a folder

    Args:
        folder_id: Folder ID
        folder_update: Folder update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated folder information
    """
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

    # Check if new parent folder exists and belongs to user
    if folder_update.parent_id is not None:
        # Prevent circular references
        if folder_update.parent_id == folder_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot set folder as its own parent",
            )
        
        if folder_update.parent_id:
            parent_folder = (
                db.query(Folder)
                .filter(Folder.id == folder_update.parent_id, Folder.user_id == current_user.id)
                .first()
            )
            if not parent_folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent folder not found",
                )

    # Update folder fields
    update_data = folder_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)

    db.commit()
    db.refresh(folder)

    return FolderResponse.from_orm(folder)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a folder (documents inside will be moved to root)

    Args:
        folder_id: Folder ID
        current_user: Current authenticated user
        db: Database session
    """
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

    # Move documents to root (set folder_id to None)
    db.query(Document).filter(Document.folder_id == folder_id).update({"folder_id": None})

    # Move child folders to parent or root
    db.query(Folder).filter(Folder.parent_id == folder_id).update({"parent_id": folder.parent_id})

    # Delete folder
    db.delete(folder)
    db.commit()

    return None
