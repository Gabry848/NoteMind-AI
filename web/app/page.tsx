/**
 * Landing page
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-20"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            NoteMind AI
          </h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            Your AI-Powered
            <br />
            Research Companion
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto"
          >
            Upload documents, ask questions, and get intelligent insights powered by
            Google Gemini. Transform your documents into interactive conversations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center mb-20"
          >
            <Link href="/register">
              <Button variant="primary" size="lg">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Login
              </Button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-8 mt-20"
          >
            <FeatureCard
              icon="📄"
              title="Upload Documents"
              description="Support for PDF, DOCX, TXT, JSON, and more. Easy drag & drop interface."
            />
            <FeatureCard
              icon="💬"
              title="Chat with AI"
              description="Ask questions and get intelligent answers with citations from your documents."
            />
            <FeatureCard
              icon="📊"
              title="Auto Summaries"
              description="Generate comprehensive summaries and extract key topics automatically."
            />
          </motion.div>
        </div>
      </div>
    </div>
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
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}
