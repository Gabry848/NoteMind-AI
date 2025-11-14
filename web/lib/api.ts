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
  FolderTreeResponse,
  Folder,
  FolderCreate,
  FolderUpdate,
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

  updateProfile: async (data: { full_name?: string; preferred_language?: string }) => {
    const response = await api.put("/auth/me", data);
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

  upload: async (file: File, folderId?: number): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) {
      formData.append("folder_id", folderId.toString());
    }
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

  getMermaidSchema: async (
    id: number, 
    regenerate: boolean = false,
    diagramType: string = "auto",
    detailLevel: string = "compact"
  ): Promise<{ 
    document_id: number; 
    mermaid_schema: string;
    diagram_type: string;
    detail_level: string;
  }> => {
    const params = new URLSearchParams();
    if (regenerate) params.append('regenerate', 'true');
    if (diagramType !== 'auto') params.append('diagram_type', diagramType);
    if (detailLevel !== 'compact') params.append('detail_level', detailLevel);
    
    const queryString = params.toString();
    const response = await api.get(`/documents/${id}/mermaid${queryString ? '?' + queryString : ''}`);
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

// Folders API
export const folders = {
  list: async (): Promise<FolderTreeResponse> => {
    const response = await api.get("/folders");
    return response.data;
  },

  get: async (id: number): Promise<Folder> => {
    const response = await api.get(`/folders/${id}`);
    return response.data;
  },

  create: async (folder: FolderCreate): Promise<Folder> => {
    const response = await api.post("/folders", folder);
    return response.data;
  },

  update: async (id: number, folder: FolderUpdate): Promise<Folder> => {
    const response = await api.put(`/folders/${id}`, folder);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/folders/${id}`);
  },
};

// Analytics API
export const analytics = {
  getOverview: async () => {
    const response = await api.get("/analytics/overview");
    return response.data;
  },

  getActivity: async (days: number = 7) => {
    const response = await api.get(`/analytics/activity?days=${days}`);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get("/analytics/summary");
    return response.data;
  },
};

// Quiz API
export const quiz = {
  generate: async (config: {
    document_ids: number[];
    question_count: number;
    question_type: 'multiple_choice' | 'open_ended' | 'mixed';
    difficulty: 'easy' | 'medium' | 'hard';
    language?: string;
  }) => {
    const response = await api.post("/quiz/generate", config);
    return response.data;
  },

  submit: async (submission: {
    quiz_id: string;
    answers: { question_id: string; answer: string }[];
  }) => {
    const response = await api.post("/quiz/submit", submission);
    return response.data;
  },

  delete: async (quizId: string): Promise<void> => {
    await api.delete(`/quiz/${quizId}`);
  },

  getResults: async (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await api.get(`/quiz/results?${params}`);
    return response.data;
  },

  getResultDetail: async (resultId: number) => {
    const response = await api.get(`/quiz/results/${resultId}`);
    return response.data;
  },

  downloadQuestions: async (quizId: string, format: 'json' | 'markdown' | 'pdf' = 'json') => {
    if (format === 'json') {
      const response = await api.get(`/quiz/download/${quizId}?format=json`);
      return response.data;
    } else {
      // For markdown and pdf, trigger browser download
      const response = await api.get(`/quiz/download/${quizId}?format=${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/markdown'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_${quizId}.${format === 'pdf' ? 'pdf' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },

  downloadResults: async (resultId: number, format: 'json' | 'markdown' | 'pdf' = 'json') => {
    if (format === 'json') {
      const response = await api.get(`/quiz/results/${resultId}/download?format=json`);
      return response.data;
    } else {
      // For markdown and pdf, trigger browser download
      const response = await api.get(`/quiz/results/${resultId}/download?format=${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/markdown'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_results_${resultId}.${format === 'pdf' ? 'pdf' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },

  share: async (shareRequest: {
    quiz_id: string;
    title?: string;
    description?: string;
    expires_in_days?: number;
  }) => {
    const response = await api.post("/quiz/share", shareRequest);
    return response.data;
  },

  getShared: async (shareToken: string) => {
    const response = await api.get(`/quiz/shared/${shareToken}`);
    return response.data;
  },

  submitShared: async (shareToken: string, answers: { question_id: string; answer: string }[]) => {
    const response = await api.post(`/quiz/shared/${shareToken}/submit`, { answers });
    return response.data;
  },

  deleteShared: async (shareToken: string): Promise<void> => {
    await api.delete(`/quiz/shared/${shareToken}`);
  },
};

export default api;
