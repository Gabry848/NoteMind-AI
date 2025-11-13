/**
 * Documents store using Zustand
 */
import { create } from "zustand";
import { documents as documentsApi } from "@/lib/api";
import type { Document } from "@/types";

interface DocumentsState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, folderId?: number) => Promise<Document>;
  deleteDocument: (id: number) => Promise<void>;
  selectDocument: (document: Document | null) => void;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  selectedDocument: null,
  isLoading: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await documentsApi.list();
      set({ documents: response.documents, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch documents",
        isLoading: false,
      });
    }
  },

  uploadDocument: async (file: File, folderId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const document = await documentsApi.upload(file, folderId);
      set((state) => ({
        documents: [document, ...state.documents],
        isLoading: false,
      }));
      return document;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to upload document",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteDocument: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await documentsApi.delete(id);
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        selectedDocument:
          state.selectedDocument?.id === id ? null : state.selectedDocument,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to delete document",
        isLoading: false,
      });
      throw error;
    }
  },

  selectDocument: (document: Document | null) => {
    set({ selectedDocument: document });
  },
}));
