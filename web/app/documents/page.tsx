/**
 * Documents Management Page - Full document browser with tree/grid view
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useDocumentsStore } from "@/store/useDocumentsStore";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FileUpload } from "@/components/FileUpload";
import { FolderTree } from "@/components/FolderTree";
import { folders as foldersApi, documents as docsApi } from "@/lib/api";
import type { Document, Folder } from "@/types";

export default function DocumentsPage() {
  const router = useRouter();
  const { user, logout, isInitialized } = useAuthStore();
  const { documents, fetchDocuments, uploadDocument, deleteDocument, selectDocument, isLoading } =
    useDocumentsStore();
  const [showUpload, setShowUpload] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | undefined>();
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderIcon, setFolderIcon] = useState("📁");
  const [viewMode, setViewMode] = useState<"grid" | "tree">("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "ready" | "processing" | "error">("all");
  const [draggedDoc, setDraggedDoc] = useState<Document | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeFilename, setMergeFilename] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    } else if (user) {
      fetchDocuments();
      loadFolders();
    }
  }, [user, isInitialized, router, fetchDocuments]);

  const loadFolders = async () => {
    try {
      const response = await foldersApi.list();
      setFolders(response.folders);
    } catch (error) {
      console.error("Failed to load folders:", error);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      await uploadDocument(file, selectedFolder);
      setShowUpload(false);
      await fetchDocuments();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleCreateFolder = (parentId?: number) => {
    setEditingFolder(null);
    setFolderName("");
    setFolderIcon("📁");
    setSelectedFolder(parentId);
    setShowFolderDialog(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderIcon(folder.icon);
    setShowFolderDialog(true);
  };

  const handleSaveFolder = async () => {
    try {
      if (editingFolder) {
        await foldersApi.update(editingFolder.id, { name: folderName, icon: folderIcon });
      } else {
        await foldersApi.create({
          name: folderName,
          icon: folderIcon,
          parent_id: selectedFolder,
        });
      }
      setShowFolderDialog(false);
      await loadFolders();
    } catch (error) {
      console.error("Failed to save folder:", error);
      alert("Failed to save folder");
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (confirm("Delete this folder? Documents inside will be moved to root.")) {
      try {
        await foldersApi.delete(folderId);
        await loadFolders();
      } catch (error) {
        console.error("Failed to delete folder:", error);
      }
    }
  };

  const handleDocumentClick = (doc: Document) => {
    selectDocument(doc);
    router.push(`/document/${doc.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, docId: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDocument(docId);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleDragStart = (doc: Document) => {
    setDraggedDoc(doc);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnFolder = async (folderId: number | undefined) => {
    if (!draggedDoc) return;
    
    try {
      // Update document folder via API
      const response = await fetch(`http://localhost:8000/api/documents/${draggedDoc.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ folder_id: folderId }),
      });

      if (response.ok) {
        await fetchDocuments();
        setDraggedDoc(null);
      }
    } catch (error) {
      console.error("Failed to move document:", error);
    }
  };

  const handleDocumentMove = async (documentId: number, folderId?: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ folder_id: folderId }),
      });

      if (response.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to move document:", error);
    }
  };

  const toggleDocumentSelection = (docId: number) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleMergeDocuments = async () => {
    if (selectedDocuments.size < 2) {
      alert("Please select at least 2 documents to merge");
      return;
    }

    setIsMerging(true);
    try {
      const documentIds = Array.from(selectedDocuments);
      await docsApi.merge(documentIds, mergeFilename || undefined, selectedFolder);
      
      setShowMergeDialog(false);
      setSelectedDocuments(new Set());
      setMergeFilename("");
      await fetchDocuments();
      alert("Documents merged successfully!");
    } catch (error) {
      console.error("Failed to merge documents:", error);
      alert("Failed to merge documents");
    } finally {
      setIsMerging(false);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || doc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                My Documents
              </h1>
              <span className="text-sm text-gray-400">
                {filteredDocuments.length} file{filteredDocuments.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Hi, {user?.full_name || user?.email}</span>
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-3">
              <Button
                variant={viewMode === "tree" ? "primary" : "secondary"}
                onClick={() => setViewMode("tree")}
              >
                🌲 Tree View
              </Button>
              <Button
                variant={viewMode === "grid" ? "primary" : "secondary"}
                onClick={() => setViewMode("grid")}
              >
                📊 Grid View
              </Button>
              {selectedDocuments.size >= 2 && (
                <Button
                  variant="primary"
                  onClick={() => setShowMergeDialog(true)}
                >
                  🔗 Merge {selectedDocuments.size} Documents
                </Button>
              )}
              {selectedDocuments.size > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDocuments(new Set())}
                >
                  Clear Selection
                </Button>
              )}
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUpload(!showUpload)}
            >
              {showUpload ? "Cancel" : "+ Upload Document"}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "ready" | "processing" | "error")}
              className="px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {/* Upload Section */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card>
                <FileUpload onFileSelect={handleFileSelect} acceptImages={true} acceptMedia={true} />
                <p className="mt-4 text-sm text-gray-400 text-center">
                  💡 Carica documenti, immagini (OCR automatico), o file audio/video (trascrizione automatica)
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents View */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? "No matching documents" : "No documents yet"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ? "Try a different search term" : "Upload your first document to get started"}
              </p>
              {!searchQuery && (
                <Button variant="primary" onClick={() => setShowUpload(true)}>
                  Upload Document
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === "tree" ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md p-4">
            <FolderTree
              folders={folders}
              documents={filteredDocuments}
              onDocumentClick={handleDocumentClick}
              onFolderCreate={handleCreateFolder}
              onFolderEdit={handleEditFolder}
              onFolderDelete={handleDeleteFolder}
              onDocumentMove={handleDocumentMove}
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={() => handleDocumentClick(doc)}
                onDelete={(e) => handleDelete(e, doc.id)}
                onDragStart={() => handleDragStart(doc)}
                isSelected={selectedDocuments.has(doc.id)}
                onToggleSelect={() => toggleDocumentSelection(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Merge Dialog */}
      {showMergeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Merge Documents
            </h3>

            <p className="text-gray-300 mb-4">
              You are merging {selectedDocuments.size} documents into one.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Merged Filename (optional)
                </label>
                <input
                  type="text"
                  value={mergeFilename}
                  onChange={(e) => setMergeFilename(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="merged_document.md"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty for auto-generated name
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowMergeDialog(false)}
                className="flex-1"
                disabled={isMerging}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleMergeDocuments}
                className="flex-1"
                disabled={isMerging}
              >
                {isMerging ? "Merging..." : "Merge"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Folder Dialog */}
      {showFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              {editingFolder ? "Edit Folder" : "New Folder"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter folder name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["📁", "📂", "📚", "📦", "🗂️", "📋", "💼", "🎯"].map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFolderIcon(icon)}
                      className={`text-2xl p-2 rounded border ${
                        folderIcon === icon
                          ? "border-blue-500 bg-blue-900/30"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowFolderDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveFolder}
                className="flex-1"
                disabled={!folderName.trim()}
              >
                {editingFolder ? "Save" : "Create"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  document,
  onClick,
  onDelete,
  onDragStart,
  isSelected = false,
  onToggleSelect,
}: {
  document: Document;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDragStart: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      // If modifier key is pressed, toggle selection
      if (onToggleSelect) {
        onToggleSelect();
      }
    } else {
      // Normal click, open document
      onClick();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-900/30 text-green-400 border border-green-800";
      case "processing":
        return "bg-yellow-900/30 text-yellow-400 border border-yellow-800";
      case "error":
        return "bg-red-900/30 text-red-400 border border-red-800";
      default:
        return "bg-gray-700 text-gray-400 border border-gray-600";
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={onDragStart}
        className={`bg-gray-800 rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border ${
          isSelected ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-700"
        }`}
      >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="text-4xl">📄</div>
          {isSelected && (
            <div className="text-blue-500 text-xl">✓</div>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-gray-500 hover:text-red-400 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <h3 className="font-semibold text-white mb-2 truncate">
        {document.original_filename}
      </h3>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
            document.status
          )}`}
        >
          {document.status}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {(document.file_size / 1024).toFixed(1)} KB
          </span>
          {document.status === "ready" && (
            <span className="text-xs text-blue-400" title="Ready to chat">
              💬
            </span>
          )}
        </div>
      </div>

      {document.error_message && (
        <p className="mt-2 text-xs text-red-400">{document.error_message}</p>
      )}
    </motion.div>

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
              if (onToggleSelect) {
                onToggleSelect();
              }
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>{isSelected ? "☑️" : "☐"}</span>
            <span>{isSelected ? "Deseleziona" : "Seleziona"}</span>
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(document.id.toString());
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>🔗</span>
            <span>Copia ID</span>
          </button>
          <div className="h-px bg-gray-700 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
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
