/**
 * Multi-Document Chat Page
 * Chat with multiple documents simultaneously
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useDocumentsStore } from "@/store/useDocumentsStore";
import { chat } from "@/lib/api";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { Document, ChatMessage } from "@/types";

export default function MultiChatPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const { documents, fetchDocuments } = useDocumentsStore();
  
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
      if (!user) {
        router.push("/login");
      } else {
        await fetchDocuments();
      }
    };
    initialize();
  }, [user, router, checkAuth, fetchDocuments]);

  const readyDocuments = documents.filter((doc) => doc.status === "ready");

  const handleDocumentToggle = (docId: number) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const handleStartChat = () => {
    if (selectedDocIds.length === 0) {
      alert("Please select at least one document");
      return;
    }
    setShowSelector(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || selectedDocIds.length === 0 || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await chat.sendMultiDocumentMessage(
        selectedDocIds,
        userMessage.content,
        conversationId || undefined
      );

      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (messages.length > 0) {
      if (confirm("Are you sure you want to leave? Your conversation will be saved.")) {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  };

  const handleChangeDocuments = () => {
    if (confirm("Changing documents will start a new conversation. Continue?")) {
      setShowSelector(true);
      setConversationId(null);
      setMessages([]);
    }
  };

  const getSelectedDocuments = () => {
    return documents.filter((doc) => selectedDocIds.includes(doc.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Multi-Document Chat
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!showSelector && selectedDocIds.length > 0 && (
              <button
                onClick={handleChangeDocuments}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Change Documents ({selectedDocIds.length} selected)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSelector ? (
          /* Document Selector */
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Select Documents to Chat With
              </h2>
              <p className="text-gray-600 mb-6">
                Choose one or more documents. The AI will analyze all selected documents to answer your questions.
              </p>

              {readyDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No documents available
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Upload and process documents before starting a chat
                  </p>
                  <Button onClick={() => router.push("/dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto">
                    {readyDocuments.map((doc) => (
                      <DocumentCheckbox
                        key={doc.id}
                        document={doc}
                        selected={selectedDocIds.includes(doc.id)}
                        onToggle={handleDocumentToggle}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      {selectedDocIds.length} document{selectedDocIds.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedDocIds([])}
                        disabled={selectedDocIds.length === 0}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleStartChat}
                        disabled={selectedDocIds.length === 0}
                      >
                        Start Chat →
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        ) : (
          /* Chat Interface */
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Selected Documents Info */}
            <Card className="mb-4">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Chatting with {selectedDocIds.length} document{selectedDocIds.length !== 1 ? "s" : ""}:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedDocuments().map((doc) => (
                        <span
                          key={doc.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          📄 {doc.original_filename}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Messages */}
            <Card className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Start your conversation
                    </h3>
                    <p className="text-gray-600">
                      Ask questions about your selected documents
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg, index) => (
                      <ChatMessageBubble key={index} message={msg} />
                    ))}
                  </AnimatePresence>
                )}

                {isLoading && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                    <span>AI is thinking...</span>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask anything about your documents..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!inputMessage.trim() || isLoading}
                  >
                    Send
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCheckbox({
  document,
  selected,
  onToggle,
}: {
  document: Document;
  selected: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <label
      className={`
        flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
        ${selected ? "bg-blue-50 border-blue-500" : "bg-white border-gray-200 hover:bg-gray-50"}
      `}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(document.id)}
        className="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm">
          {document.original_filename}
        </p>
        <p className="text-xs text-gray-500">
          {document.file_type} • {(document.file_size / 1024).toFixed(1)} KB
        </p>
      </div>
      {selected && (
        <span className="ml-2 text-blue-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </label>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-3xl px-4 py-3 rounded-lg ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="text-xs opacity-75 mb-1">Sources:</p>
            {message.citations.map((citation, idx) => (
              <p key={idx} className="text-xs opacity-75">
                • {citation.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
