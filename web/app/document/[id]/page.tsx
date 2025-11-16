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
import MermaidDiagram from "@/components/MermaidDiagram";
import { MediaPlayer } from "@/components/MediaPlayer";
import type { ChatMessage, SummaryResponse } from "@/types";

export default function DocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = parseInt(params.id as string);

  const { user, isInitialized } = useAuthStore();
  const { selectedDocument, selectDocument } = useDocumentsStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "summary" | "content" | "schema">("chat");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [mermaidSchema, setMermaidSchema] = useState<string | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [diagramType, setDiagramType] = useState<string>("auto");
  const [detailLevel, setDetailLevel] = useState<string>("compact");
  const [showSchemaSettings, setShowSchemaSettings] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    
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
  }, [user, isInitialized, documentId, router, selectedDocument, selectDocument]);

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

  const handleLoadContent = async () => {
    if (!selectedDocument || fileContent) return;

    setIsLoadingContent(true);
    try {
      const result = await docsApi.getContent(documentId);
      setFileContent(result.content);
    } catch (error) {
      console.error("Failed to load file content:", error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleLoadSchema = async (regenerate: boolean = false) => {
    if (!selectedDocument) return;
    if (mermaidSchema && !regenerate) return;

    setIsLoadingSchema(true);
    try {
      const result = await docsApi.getMermaidSchema(documentId, regenerate, diagramType, detailLevel);
      setMermaidSchema(result.mermaid_schema);
    } catch (error) {
      console.error("Failed to load Mermaid schema:", error);
    } finally {
      setIsLoadingSchema(false);
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
            <Button 
              variant="secondary" 
              onClick={async () => {
                try {
                  await docsApi.download(documentId);
                } catch (error) {
                  console.error("Download failed:", error);
                  alert("Failed to download document");
                }
              }}
            >
              ⬇️ Download
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 sm:gap-4 mb-3 sm:mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 min-w-[80px] px-3 sm:px-6 py-3 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === "chat"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            💬 <span className="hidden sm:inline">Chat</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("summary");
              if (!summary) handleGenerateSummary();
            }}
            className={`flex-1 min-w-[80px] px-3 sm:px-6 py-3 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === "summary"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            📊 <span className="hidden sm:inline">Summary</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("schema");
              if (!mermaidSchema) handleLoadSchema();
            }}
            className={`flex-1 min-w-[80px] px-3 sm:px-6 py-3 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === "schema"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            📈 <span className="hidden sm:inline">Schema</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("content");
              if (!fileContent) handleLoadContent();
            }}
            className={`flex-1 min-w-[80px] px-3 sm:px-6 py-3 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === "content"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            📄 <span className="hidden sm:inline">Content</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === "chat" ? (
          <div className="grid grid-cols-1 gap-6">
            {/* Chat Messages */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
              {/* New Chat Button */}
              <div className="border-b border-gray-700 px-2 sm:px-4 py-2 flex justify-end">
                <Button
                  onClick={handleNewChat}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:bg-gray-700 text-sm sm:text-base px-3 sm:px-4 py-2"
                >
                  ➕ <span className="hidden sm:inline">New Chat</span>
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💬</div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400">
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
                    <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
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
              <div className="border-t border-gray-700 p-2 sm:p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 px-3 sm:px-4 py-3 sm:py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    variant="primary"
                    className="px-4 sm:px-6 py-3 text-base sm:text-base min-w-[80px]"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "summary" ? (
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
        ) : activeTab === "schema" ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
            {mermaidSchema ? (
              <div className="h-full flex flex-col">
                {/* Header with controls */}
                <div className="flex items-center justify-between gap-2 bg-gray-800 border-b border-gray-700 px-3 sm:px-4 py-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">Document Schema</h2>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => setShowSchemaSettings(true)} 
                      variant="ghost"
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                    >
                      ⚙️ Settings
                    </Button>
                    <Button 
                      onClick={() => handleLoadSchema(true)} 
                      variant="secondary"
                      disabled={isLoadingSchema}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                    >
                      {isLoadingSchema ? "..." : "🔄 Regen"}
                    </Button>
                  </div>
                </div>
                
                {/* Full-width Schema */}
                <div className="flex-1 overflow-hidden">
                  <MermaidDiagram chart={mermaidSchema} />
                </div>

                {/* Settings Modal */}
                {showSchemaSettings && (
                  <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSchemaSettings(false)}
                  >
                    <div 
                      className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl max-w-md w-full p-4 sm:p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg sm:text-xl font-bold text-white">Schema Settings</h3>
                        <button
                          onClick={() => setShowSchemaSettings(false)}
                          className="text-gray-400 hover:text-white text-2xl leading-none"
                        >
                          ×
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Diagram Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Diagram Type
                          </label>
                          <select
                            value={diagramType}
                            onChange={(e) => setDiagramType(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="auto">Auto (Automatic detection)</option>
                            <option value="flowchart">Flowchart (Process flow)</option>
                            <option value="mindmap">Mindmap (Hierarchical)</option>
                            <option value="graph">Graph (Connections)</option>
                            <option value="sequence">Sequence (Timeline)</option>
                          </select>
                        </div>

                        {/* Detail Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Detail Level
                          </label>
                          <select
                            value={detailLevel}
                            onChange={(e) => setDetailLevel(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="compact">Compact (5-8 nodes)</option>
                            <option value="balanced">Balanced (10-15 nodes)</option>
                            <option value="detailed">Detailed (15-25 nodes)</option>
                          </select>
                        </div>

                        {/* Mermaid Code Preview */}
                        <details className="bg-gray-900 rounded-lg p-3">
                          <summary className="text-xs sm:text-sm text-gray-400 cursor-pointer hover:text-gray-300 font-medium">
                            View Mermaid Code
                          </summary>
                          <pre className="mt-2 p-2 text-gray-300 rounded text-xs overflow-x-auto max-h-40">
                            {mermaidSchema}
                          </pre>
                        </details>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => {
                              setShowSchemaSettings(false);
                            }}
                            variant="ghost"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              setMermaidSchema(null);
                              handleLoadSchema(true);
                              setShowSchemaSettings(false);
                            }}
                            variant="primary"
                            className="flex-1"
                          >
                            Apply & Regenerate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                {isLoadingSchema ? (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-gray-700 border-t-blue-500 mb-3 sm:mb-4"></div>
                    <p className="text-sm sm:text-base text-gray-400">Generating schema diagram...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📈</div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      No schema yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                      Generate a visual diagram of the document structure
                    </p>
                    <Button onClick={() => handleLoadSchema()} variant="primary" className="px-6 py-3">
                      Generate Schema
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md p-6">
            {fileContent || selectedDocument.transcript_content ? (
              <>
                {/* Media Player for Audio/Video files */}
                {['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.mp4', '.avi', '.mov', '.webm', '.mkv'].includes(selectedDocument.file_type) && (
                  <div className="mb-6">
                    <MediaPlayer
                      fileUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/documents/${selectedDocument.id}/download`}
                      fileName={selectedDocument.original_filename}
                      fileType={selectedDocument.file_type}
                      duration={selectedDocument.media_duration}
                    />
                  </div>
                )}

                {/* Display transcript or content */}
                {selectedDocument.transcript_content && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                      📝 Transcription
                    </h3>
                    <div className="prose prose-invert max-w-none">
                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-4xl font-bold text-white mt-6 mb-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-3xl font-bold text-white mt-5 mb-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-white mt-4 mb-2" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-xl font-bold text-white mt-3 mb-2" {...props} />,
                            h5: ({node, ...props}) => <h5 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
                            h6: ({node, ...props}) => <h6 className="text-base font-bold text-white mt-2 mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="text-gray-300 my-3 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 my-4 text-gray-300" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 my-4 text-gray-300" {...props} />,
                            li: ({node, ...props}) => <li className="ml-4" {...props} />,
                            code: ({node, inline, ...props}: any) =>
                              inline ?
                                <code className="bg-gray-900 text-blue-400 px-2 py-1 rounded text-sm font-mono" {...props} /> :
                                <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm leading-relaxed" {...props} />,
                            pre: ({node, ...props}) => <pre className="my-4 rounded-lg overflow-hidden" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-400" {...props} />,
                            table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-600" {...props} /></div>,
                            thead: ({node, ...props}) => <thead className="bg-gray-700" {...props} />,
                            th: ({node, ...props}) => <th className="border border-gray-600 px-4 py-2 text-left font-semibold text-white" {...props} />,
                            td: ({node, ...props}) => <td className="border border-gray-600 px-4 py-2 text-gray-300" {...props} />,
                            hr: ({node, ...props}) => <hr className="border-gray-600 my-6" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                            img: ({node, ...props}) => <img className="max-w-full h-auto rounded-lg my-4" {...props} />,
                          }}
                        >
                          {selectedDocument.transcript_content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular file content */}
                {fileContent && !selectedDocument.transcript_content && (
                  <div className="prose prose-invert max-w-none">
                    {selectedDocument.file_type === "text/markdown" ||
                     selectedDocument.original_filename.endsWith('.md') ? (
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-4xl font-bold text-white mt-6 mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-3xl font-bold text-white mt-5 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-white mt-4 mb-2" {...props} />,
                        h4: ({node, ...props}) => <h4 className="text-xl font-bold text-white mt-3 mb-2" {...props} />,
                        h5: ({node, ...props}) => <h5 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
                        h6: ({node, ...props}) => <h6 className="text-base font-bold text-white mt-2 mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="text-gray-300 my-3 leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 my-4 text-gray-300" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 my-4 text-gray-300" {...props} />,
                        li: ({node, ...props}) => <li className="ml-4" {...props} />,
                        code: ({node, inline, ...props}: any) => 
                          inline ? 
                            <code className="bg-gray-900 text-blue-400 px-2 py-1 rounded text-sm font-mono" {...props} /> :
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm leading-relaxed" {...props} />,
                        pre: ({node, ...props}) => <pre className="my-4 rounded-lg overflow-hidden" {...props} />,
                        a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-400" {...props} />,
                        table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-600" {...props} /></div>,
                        thead: ({node, ...props}) => <thead className="bg-gray-700" {...props} />,
                        th: ({node, ...props}) => <th className="border border-gray-600 px-4 py-2 text-left font-semibold text-white" {...props} />,
                        td: ({node, ...props}) => <td className="border border-gray-600 px-4 py-2 text-gray-300" {...props} />,
                        hr: ({node, ...props}) => <hr className="border-gray-600 my-6" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                        img: ({node, ...props}) => <img className="max-w-full h-auto rounded-lg my-4" {...props} />,
                      }}
                    >
                      {fileContent}
                    </ReactMarkdown>
                  </div>
                    ) : (
                      <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {fileContent}
                      </pre>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                {isLoadingContent ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500 mb-4"></div>
                    <p className="text-gray-400">Loading file content...</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      File Content
                    </h3>
                    <p className="text-gray-400 mb-6">
                      View the original content of your document
                    </p>
                    <Button onClick={handleLoadContent} variant="primary">
                      Load Content
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
        className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-3 sm:p-4 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
        ) : (
          <div className="markdown-content text-sm sm:text-base">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                li: ({node, ...props}) => <li className="ml-2" {...props} />,
                p: ({node, ...props}) => <p className="my-2" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-xl sm:text-2xl font-bold mt-4 mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg sm:text-xl font-bold mt-3 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base sm:text-lg font-bold mt-3 mb-2" {...props} />,
                code: ({node, inline, ...props}: any) => 
                  inline ? 
                    <code className="bg-gray-600 px-1 py-0.5 rounded text-xs sm:text-sm font-mono" {...props} /> :
                    <code className="block bg-gray-900 text-white p-2 sm:p-3 rounded my-2 overflow-x-auto font-mono text-xs sm:text-sm" {...props} />,
                pre: ({node, ...props}) => <pre className="my-2" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-500 pl-4 italic my-2" {...props} />,
                table: ({node, ...props}) => <table className="border-collapse border border-gray-600 my-2 text-xs sm:text-sm" {...props} />,
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
