/**
 * Multi-Document Chat Page
 * Professional chat interface with VSCode-like file explorer
 */
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useAuthStore } from "@/store/useAuthStore";
import { useDocumentsStore } from "@/store/useDocumentsStore";
import { chat, documents as documentsApi, folders as foldersApi } from "@/lib/api";
import { Button } from "@/components/Button";
import { FolderTree } from "@/components/FolderTree";
import type { Document, ChatMessage, Folder } from "@/types";

export default function MultiChatPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const { documents, fetchDocuments } = useDocumentsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [fileViewerWidth, setFileViewerWidth] = useState(0);
  const [selectedFileContent, setSelectedFileContent] = useState<Document | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState<"sidebar" | "fileviewer" | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (isInitialized && !user) {
        router.push("/login");
      } else if (user) {
        await fetchDocuments();
        await loadFolders();
      }
    };
    initialize();
  }, [user, isInitialized, router, fetchDocuments]);

  const loadFolders = async () => {
    try {
      const response = await foldersApi.list();
      setFolders(response.folders);
    } catch (error) {
      console.error("Failed to load folders:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const readyDocuments = documents.filter((doc) => doc.status === "ready");

  const handleDocumentToggle = (docId: number) => {
    setSelectedDocIds((prev) => {
      const newSelection = prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId];
      
      // If removing and in conversation, warn user
      if (prev.includes(docId) && conversationId && messages.length > 0) {
        if (!confirm("Removing this document will affect the context. Continue?")) {
          return prev;
        }
      }
      
      return newSelection;
    });
  };

  const handleFileClick = async (doc: Document) => {
    setSelectedFileContent(doc);
    setFileViewerWidth(500);
    
    // Fetch file content
    try {
      const docContent = await documentsApi.getContent(doc.id);
      setFileContent(docContent.content);
    } catch (error) {
      console.error("Failed to load file content:", error);
      setFileContent("Failed to load content");
    }
  };

  const closeFileViewer = () => {
    setFileViewerWidth(0);
    setSelectedFileContent(null);
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await documentsApi.delete(docId);
      // Remove from selected docs if it was selected
      if (selectedDocIds.includes(docId)) {
        setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
      }
      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInputMessage("");
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

  const handleMouseDown = (target: "sidebar" | "fileviewer") => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeTarget(target);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeTarget) return;

      if (resizeTarget === "sidebar") {
        const newWidth = Math.max(200, Math.min(500, e.clientX));
        setSidebarWidth(newWidth);
      } else if (resizeTarget === "fileviewer") {
        const newWidth = Math.max(300, Math.min(800, window.innerWidth - e.clientX));
        setFileViewerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeTarget(null);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeTarget]);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            {isMobile ? (
              <>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0 md:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            ) : null}
            <h1 className="text-sm sm:text-lg font-semibold text-white truncate">
              Multi-Document Chat
            </h1>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
            {selectedDocIds.length} file{selectedDocIds.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - File Explorer */}
        <div
          className={`${isMobile ? "fixed" : "relative"} md:relative flex bg-gray-800 border-r border-gray-700 flex flex-col transition-transform duration-200 ${
            isMobile ? (sidebarOpen ? "translate-x-0 z-50" : "-translate-x-full") : "z-auto"
          } h-full`}
          style={{ width: isMobile ? "100%" : `${sidebarWidth}px`, maxWidth: isMobile ? "280px" : undefined }}
        >
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Documents
              </h2>
              <div className="text-xs text-gray-500">
                {readyDocuments.length} available
              </div>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {readyDocuments.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-3xl mb-2">📂</div>
                <p className="text-xs text-gray-400">No documents</p>
              </div>
            ) : (
              <FolderTree
                folders={folders}
                documents={readyDocuments}
                onDocumentClick={handleFileClick}
                selectedDocumentIds={selectedDocIds}
                onDocumentToggle={handleDocumentToggle}
                onDocumentDelete={handleDeleteDocument}
                showCheckboxes={true}
              />
            )}
          </div>

          <div className="p-3 border-t border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDocIds([])}
              disabled={selectedDocIds.length === 0}
              className="w-full text-xs"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Resize Handle - Sidebar (Desktop only) */}
        {!isMobile && (
          <div
            className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors hidden md:block"
            onMouseDown={handleMouseDown("sidebar")}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {selectedDocIds.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">👈</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  {isMobile ? "Select documents" : "Select documents to start"}
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  {isMobile ? "Tap the menu to choose files" : "Choose one or more files from the sidebar"}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Files Bar */}
              <div className="bg-gray-800 border-b border-gray-700 p-2 sm:p-3 overflow-x-auto">
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {documents
                    .filter((doc) => selectedDocIds.includes(doc.id))
                    .map((doc) => (
                      <span
                        key={doc.id}
                        className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm flex-shrink-0"
                      >
                        <span className="hidden sm:inline">📄</span>
                        <span className="max-w-[100px] sm:max-w-xs truncate text-xs">{doc.original_filename}</span>
                        <button
                          onClick={() => handleDocumentToggle(doc.id)}
                          className="hover:bg-blue-700 rounded p-0.5 flex-shrink-0"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                </div>

                {messages.length > 0 && (
                  <div className="mt-2 sm:mt-0 sm:float-right">
                    <Button
                      onClick={handleNewChat}
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:bg-gray-700 text-xs"
                    >
                      <span className="hidden sm:inline">➕ New Chat</span>
                      <span className="sm:hidden">New</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">💬</div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                        Ready to chat
                      </h3>
                      <p className="text-sm sm:text-base text-gray-400">
                        Ask questions about your selected documents
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <ChatMessageBubble key={index} message={msg} isMobile={isMobile} />
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-400 text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-500"></div>
                        <span>AI is analyzing...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-700 p-2 sm:p-4 bg-gray-800">
                <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isMobile ? "Ask..." : "Ask anything about your documents..."}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-3 sm:px-6 flex-shrink-0"
                    size="sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* File Viewer Panel - Desktop Sidebar */}
        {!isMobile && fileViewerWidth > 0 && (
          <>
            {/* Resize Handle - File Viewer */}
            <div
              className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors"
              onMouseDown={handleMouseDown("fileviewer")}
            />

            <div
              className="bg-gray-800 border-l border-gray-700 flex flex-col"
              style={{ width: `${fileViewerWidth}px` }}
            >
              <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xl flex-shrink-0">📄</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {selectedFileContent?.original_filename}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {selectedFileContent?.file_type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeFileViewer}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="prose prose-invert max-w-none">
                  {selectedFileContent?.file_type === '.md' || selectedFileContent?.original_filename.endsWith('.md') ? (
                    <div className="markdown-content text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h1: (props) => <h1 className="text-2xl font-bold text-white mt-4 mb-2" {...props} />,
                          h2: (props) => <h2 className="text-xl font-bold text-white mt-3 mb-2" {...props} />,
                          h3: (props) => <h3 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
                          p: (props) => <p className="text-gray-300 my-2 leading-relaxed" {...props} />,
                          code: (props) => {
                            const { inline, ...rest } = props as React.HTMLAttributes<HTMLElement> & { inline?: boolean };
                            return inline ?
                              <code className="bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono" {...rest} /> :
                              <code className="block bg-gray-900 text-white p-3 rounded my-2 overflow-x-auto font-mono text-sm" {...rest} />;
                          },
                          pre: (props) => <pre className="my-2" {...props} />,
                          ul: (props) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                          ol: (props) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                          li: (props) => <li className="ml-2" {...props} />,
                          a: (props) => <a className="text-blue-400 hover:underline" {...props} />,
                        }}
                      >
                        {fileContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                      {fileContent}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* File Viewer Modal - Mobile */}
        {isMobile && fileViewerWidth > 0 && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={closeFileViewer}
            />
            <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex flex-col max-h-full">
              <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg flex-shrink-0">📄</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-semibold text-white truncate">
                      {selectedFileContent?.original_filename}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {selectedFileContent?.file_type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeFileViewer}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="prose prose-invert max-w-none text-xs">
                  {selectedFileContent?.file_type === '.md' || selectedFileContent?.original_filename.endsWith('.md') ? (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h1: (props) => <h1 className="text-lg font-bold text-white mt-3 mb-1" {...props} />,
                          h2: (props) => <h2 className="text-base font-bold text-white mt-2 mb-1" {...props} />,
                          h3: (props) => <h3 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
                          p: (props) => <p className="text-gray-300 my-1 leading-relaxed text-xs" {...props} />,
                          code: (props) => {
                            const { inline, ...rest } = props as React.HTMLAttributes<HTMLElement> & { inline?: boolean };
                            return inline ?
                              <code className="bg-gray-700 px-1 py-0.5 rounded text-xs font-mono" {...rest} /> :
                              <code className="block bg-gray-900 text-white p-2 rounded my-1 overflow-x-auto font-mono text-xs" {...rest} />;
                          },
                          pre: (props) => <pre className="my-1" {...props} />,
                          ul: (props) => <ul className="list-disc list-inside space-y-0.5 my-1" {...props} />,
                          ol: (props) => <ol className="list-decimal list-inside space-y-0.5 my-1" {...props} />,
                          li: (props) => <li className="ml-2 text-xs" {...props} />,
                          a: (props) => <a className="text-blue-400 hover:underline" {...props} />,
                        }}
                      >
                        {fileContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                      {fileContent}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChatMessageBubble({ message, isMobile }: { message: ChatMessage; isMobile?: boolean }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-2xl sm:max-w-3xl px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-100 border border-gray-700"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="markdown-content text-sm">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                ul: (props) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                ol: (props) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                li: (props) => <li className="ml-2" {...props} />,
                p: (props) => <p className="my-2" {...props} />,
                h1: (props) => <h1 className="text-xl font-bold mt-3 mb-2" {...props} />,
                h2: (props) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                h3: (props) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                code: (props) => {
                  const { inline, ...rest } = props as React.HTMLAttributes<HTMLElement> & { inline?: boolean };
                  return inline ? 
                    <code className="bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono" {...rest} /> :
                    <code className="block bg-gray-900 text-white p-3 rounded my-2 overflow-x-auto font-mono text-sm" {...rest} />;
                },
                pre: (props) => <pre className="my-2" {...props} />,
                a: (props) => <a className="text-blue-400 hover:underline" {...props} />,
                blockquote: (props) => <blockquote className="border-l-4 border-gray-600 pl-3 italic my-2" {...props} />,
                table: (props) => <table className="border-collapse border border-gray-600 my-2" {...props} />,
                th: (props) => <th className="border border-gray-600 px-2 py-1 bg-gray-700 font-semibold" {...props} />,
                td: (props) => <td className="border border-gray-600 px-2 py-1" {...props} />,
                strong: (props) => <strong className="font-bold" {...props} />,
                em: (props) => <em className="italic" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs opacity-75 mb-2 font-semibold">Sources:</p>
            {message.citations.map((citation, idx) => (
              <p key={idx} className="text-xs opacity-75 mb-1">
                • {citation.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
