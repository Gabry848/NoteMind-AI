/**
 * FolderTree component - Hierarchical folder/document view
 */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Folder, Document } from "@/types";

interface FolderTreeProps {
  folders: Folder[];
  documents: Document[];
  onFolderClick?: (folder: Folder) => void;
  onDocumentClick?: (document: Document) => void;
  onFolderCreate?: (parentId?: number) => void;
  onFolderEdit?: (folder: Folder) => void;
  onFolderDelete?: (folderId: number) => void;
  onDocumentDelete?: (documentId: number) => Promise<void>;
  selectedDocumentIds?: number[];
  onDocumentToggle?: (documentId: number) => void;
  showCheckboxes?: boolean;
  onDocumentMove?: (documentId: number, folderId?: number) => Promise<void>;
}

export function FolderTree({
  folders,
  documents,
  onFolderClick,
  onDocumentClick,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
  onDocumentDelete,
  selectedDocumentIds = [],
  onDocumentToggle,
  showCheckboxes = false,
  onDocumentMove,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [draggedDocument, setDraggedDocument] = useState<Document | null>(null);
  const [dropTarget, setDropTarget] = useState<number | "root" | null>(null);

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleDragStart = (doc: Document) => {
    setDraggedDocument(doc);
  };

  const handleDragEnd = () => {
    setDraggedDocument(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(folderId ?? "root");
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedDocument && onDocumentMove) {
      await onDocumentMove(draggedDocument.id, folderId);
    }
    
    setDraggedDocument(null);
    setDropTarget(null);
  };

  const getFolderDocuments = (folderId?: number) => {
    return documents.filter((doc) => {
      if (folderId === undefined) {
        return doc.folder_id === null || doc.folder_id === undefined;
      }
      return doc.folder_id === folderId;
    });
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const folderDocs = getFolderDocuments(folder.id);
    const hasChildren = (folder.children && folder.children.length > 0) || folderDocs.length > 0;

    return (
      <div key={folder.id}>
        <FolderItem
          folder={folder}
          level={level}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggle={() => toggleFolder(folder.id)}
          onClick={() => onFolderClick?.(folder)}
          onEdit={() => onFolderEdit?.(folder)}
          onDelete={() => onFolderDelete?.(folder.id)}
          isDropTarget={dropTarget === folder.id}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        />

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Render child folders */}
              {folder.children?.map((child) => renderFolder(child, level + 1))}

              {/* Render documents in this folder */}
              {folderDocs.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  level={level + 1}
                  onClick={() => onDocumentClick?.(doc)}
                  isSelected={selectedDocumentIds.includes(doc.id)}
                  onToggle={() => onDocumentToggle?.(doc.id)}
                  showCheckbox={showCheckboxes}
                  onDragStart={() => handleDragStart(doc)}
                  onDragEnd={handleDragEnd}
                  onDelete={onDocumentDelete}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Root level documents (no folder)
  const rootDocuments = getFolderDocuments(undefined);

  return (
    <div className="space-y-1">
      {/* Create folder button at root */}
      {onFolderCreate && (
        <button
          onClick={() => onFolderCreate()}
          className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>New Folder</span>
        </button>
      )}

      {/* Render root folders */}
      {folders.map((folder) => renderFolder(folder, 0))}

      {/* Root Documents Section */}
      {(rootDocuments.length > 0 || dropTarget === "root") && (
        <div
          className={`mt-2 rounded-lg border-2 transition-all ${
            dropTarget === "root"
              ? "border-blue-500 border-dashed bg-blue-900/20"
              : "border-transparent"
          }`}
          onDragOver={(e) => handleDragOver(e, undefined)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, undefined)}
        >
          {rootDocuments.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <span>📂</span>
                <span>Uncategorized Files</span>
                <span className="text-gray-600">({rootDocuments.length})</span>
              </div>
              <div className="space-y-1">
                {rootDocuments.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    document={doc}
                    level={0}
                    onClick={() => onDocumentClick?.(doc)}
                    isSelected={selectedDocumentIds.includes(doc.id)}
                    onToggle={() => onDocumentToggle?.(doc.id)}
                    showCheckbox={showCheckboxes}
                    onDragStart={() => handleDragStart(doc)}
                    onDragEnd={handleDragEnd}
                    onDelete={onDocumentDelete}
                  />
                ))}
              </div>
            </>
          ) : dropTarget === "root" ? (
            <div className="px-3 py-8 text-center text-gray-400 text-sm">
              Drop here to move to root
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface FolderItemProps {
  folder: Folder;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDropTarget?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}

function FolderItem({
  folder,
  level,
  isExpanded,
  hasChildren,
  onToggle,
  onClick,
  onEdit,
  onDelete,
  isDropTarget = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: FolderItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  return (
    <>
      <div
        className={`group flex items-center gap-1 px-3 py-2 hover:bg-gray-700 rounded transition-colors relative ${
          isDropTarget ? "bg-blue-900/30 border-2 border-blue-500 border-dashed" : ""
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onContextMenu={handleContextMenu}
      >
      {/* Expand/collapse arrow */}
      {hasChildren ? (
        <button
          onClick={onToggle}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white"
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <span className="w-4" />
      )}

      {/* Folder icon and name */}
      <div
        onClick={onClick}
        className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
      >
        <span className="text-lg flex-shrink-0">{folder.icon}</span>
        <span className="text-sm text-gray-300 truncate">{folder.name}</span>
        {folder.document_count !== undefined && folder.document_count > 0 && (
          <span className="text-xs text-gray-500">({folder.document_count})</span>
        )}
      </div>

      {/* Context menu button */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setContextMenuPos({ x: e.clientX, y: e.clientY });
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>

      {/* Context menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div 
            className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px]"
            style={{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span>👁️</span>
              <span>Apri</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span>✏️</span>
              <span>Rinomina</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(folder.name);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span>📋</span>
              <span>Copia nome</span>
            </button>
            <div className="h-px bg-gray-700 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>Elimina</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}

interface DocumentItemProps {
  document: Document;
  level: number;
  onClick: () => void;
  isSelected: boolean;
  onToggle: () => void;
  showCheckbox: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDelete?: (documentId: number) => Promise<void>;
}

function DocumentItem({
  document,
  level,
  onClick,
  isSelected,
  onToggle,
  showCheckbox,
  onDragStart,
  onDragEnd,
  onDelete,
}: DocumentItemProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📕";
    if (fileType.includes("doc")) return "📘";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("md")) return "📝";
    return "📄";
  };

  return (
    <>
      <div
        draggable={!showCheckbox}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onContextMenu={handleContextMenu}
        className={`
          group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
          ${isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-gray-300"}
        `}
        style={{ paddingLeft: `${level * 20 + 32}px` }}
      >
      {showCheckbox && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
        />
      )}

      <div
        onClick={onClick}
        className="flex-1 flex items-center gap-2 min-w-0"
      >
        <span className="text-lg flex-shrink-0">{getFileIcon(document.file_type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{document.original_filename}</p>
          <p className={`text-xs ${isSelected ? "text-blue-100" : "text-gray-500"}`}>
            {(document.file_size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      {document.status === "ready" && !showCheckbox && (
        <span className="text-xs opacity-0 group-hover:opacity-100">💬</span>
      )}
    </div>

    {/* Context Menu */}
    {showContextMenu && (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowContextMenu(false)}
        />
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px]"
          style={{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>👁️</span>
            <span>Apri</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(document.original_filename);
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>📋</span>
            <span>Copia nome</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`http://localhost:8000/api/documents/${document.id}/download`, '_blank');
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>⬇️</span>
            <span>Scarica</span>
          </button>
          <div className="h-px bg-gray-700 my-1" />
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (confirm(`Eliminare "${document.original_filename}"?`)) {
                try {
                  await onDelete?.(document.id);
                } catch (error) {
                  console.error("Failed to delete document:", error);
                  alert("Errore nell'eliminazione del file");
                }
              }
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>Elimina</span>
          </button>
        </div>
      </>
    )}
  </>
  );
}
