/**
 * API Client for NoteMind AI Backend
 */
import axios from "axios";
import type {
  AuthResponse,
  DocumentListResponse,
  Document,
  ChatRequest,
  ChatResponse,
  Conversation,
  SummaryRequest,
  SummaryResponse,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const auth = {
  register: async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Documents API
export const documents = {
  list: async (): Promise<DocumentListResponse> => {
    const response = await api.get("/documents");
    return response.data;
  },

  get: async (id: number): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  upload: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  getContent: async (id: number): Promise<{ document_id: number; filename: string; content: string }> => {
    const response = await api.get(`/documents/${id}/content`);
    return response.data;
  },
};

// Chat API
export const chat = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post("/chat", request);
    return response.data;
  },

  sendMultiDocumentMessage: async (
    documentIds: number[],
    message: string,
    conversationId?: number
  ): Promise<ChatResponse> => {
    const response = await api.post("/chat", {
      document_ids: documentIds,
      message,
      conversation_id: conversationId,
    });
    return response.data;
  },

  getHistory: async (documentId: number): Promise<Conversation[]> => {
    const response = await api.get(`/chat/history/${documentId}`);
    return response.data;
  },

  deleteConversation: async (conversationId: number): Promise<void> => {
    await api.delete(`/chat/${conversationId}`);
  },
};

// Summaries API
export const summaries = {
  generate: async (request: SummaryRequest): Promise<SummaryResponse> => {
    const response = await api.post("/summaries/generate", request);
    return response.data;
  },

  get: async (documentId: number): Promise<SummaryResponse> => {
    const response = await api.get(`/summaries/${documentId}`);
    return response.data;
  },
};

export default api;
