/**
 * Document view page - Chat and summaries
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useAuthStore } from "@/store/useAuthStore";
import { useDocumentsStore } from "@/store/useDocumentsStore";
import { chat as chatApi, summaries as summariesApi, documents as docsApi } from "@/lib/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import type { ChatMessage, SummaryResponse } from "@/types";

export default function DocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = parseInt(params.id as string);

  const { user, checkAuth } = useAuthStore();
  const { selectedDocument, selectDocument } = useDocumentsStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "summary">("chat");

  useEffect(() => {
    checkAuth();
    if (!user) {
      router.push("/login");
      return;
    }

    // Fetch document if not selected
    if (!selectedDocument || selectedDocument.id !== documentId) {
      docsApi.get(documentId).then(selectDocument).catch(console.error);
    }

    // Load conversation history
    chatApi.getHistory(documentId).then((conversations) => {
      if (conversations.length > 0) {
        const latest = conversations[0];
        setConversationId(latest.id);
        setMessages(latest.messages);
      }
    });
  }, [user, documentId, router]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedDocument) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage({
        document_id: documentId,
        message: inputMessage,
        conversation_id: conversationId || undefined,
      });

      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedDocument) return;

    setIsLoading(true);
    try {
      const result = await summariesApi.generate({
        document_id: documentId,
        summary_type: "medium",
      });
      setSummary(result);
    } catch (error) {
      // Try to get existing summary
      try {
        const result = await summariesApi.get(documentId);
        setSummary(result);
      } catch (e) {
        console.error("Failed to generate summary:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  if (!selectedDocument) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              ← Back
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-white">
                {selectedDocument.original_filename}
              </h1>
              <p className="text-sm text-gray-400">
                {(selectedDocument.file_size / 1024).toFixed(1)} KB • {selectedDocument.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "chat"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => {
              setActiveTab("summary");
              if (!summary) handleGenerateSummary();
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "summary"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            📊 Summary
          </button>
        </div>

        {/* Content */}
        {activeTab === "chat" ? (
          <div className="grid grid-cols-1 gap-6">
            {/* Chat Messages */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md h-[600px] flex flex-col">
              {/* New Chat Button */}
              <div className="border-b border-gray-700 px-4 py-2 flex justify-end">
                <Button
                  onClick={handleNewChat}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:bg-gray-700"
                >
                  ➕ New Chat
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-gray-400">
                      Ask questions about your document
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <ChatBubble key={idx} message={msg} />
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-700 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    variant="primary"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md p-6">
            {summary ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Summary</h2>
                  <div className="prose max-w-none text-gray-300 whitespace-pre-wrap">
                    {summary.summary}
                  </div>
                </div>

                {summary.topics.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Key Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {summary.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-800 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleGenerateSummary} variant="secondary">
                  Regenerate Summary
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500 mb-4"></div>
                    <p className="text-gray-400">Generating summary...</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No summary yet
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Generate a summary to see key insights
                    </p>
                    <Button onClick={handleGenerateSummary} variant="primary">
                      Generate Summary
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-4 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                li: ({node, ...props}) => <li className="ml-2" {...props} />,
                p: ({node, ...props}) => <p className="my-2" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-3 mb-2" {...props} />,
                code: ({node, inline, ...props}: any) => 
                  inline ? 
                    <code className="bg-gray-600 px-1 py-0.5 rounded text-sm font-mono" {...props} /> :
                    <code className="block bg-gray-900 text-white p-3 rounded my-2 overflow-x-auto font-mono text-sm" {...props} />,
                pre: ({node, ...props}) => <pre className="my-2" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-500 pl-4 italic my-2" {...props} />,
                table: ({node, ...props}) => <table className="border-collapse border border-gray-600 my-2" {...props} />,
                th: ({node, ...props}) => <th className="border border-gray-600 px-2 py-1 bg-gray-600 font-semibold" {...props} />,
                td: ({node, ...props}) => <td className="border border-gray-600 px-2 py-1" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <p className="text-xs opacity-75">Citations:</p>
            {message.citations.map((citation, idx) => (
              <p key={idx} className="text-xs opacity-75 mt-1">
                {citation.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
