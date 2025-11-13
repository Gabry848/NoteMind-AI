/**
 * Dashboard page - Welcome & Overview
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useDocumentsStore } from "@/store/useDocumentsStore";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { Document } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, checkAuth } = useAuthStore();
  const { documents, fetchDocuments, selectDocument, isLoading } = useDocumentsStore();

  useEffect(() => {
    checkAuth();
    if (!user) {
      router.push("/login");
    } else {
      fetchDocuments();
    }
  }, [user, router]);

  const handleDocumentClick = (doc: Document) => {
    selectDocument(doc);
    router.push(`/document/${doc.id}`);
  };

  const recentDocuments = documents
    .filter((doc) => doc.status === "ready")
    .slice(0, 4);

  const stats = {
    total: documents.length,
    ready: documents.filter((d) => d.status === "ready").length,
    processing: documents.filter((d) => d.status === "processing").length,
    totalSize: documents.reduce((acc, doc) => acc + doc.file_size, 0),
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            NoteMind AI
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Hi, {user?.full_name || user?.email}</span>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome back! 👋
          </h2>
          <p className="text-xl text-gray-400">
            Your AI-powered document workspace is ready
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon="📄"
            label="Total Documents"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon="✅"
            label="Ready"
            value={stats.ready}
            color="green"
          />
          <StatCard
            icon="⏳"
            label="Processing"
            value={stats.processing}
            color="yellow"
          />
          <StatCard
            icon="💾"
            label="Total Size"
            value={`${(stats.totalSize / 1024 / 1024).toFixed(1)} MB`}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              icon="📁"
              title="Browse Documents"
              description="View and manage all your documents with tree or grid view"
              action="Browse"
              onClick={() => router.push("/documents")}
              gradient="from-blue-500 to-cyan-500"
            />
            <ActionCard
              icon="💬"
              title="Multi-Document Chat"
              description="Chat with multiple documents at once for deeper insights"
              action="Start Chat"
              onClick={() => router.push("/multi-chat")}
              gradient="from-purple-500 to-pink-500"
            />
            <ActionCard
              icon="➕"
              title="Upload Document"
              description="Add new documents to your workspace and start analyzing"
              action="Upload"
              onClick={() => router.push("/documents")}
              gradient="from-green-500 to-emerald-500"
            />
          </div>
        </div>

        {/* Features Overview */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">What You Can Do</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon="🤖"
              title="AI-Powered Analysis"
              description="Get instant summaries, extract key insights, and understand complex documents with advanced AI"
            />
            <FeatureCard
              icon="💡"
              title="Smart Chat"
              description="Ask questions about your documents and get accurate, context-aware answers"
            />
            <FeatureCard
              icon="📊"
              title="Organization Tools"
              description="Create folders, organize files, and keep your workspace tidy with drag & drop"
            />
            <FeatureCard
              icon="🔍"
              title="Powerful Search"
              description="Find any document instantly with smart search and filters"
            />
          </div>
        </div>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Recent Documents</h3>
              <Button
                variant="ghost"
                onClick={() => router.push("/documents")}
              >
                View All →
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentDocuments.map((doc) => (
                <RecentDocCard
                  key={doc.id}
                  document={doc}
                  onClick={() => handleDocumentClick(doc)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-lg border border-gray-700 shadow-md"
          >
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                Ready to get started?
              </h3>
              <p className="text-gray-400 mb-8">
                Upload your first document and experience the power of AI
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push("/documents")}
              >
                Upload Your First Document
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    purple: "from-purple-500 to-purple-600",
  }[color];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${colorClasses}`} />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </motion.div>
  );
}

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
      onClick={onClick}
      className="bg-gray-800 rounded-xl border border-gray-700 p-6 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
    >
      <div className={`text-4xl mb-4 inline-block p-3 rounded-lg bg-gradient-to-r ${gradient}`}>
        {icon}
      </div>
      <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
      <p className="text-gray-400 mb-4 text-sm">{description}</p>
      <Button variant="secondary" size="sm" className="w-full">
        {action} →
      </Button>
    </motion.div>
  );
}

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
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-start gap-4">
        <span className="text-3xl flex-shrink-0">{icon}</span>
        <div>
          <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}

function RecentDocCard({
  document,
  onClick,
}: {
  document: Document;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="bg-gray-800 rounded-lg border border-gray-700 p-4 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
    >
      <div className="text-3xl mb-3">📄</div>
      <h4 className="font-semibold text-white mb-1 truncate text-sm">
        {document.original_filename}
      </h4>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {(document.file_size / 1024).toFixed(1)} KB
        </span>
        <span className="text-green-400">Ready</span>
      </div>
    </motion.div>
  );
}
