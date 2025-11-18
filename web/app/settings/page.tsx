/**
 * Settings page - scorciatoie, lingua assistente e altre opzioni
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ShortcutInput } from "@/components/ShortcutInput";
import { useSettingsStore, prettyShortcut } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { auth } from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const {
    assistantLanguage,
    shortcuts,
    showShortcutsHelpInDashboard,
    setAssistantLanguage,
    setShortcut,
    resetShortcuts,
    setShowShortcutsHelpInDashboard,
  } = useSettingsStore();

  const languages = useMemo(
    () => [
      { value: "it", label: "Italiano 🇮🇹" },
      { value: "en", label: "English 🇬🇧" },
      { value: "es", label: "Español 🇪🇸" },
      { value: "fr", label: "Français 🇫🇷" },
      { value: "de", label: "Deutsch 🇩🇪" },
      { value: "pt", label: "Português 🇵🇹" },
      { value: "ru", label: "Русский 🇷🇺" },
      { value: "zh", label: "中文 🇨🇳" },
      { value: "ja", label: "日本語 🇯🇵" },
      { value: "ko", label: "한국어 🇰🇷" },
    ],
    []
  );

  const handleLanguageChange = async (newLanguage: string) => {
    setAssistantLanguage(newLanguage as any);
    
    // Save to server if user is logged in
    if (user) {
      setIsSaving(true);
      setSaveMessage("");
      try {
        await auth.updateProfile({ preferred_language: newLanguage });
        setSaveMessage(t("settings.language.saved"));
        setTimeout(() => setSaveMessage(""), 2000);
      } catch (error) {
        console.error("Error saving language:", error);
        setSaveMessage(t("settings.language.error"));
        setTimeout(() => setSaveMessage(""), 3000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 shadow-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {t("settings.title")}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Lingua Assistente */}
        <Card className="bg-gray-800/60">
          <h2 className="text-xl font-semibold mb-2">{t("settings.language.title")}</h2>
          <p className="text-gray-400 text-sm mb-4">
            {t("settings.language.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <select
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              value={assistantLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isSaving}
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500">
              {saveMessage ? (
                <span className={saveMessage.includes("✓") ? "text-green-400" : "text-red-400"}>
                  {saveMessage}
                </span>
              ) : (
                <>{t("settings.language.current")}: <span className="font-mono">{assistantLanguage}</span></>
              )}
            </div>
          </div>
        </Card>

        {/* Scorciatoie da tastiera */}
        <Card className="bg-gray-800/60">
          <h2 className="text-xl font-semibold mb-2">{t("settings.shortcuts.title")}</h2>
          <p className="text-gray-400 text-sm mb-4">
            {t("settings.shortcuts.description")}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <ShortcutInput
              label={t("settings.shortcuts.openChat")}
              value={prettyShortcut(shortcuts.openChat)}
              onChange={(c) => setShortcut("openChat", c)}
            />
            <ShortcutInput
              label={t("settings.shortcuts.openDocuments")}
              value={prettyShortcut(shortcuts.openDocuments)}
              onChange={(c) => setShortcut("openDocuments", c)}
            />
            <ShortcutInput
              label={t("settings.shortcuts.openQuiz")}
              value={prettyShortcut(shortcuts.openQuiz)}
              onChange={(c) => setShortcut("openQuiz", c)}
            />
            <ShortcutInput
              label={t("settings.shortcuts.upload")}
              value={prettyShortcut(shortcuts.upload)}
              onChange={(c) => setShortcut("upload", c)}
            />
            <ShortcutInput
              label={t("settings.shortcuts.toggleSidebar")}
              value={prettyShortcut(shortcuts.toggleSidebar)}
              onChange={(c) => setShortcut("toggleSidebar", c)}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" onClick={resetShortcuts}>{t("settings.shortcuts.reset")}</Button>
          </div>
        </Card>

        {/* Altre impostazioni utili */}
        <Card className="bg-gray-800/60">
          <h2 className="text-xl font-semibold mb-2">{t("settings.interface.title")}</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{t("settings.interface.showShortcuts")}</div>
              <div className="text-gray-400 text-sm">{t("settings.interface.showShortcutsDesc")}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showShortcutsHelpInDashboard}
                onChange={(e) => setShowShortcutsHelpInDashboard(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </Card>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500">
          {t("settings.footer")}
        </motion.div>
      </div>
    </div>
  );
}
