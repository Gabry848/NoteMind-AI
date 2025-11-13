/**
 * MultiDocumentSelector Component
 * Allows users to select multiple documents for chat
 */
'use client';

import { useState, useEffect } from 'react';
import { Document } from '@/types';

interface MultiDocumentSelectorProps {
  selectedDocumentIds: number[];
  onSelectionChange: (documentIds: number[]) => void;
  maxDocuments?: number;
}

export default function MultiDocumentSelector({
  selectedDocumentIds,
  onSelectionChange,
  maxDocuments = 5,
}: MultiDocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      // Filter only ready documents
      const readyDocs = data.filter((doc: Document) => doc.status === 'ready');
      setDocuments(readyDocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDocument = (documentId: number) => {
    if (selectedDocumentIds.includes(documentId)) {
      // Remove document
      onSelectionChange(selectedDocumentIds.filter((id) => id !== documentId));
    } else {
      // Add document (check max limit)
      if (selectedDocumentIds.length < maxDocuments) {
        onSelectionChange([...selectedDocumentIds, documentId]);
      } else {
        alert(`You can select up to ${maxDocuments} documents at once`);
      }
    }
  };

  const selectAll = () => {
    const allIds = documents.slice(0, maxDocuments).map((doc) => doc.id);
    onSelectionChange(allIds);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Select Documents ({selectedDocumentIds.length}/{maxDocuments})
        </h3>
        <div className="space-x-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            disabled={documents.length === 0}
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            disabled={selectedDocumentIds.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-600">No documents available</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload documents to start chatting
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
          {documents.map((doc) => {
            const isSelected = selectedDocumentIds.includes(doc.id);
            return (
              <label
                key={doc.id}
                className={`
                  flex items-center p-3 border rounded-lg cursor-pointer transition-all
                  ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleDocument(doc.id)}
                  className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {doc.original_filename}
                  </p>
                  <p className="text-sm text-gray-500">
                    {doc.file_type} • {(doc.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {isSelected && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded">
                    Selected
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      {selectedDocumentIds.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ {selectedDocumentIds.length} document
            {selectedDocumentIds.length > 1 ? 's' : ''} selected. You can now
            chat across all selected documents.
          </p>
        </div>
      )}
    </div>
  );
}
