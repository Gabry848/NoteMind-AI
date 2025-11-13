/**
 * Dashboard page - Document management
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
import type { Document } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, checkAuth } = useAuthStore();
  const { documents, fetchDocuments, uploadDocument, deleteDocument, selectDocument, isLoading } =
    useDocumentsStore();
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    checkAuth();
    if (!user) {
      router.push("/login");
    } else {
      fetchDocuments();
    }
  }, [user, router]);

  const handleFileSelect = async (file: File) => {
    try {
      await uploadDocument(file);
      setShowUpload(false);
    } catch (error) {
      console.error("Upload failed:", error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            NoteMind AI
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Hi, {user?.full_name || user?.email}</span>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upload Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Documents</h2>
              <p className="text-gray-600">
                Upload and chat with your documents using AI
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUpload(!showUpload)}
              size="lg"
            >
              {showUpload ? "Cancel" : "+ Upload Document"}
            </Button>
          </div>

          <AnimatePresence>
            {showUpload && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <FileUpload onFileSelect={handleFileSelect} />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-600 mb-6">
                Upload your first document to get started
              </p>
              <Button
                variant="primary"
                onClick={() => setShowUpload(true)}
              >
                Upload Document
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={() => handleDocumentClick(doc)}
                onDelete={(e) => handleDelete(e, doc.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  document,
  onClick,
  onDelete,
}: {
  document: Document;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-4xl">📄</div>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600 transition-colors"
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

      <h3 className="font-semibold text-gray-900 mb-2 truncate">
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
        <span className="text-sm text-gray-500">
          {(document.file_size / 1024).toFixed(1)} KB
        </span>
      </div>

      {document.error_message && (
        <p className="mt-2 text-xs text-red-600">{document.error_message}</p>
      )}
    </motion.div>
  );
}
