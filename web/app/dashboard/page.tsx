/**
 * Dashboard page - Welcome & Overview
 * Enhanced UX/UI with FAB, sidebar navigation, and improved layout
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useDocumentsStore } from "@/store/useDocumentsStore";
import { Button } from "@/components/Button";
import { useSettingsStore, isEventMatchingShortcut, prettyShortcut } from "@/store/useSettingsStore";
import type { Document } from "@/types";

interface AnalyticsOverview {
  documents: {
    total: number;
    ready: number;
    processing: number;
    total_storage_bytes: number;
    total_storage_mb: number;
    recent_uploads: number;
  };
  conversations: {
    total: number;
    recent: number;
  };
  messages: {
    total: number;
    user_messages: number;
    ai_messages: number;
    recent: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, checkAuth } = useAuthStore();
  const { documents, fetchDocuments, selectDocument, isLoading } = useDocumentsStore();
  const { shortcuts, showShortcutsHelpInDashboard } = useSettingsStore();
  const [showFABMenu, setShowFABMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    checkAuth();
    if (!user) {
      router.push("/login");
    } else {
      fetchDocuments();
      fetchAnalyticsData();
    }
  }, [user, router, checkAuth, fetchDocuments]);

  const fetchAnalyticsData = async () => {
    try {
      const { analytics } = await import("@/lib/api");
      const data = await analytics.getOverview();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isEventMatchingShortcut(e, shortcuts.openChat)) {
        e.preventDefault();
        router.push('/multi-chat');
        return;
      }
      if (isEventMatchingShortcut(e, shortcuts.upload)) {
        e.preventDefault();
        router.push('/documents');
        return;
      }
      if (isEventMatchingShortcut(e, shortcuts.toggleSidebar)) {
        e.preventDefault();
        setSidebarCollapsed((v) => !v);
        return;
      }
      if (isEventMatchingShortcut(e, shortcuts.openDocuments)) {
        e.preventDefault();
        router.push('/documents');
        return;
      }
      if (isEventMatchingShortcut(e, shortcuts.openQuiz)) {
        e.preventDefault();
        router.push('/quiz');
        return;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [router, shortcuts]);

  const handleDocumentClick = (doc: Document) => {
    selectDocument(doc);
    router.push(`/document/${doc.id}`);
  };

  const recentDocuments = documents
    .filter((doc) => doc.status === "ready")
    .slice(0, 6);

  // Use real analytics data if available, fallback to local calculation
  const stats = analyticsData ? {
    total: analyticsData.documents.total,
    ready: analyticsData.documents.ready,
    processing: analyticsData.documents.processing,
    totalSize: analyticsData.documents.total_storage_bytes,
    recentUploads: analyticsData.documents.recent_uploads,
    totalConversations: analyticsData.conversations.total,
    recentChats: analyticsData.messages.recent,
  } : {
    total: documents.length,
    ready: documents.filter((d) => d.status === "ready").length,
    processing: documents.filter((d) => d.status === "processing").length,
    totalSize: documents.reduce((acc, doc) => acc + doc.file_size, 0),
    recentUploads: 0,
    totalConversations: 0,
    recentChats: 0,
  };

  const quickActions = [
    { icon: '💬', label: 'Multi Chat', action: () => router.push('/multi-chat'), shortcut: prettyShortcut(shortcuts.openChat) },
    { icon: '📁', label: 'Documents', action: () => router.push('/documents'), shortcut: prettyShortcut(shortcuts.openDocuments) },
    { icon: '📝', label: 'Quiz', action: () => router.push('/quiz'), shortcut: prettyShortcut(shortcuts.openQuiz) },
    { icon: '➕', label: 'Upload', action: () => router.push('/documents'), shortcut: prettyShortcut(shortcuts.upload) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Floating Action Button - Bottom Left */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <AnimatePresence>
          {showFABMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-0 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-2 space-y-2 min-w-[200px]"
            >
              <FABMenuItem
                icon="💬"
                label="Start Chat"
                onClick={() => {
                  router.push('/multi-chat');
                  setShowFABMenu(false);
                }}
              />
              <FABMenuItem
                icon="📁"
                label="Browse Docs"
                onClick={() => {
                  router.push('/documents');
                  setShowFABMenu(false);
                }}
              />
              <FABMenuItem
                icon="➕"
                label="Upload"
                onClick={() => {
                  router.push('/documents');
                  setShowFABMenu(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFABMenu(!showFABMenu)}
          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-2xl hover:shadow-blue-500/50 transition-all duration-300"
        >
          <motion.span
            animate={{ rotate: showFABMenu ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {showFABMenu ? '✕' : '✨'}
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 shadow-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              <span className="text-2xl">☰</span>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              NoteMind AI
            </h1>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Beta</span>
          </div>
          <div className="flex items-center gap-4">
            
            <span className="text-gray-300 hidden sm:inline">
              {user?.full_name || user?.email?.split('@')[0]}
            </span>
              <Button
                variant="ghost"
                onClick={() => router.push('/settings')}
                className="hover:bg-blue-500/10 hover:text-blue-400"
                aria-label="Impostazioni"
              >
                ⚙️
              </Button>
            <Button variant="ghost" onClick={logout} className="hover:bg-red-500/10 hover:text-red-400">
              Logout
            </Button>

            {/* Quick Chat Button - moved to far right */}
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/multi-chat')}
              className="hidden sm:flex bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 items-center gap-2 font-semibold text-sm"
            >
              <span className="text-lg">💬</span>
              <span>Quick Chat</span>
              {showShortcutsHelpInDashboard && (
                <span className="text-xs opacity-75">{prettyShortcut(shortcuts.openChat)}</span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                Welcome back! 
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  👋
                </motion.span>
              </h2>
              <p className="text-lg text-gray-400">
                Your AI-powered workspace • {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Quick Access Shortcuts */}
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.action}
                  className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 group backdrop-blur-sm"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                  <div className="text-left">
                    <div className="text-white font-medium text-sm">{action.label}</div>
                    {showShortcutsHelpInDashboard && (
                      <div className="text-xs text-gray-500">{action.shortcut}</div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards - Enhanced */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="📄"
            label="Total Documents"
            value={stats.total}
            color="blue"
            trend={stats.recentUploads > 0 ? `+${stats.recentUploads} this month` : undefined}
          />
          <StatCard
            icon="💬"
            label="Conversations"
            value={stats.totalConversations}
            color="purple"
            trend={stats.recentChats > 0 ? `${stats.recentChats} recent messages` : undefined}
          />
          <StatCard
            icon="✅"
            label="Ready"
            value={stats.ready}
            color="green"
            trend={stats.processing > 0 ? `${stats.processing} processing` : "All ready"}
          />
          <StatCard
            icon="💾"
            label="Storage"
            value={`${(stats.totalSize / 1024 / 1024).toFixed(1)} MB`}
            color="blue"
            trend={stats.total > 0 ? `${((stats.totalSize / stats.total) / 1024).toFixed(1)} KB avg` : undefined}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🚀</span> Quick Actions
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ActionCard
                icon="📁"
                title="Browse Documents"
                description="Manage all your documents"
                action="Browse"
                onClick={() => router.push("/documents")}
                gradient="from-blue-500 to-cyan-500"
              />
              <ActionCard
                icon="💬"
                title="Multi-Document Chat"
                description="Chat with multiple documents"
                action="Start Chat"
                onClick={() => router.push("/multi-chat")}
                gradient="from-purple-500 to-pink-500"
              />
              <ActionCard
                icon="📝"
                title="Student Quiz"
                description="Test your knowledge with AI quizzes"
                action="Start Quiz"
                onClick={() => router.push("/quiz")}
                gradient="from-emerald-500 to-teal-500"
              />
              <ActionCard
                icon="📊"
                title="Analytics"
                description="View insights and stats"
                action="View"
                onClick={() => router.push("/analytics")}
                gradient="from-orange-500 to-red-500"
              />
            </div>
          </div>

          {/* Right Column - Activity Feed */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>⚡</span> Recent Activity
            </h3>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 space-y-3">
              {analyticsData && analyticsData.documents.recent_uploads > 0 && (
                <ActivityItem
                  icon="📄"
                  title={`${analyticsData.documents.recent_uploads} documents uploaded`}
                  time="Last 30 days"
                  color="blue"
                />
              )}
              {analyticsData && analyticsData.messages.recent > 0 && (
                <ActivityItem
                  icon="💬"
                  title={`${analyticsData.messages.recent} messages sent`}
                  time="Last 30 days"
                  color="purple"
                />
              )}
              {analyticsData && analyticsData.documents.ready > 0 && (
                <ActivityItem
                  icon="✅"
                  title={`${analyticsData.documents.ready} documents ready`}
                  time="Available now"
                  color="green"
                />
              )}
              {analyticsData && analyticsData.conversations.total > 0 && (
                <ActivityItem
                  icon="📊"
                  title={`${analyticsData.conversations.total} total conversations`}
                  time="All time"
                  color="orange"
                />
              )}
              {(!analyticsData || (analyticsData.documents.total === 0 && analyticsData.conversations.total === 0)) && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs mt-2">Start by uploading a document!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Overview - Compact */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>💡</span> What You Can Do
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon="🤖"
              title="AI Analysis"
              description="Instant summaries and insights"
            />
            <FeatureCard
              icon="💡"
              title="Smart Chat"
              description="Context-aware answers"
            />
            <FeatureCard
              icon="📊"
              title="Organization"
              description="Folders and drag & drop"
            />
            <FeatureCard
              icon="🔍"
              title="Search"
              description="Find anything instantly"
            />
          </div>
        </div>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📚</span> Recent Documents
              </h3>
              <Button
                variant="ghost"
                onClick={() => router.push("/documents")}
                className="text-sm hover:text-blue-400"
              >
                View All →
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentDocuments.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <RecentDocCard
                    document={doc}
                    onClick={() => handleDocumentClick(doc)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
          >
            <div className="text-center py-16 px-4">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🚀
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-3">
                Ready to get started?
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Upload your first document and experience the power of AI-driven insights
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push("/documents")}
                  className="min-w-[200px]"
                >
                  Upload Document
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => router.push("/multi-chat")}
                  className="min-w-[200px]"
                >
                  Explore Features
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Keyboard Shortcuts Help */}
        {showShortcutsHelpInDashboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-4"
          >
            <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <span>⌨️</span> Scorciatoie
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <ShortcutItem shortcut={prettyShortcut(shortcuts.openChat)} description="Apri Chat" />
              <ShortcutItem shortcut={prettyShortcut(shortcuts.openQuiz)} description="Apri Quiz" />
              <ShortcutItem shortcut={prettyShortcut(shortcuts.upload)} description="Upload" />
              <ShortcutItem shortcut={prettyShortcut(shortcuts.openDocuments)} description="Documenti" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Enhanced StatCard Component
function StatCard({
  icon,
  label,
  value,
  color,
  trend,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
  trend?: string;
}) {
  const bgColors = {
    blue: "bg-blue-500/10",
    green: "bg-green-500/10",
    yellow: "bg-yellow-500/10",
    purple: "bg-purple-500/10",
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`text-3xl p-2 rounded-lg ${bgColors} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </motion.div>
  );
}

// Enhanced ActionCard Component
function ActionCard({
  icon,
  title,
  description,
  action,
  onClick,
  gradient,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 cursor-pointer shadow-lg hover:shadow-2xl hover:border-gray-600 transition-all duration-300 group"
    >
      <div className={`text-3xl mb-3 inline-flex p-3 rounded-lg bg-gradient-to-r ${gradient} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{title}</h4>
      <p className="text-gray-400 mb-4 text-sm leading-relaxed">{description}</p>
      <div className="text-sm font-semibold text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
        {action} <span>→</span>
      </div>
    </motion.div>
  );
}

// Compact FeatureCard Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/40 p-4 hover:border-gray-600 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div>
          <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
          <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced RecentDocCard Component
function RecentDocCard({
  document,
  onClick,
}: {
  document: Document;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 cursor-pointer shadow-lg hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 group"
    >
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📄</div>
      <h4 className="font-semibold text-white mb-2 truncate text-sm group-hover:text-blue-400 transition-colors">
        {document.original_filename}
      </h4>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {(document.file_size / 1024).toFixed(1)} KB
        </span>
        <span className="text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Ready</span>
      </div>
    </motion.div>
  );
}

// FAB Menu Item Component
function FABMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, x: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}

// Activity Item Component
function ActivityItem({
  icon,
  title,
  time,
  color,
}: {
  icon: string;
  title: string;
  time: string;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-500/10",
    purple: "bg-purple-500/10",
    green: "bg-green-500/10",
    orange: "bg-orange-500/10",
  };

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
      <div className={`text-xl p-2 rounded-lg ${bgColors[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

// Keyboard Shortcut Item Component
function ShortcutItem({
  shortcut,
  description,
}: {
  shortcut: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-xs font-mono text-gray-300">
        {shortcut}
      </kbd>
      <span className="text-gray-400">{description}</span>
    </div>
  );
}
