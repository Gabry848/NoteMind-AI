/**
 * MultiDocumentSelector Component
 * Allows users to select multiple documents for chat
 */
'use client';

import { useState, useEffect } from 'react';
import { Document } from '@/types';
import { documents as documentsApi } from '@/lib/api';

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
      const data = await documentsApi.list();
      // Filter only ready documents
      const readyDocs = data.documents.filter((doc: Document) => doc.status === 'ready');
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
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-400"></div>
        <p className="mt-2 text-sm text-gray-300">Caricamento documenti...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-4">
        <p className="text-rose-200">Errore: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Seleziona Documenti ({selectedDocumentIds.length}/{maxDocuments})
        </h3>
        <div className="space-x-2">
          <button
            onClick={selectAll}
            className="rounded border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-sm text-blue-200 transition-colors hover:border-blue-300/60 hover:bg-blue-500/25"
            disabled={documents.length === 0}
          >
            Seleziona Tutti
          </button>
          <button
            onClick={clearSelection}
            className="rounded border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200 transition-colors hover:border-blue-400/40 hover:bg-blue-500/10"
            disabled={selectedDocumentIds.length === 0}
          >
            Cancella
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-8 text-center bg-gray-800/50 rounded-lg border border-gray-700/50">
          <p className="text-gray-400">Nessun documento disponibile</p>
          <p className="text-sm text-gray-500 mt-2">
            Carica dei documenti per iniziare
          </p>
        </div>
      ) : (
        <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto">
          {documents.map((doc) => {
            const isSelected = selectedDocumentIds.includes(doc.id);
            return (
              <label
                key={doc.id}
                className={`
                  flex cursor-pointer items-center rounded-lg border p-3 transition-all
                  ${
                    isSelected
                      ? 'border-blue-400/50 bg-blue-500/15 shadow-lg shadow-blue-900/30'
                      : 'border-white/10 bg-white/5 hover:border-blue-400/40 hover:bg-blue-500/10'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleDocument(doc.id)}
                  className="mr-3 h-4 w-4 rounded border border-white/20 bg-[#0B1327]/70 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {doc.original_filename}
                  </p>
                  <p className="text-sm text-gray-300">
                    {doc.file_type} • {(doc.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {isSelected && (
                  <span className="ml-2 rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-200">
                    Selezionato
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      {selectedDocumentIds.length > 0 && (
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3">
          <p className="text-sm text-emerald-200">
            ✓ {selectedDocumentIds.length} documento
            {selectedDocumentIds.length > 1 ? 'i' : ''} selezionato
            {selectedDocumentIds.length > 1 ? 'i' : ''}.
          </p>
        </div>
      )}
    </div>
  );
}
