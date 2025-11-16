/**
 * TypeScript type definitions
 */

export interface User {
  id: number;
  email: string;
  full_name?: string;
  preferred_language: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  folder_id?: number;
  status: "processing" | "ready" | "error";
  error_message?: string;
  summary?: string;
  mermaid_schema?: string;
  media_duration?: number;  // Duration in seconds for audio/video
  transcript_content?: string;  // Transcription for media files
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  created_at?: string;
}

export interface Citation {
  text: string;
  title?: string;
  uri?: string;
}

export interface ChatRequest {
  document_id?: number;        // Single document (backward compatible)
  document_ids?: number[];     // Multiple documents
  message: string;
  conversation_id?: number;
}

export interface ChatResponse {
  conversation_id: number;
  message: ChatMessage;
  context?: string;
}

export interface Conversation {
  id: number;
  document_id?: number;        // Backward compatibility
  document_ids?: number[];     // Multiple documents
  title: string;
  created_at: string;
  messages: ChatMessage[];
}

export interface SummaryRequest {
  document_id: number;
  summary_type: "brief" | "medium" | "detailed";
}

export interface SummaryResponse {
  document_id: number;
  summary: string;
  topics: string[];
}

export interface Folder {
  id: number;
  name: string;
  parent_id?: number;
  color: string;
  icon: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  children?: Folder[];
  document_count?: number;
}

export interface FolderTreeResponse {
  folders: Folder[];
  total: number;
}

export interface FolderCreate {
  name: string;
  parent_id?: number;
  color?: string;
  icon?: string;
}

export interface FolderUpdate {
  name?: string;
  parent_id?: number;
  color?: string;
  icon?: string;
}

export interface MermaidSchemaResponse {
  document_id: number;
  mermaid_schema: string;
}

// Search types
export interface SearchFilters {
  file_types?: string[];
  folder_ids?: number[];
  date_from?: string;
  date_to?: string;
  status?: string;
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  sort_by?: string;
  limit?: number;
  offset?: number;
}

export interface DocumentSearchResult {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  folder_id?: number;
  created_at: string;
  updated_at: string;
  highlight?: string;
}

export interface ConversationSearchResult {
  id: number;
  conversation_id: number;
  document_id?: number;
  title: string;
  message_content: string;
  created_at: string;
  highlight?: string;
}

export interface SearchResponse {
  documents: DocumentSearchResult[];
  conversations: ConversationSearchResult[];
  total_documents: number;
  total_conversations: number;
  query: string;
}

export interface SearchSuggestion {
  text: string;
  type: string;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}
