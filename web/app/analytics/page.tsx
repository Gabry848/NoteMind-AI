/**
 * Analytics Page - Insights & Statistics
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { analytics } from "@/lib/api";
import { Button } from "@/components/Button";

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
  most_active_documents: Array<{
    id: number;
    filename: string;
    conversation_count: number;
  }>;
  file_types: Array<{
    type: string;
    count: number;
    total_size_mb: number;
  }>;
}

interface ActivityData {
  date: string;
  documents: number;
  messages: number;
  conversations: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [activityDays, setActivityDays] = useState(7);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    if (!user) {
      router.push("/login");
    } else {
      loadAnalytics();
    }
  }, [user, router, checkAuth]);

  useEffect(() => {
    if (user) {
      loadActivity();
    }
  }, [activityDays, user]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const [overviewData, activityData] = await Promise.all([
        analytics.getOverview(),
        analytics.getActivity(activityDays),
      ]);
      setOverview(overviewData);
      setActivity(activityData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const activityData = await analytics.getActivity(activityDays);
      setActivity(activityData);
    } catch (error) {
      console.error("Failed to load activity:", error);
    }
  };

  if (isLoading || !overview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          📊
        </motion.div>
      </div>
    );
  }

  const maxActivity = Math.max(
    ...activity.map((a) => Math.max(a.documents, a.messages, a.conversations))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 shadow-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="hover:bg-gray-700/50"
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Analytics & Insights
            </h1>
          </div>
          <span className="text-gray-300 hidden sm:inline">
            {user?.full_name || user?.email?.split("@")[0]}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Your Activity Dashboard
            <span className="text-3xl">📈</span>
          </h2>
          <p className="text-gray-400">
            Track your progress and insights over time
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon="📄"
            label="Total Documents"
            value={overview.documents.total}
            subValue={`${overview.documents.ready} ready`}
            color="blue"
          />
          <MetricCard
            icon="💬"
            label="Conversations"
            value={overview.conversations.total}
            subValue={`${overview.conversations.recent} this week`}
            color="purple"
          />
          <MetricCard
            icon="✉️"
            label="Messages Sent"
            value={overview.messages.user_messages}
            subValue={`${overview.messages.recent} recent`}
            color="green"
          />
          <MetricCard
            icon="💾"
            label="Storage Used"
            value={`${overview.documents.total_storage_mb}`}
            suffix="MB"
            subValue={`${overview.documents.total} files`}
            color="orange"
          />
        </div>

        {/* Activity Chart */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📊</span> Activity Timeline
            </h3>
            <div className="flex gap-2">
              <Button
                variant={activityDays === 7 ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActivityDays(7)}
              >
                7 Days
              </Button>
              <Button
                variant={activityDays === 14 ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActivityDays(14)}
              >
                14 Days
              </Button>
              <Button
                variant={activityDays === 30 ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActivityDays(30)}
              >
                30 Days
              </Button>
            </div>
          </div>

          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-end gap-2 h-64">
              {activity.map((day, i) => {
                const total = day.documents + day.messages + day.conversations;
                const height = maxActivity > 0 ? (total / maxActivity) * 100 : 0;
                const date = new Date(day.date);
                const dayLabel = date.toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "short",
                });

                return (
                  <motion.div
                    key={day.date}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "100%", opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-1 flex flex-col justify-end items-center gap-2"
                  >
                    <div className="w-full flex flex-col gap-1">
                      {day.documents > 0 && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.05 + 0.1 }}
                          className="bg-blue-500 rounded-t"
                          style={{
                            height: `${(day.documents / maxActivity) * 100}%`,
                            minHeight: day.documents > 0 ? "4px" : "0",
                          }}
                          title={`${day.documents} documents`}
                        />
                      )}
                      {day.messages > 0 && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.05 + 0.15 }}
                          className="bg-green-500"
                          style={{
                            height: `${(day.messages / maxActivity) * 100}%`,
                            minHeight: day.messages > 0 ? "4px" : "0",
                          }}
                          title={`${day.messages} messages`}
                        />
                      )}
                      {day.conversations > 0 && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.05 + 0.2 }}
                          className="bg-purple-500 rounded-b"
                          style={{
                            height: `${(day.conversations / maxActivity) * 100}%`,
                            minHeight: day.conversations > 0 ? "4px" : "0",
                          }}
                          title={`${day.conversations} conversations`}
                        />
                      )}
                      {total === 0 && (
                        <div className="bg-gray-700/30 rounded" style={{ height: "4px" }} />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 rotate-45 origin-top-left mt-4">
                      {dayLabel}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-gray-300">Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-300">Messages</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-gray-300">Conversations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Most Active Documents */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🔥</span> Most Active Documents
            </h3>
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              {overview.most_active_documents.length > 0 ? (
                <div className="space-y-4">
                  {overview.most_active_documents.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {doc.filename}
                          </p>
                          <p className="text-sm text-gray-400">
                            {doc.conversation_count} conversation
                            {doc.conversation_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-400">
                            {doc.conversation_count}
                          </div>
                          <div className="text-xs text-gray-500">chats</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No conversation data yet
                </div>
              )}
            </div>
          </div>

          {/* File Types Distribution */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📁</span> File Types
            </h3>
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              {overview.file_types.length > 0 ? (
                <div className="space-y-4">
                  {overview.file_types.map((ft, i) => {
                    const percentage =
                      (ft.count / overview.documents.total) * 100;
                    return (
                      <motion.div
                        key={ft.type}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium uppercase">
                            {ft.type}
                          </span>
                          <span className="text-gray-400">
                            {ft.count} files • {ft.total_size_mb.toFixed(1)} MB
                          </span>
                        </div>
                        <div className="w-full bg-gray-700/30 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {percentage.toFixed(1)}% of total
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No documents yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Statistics */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>💬</span> Chat Statistics
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <StatDetailCard
              icon="✉️"
              label="Your Messages"
              value={overview.messages.user_messages}
              color="green"
              description="Questions asked"
            />
            <StatDetailCard
              icon="🤖"
              label="AI Responses"
              value={overview.messages.ai_messages}
              color="purple"
              description="Answers generated"
            />
            <StatDetailCard
              icon="📊"
              label="Avg per Chat"
              value={(
                overview.messages.total / overview.conversations.total || 0
              ).toFixed(1)}
              color="blue"
              description="Messages per conversation"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to do more?
          </h3>
          <p className="text-gray-400 mb-6">
            Continue exploring your documents or start a new chat
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/documents")}
            >
              Browse Documents
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push("/multi-chat")}
            >
              Start Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  suffix,
  subValue,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  suffix?: string;
  subValue?: string;
  color: string;
}) {
  const bgColors = {
    blue: "bg-blue-500/10",
    green: "bg-green-500/10",
    purple: "bg-purple-500/10",
    orange: "bg-orange-500/10",
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className={`text-3xl p-2 rounded-lg ${bgColors} inline-block mb-3`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        {value}
        {suffix && <span className="text-xl text-gray-400 ml-1">{suffix}</span>}
      </div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
    </motion.div>
  );
}

function StatDetailCard({
  icon,
  label,
  value,
  color,
  description,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
  description: string;
}) {
  const bgColors = {
    blue: "bg-blue-500/10",
    green: "bg-green-500/10",
    purple: "bg-purple-500/10",
  }[color];

  const textColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 text-center"
    >
      <div className={`text-4xl p-3 rounded-lg ${bgColors} inline-block mb-4`}>
        {icon}
      </div>
      <div className={`text-4xl font-bold ${textColors} mb-2`}>{value}</div>
      <div className="text-white font-medium mb-1">{label}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </motion.div>
  );
}
