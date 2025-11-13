/**
 * Settings page - scorciatoie, lingua assistente e altre opzioni
 */
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ShortcutInput } from "@/components/ShortcutInput";
import { useSettingsStore, prettyShortcut } from "@/store/useSettingsStore";

export default function SettingsPage() {
  const router = useRouter();
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
      { value: "it", label: "Italiano" },
      { value: "en", label: "English" },
      { value: "es", label: "Español" },
      { value: "fr", label: "Français" },
      { value: "de", label: "Deutsch" },
    ],
    []
  );

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
              Impostazioni
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Lingua Assistente */}
        <Card className="bg-gray-800/60">
          <h2 className="text-xl font-semibold mb-2">Lingua dell'assistente IA</h2>
          <p className="text-gray-400 text-sm mb-4">
            Scegli la lingua preferita per le risposte dell'assistente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <select
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={assistantLanguage}
              onChange={(e) => setAssistantLanguage(e.target.value as any)}
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500">
              Attuale: <span className="font-mono">{assistantLanguage}</span>
            </div>
          </div>
        </Card>

        {/* Scorciatoie da tastiera */}
        <Card className="bg-gray-800/60">
          <h2 className="text-xl font-semibold mb-2">Scorciatoie da tastiera</h2>
          <p className="text-gray-400 text-sm mb-4">
            Definisci le scorciatoie. Le combinazioni sono attive in tutta l'app, ma vengono mostrate solo qui.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <ShortcutInput
              label="Apri Multi-Chat"
              value={prettyShortcut(shortcuts.openChat)}
              onChange={(c) => setShortcut("openChat", c)}
            />
            <ShortcutInput
              label="Apri Documenti"
              value={prettyShortcut(shortcuts.openDocuments)}
              onChange={(c) => setShortcut("openDocuments", c)}
            />
            <ShortcutInput
              label="Apri Quiz"
              value={prettyShortcut(shortcuts.openQuiz)}
              onChange={(c) => setShortcut("openQuiz", c)}
            />
            <ShortcutInput
              label="Carica/Upload"
              value={prettyShortcut(shortcuts.upload)}
              onChange={(c) => setShortcut("upload", c)}
            />
            <ShortcutInput
              label="Mostra/Nascondi Sidebar"
              value={prettyShortcut(shortcuts.toggleSidebar)}
              onChange={(c) => setShortcut("toggleSidebar", c)}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" onClick={resetShortcuts}>Reset scorciatoie</Button>
          </div>
        </Card>

        {/* Altre impostazioni utili */}
        <Card className="bg-gray-800/60">
          <h2 className="text-xl font-semibold mb-2">Preferenze interfaccia</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">Mostra suggerimenti scorciatoie in dashboard</div>
              <div className="text-gray-400 text-sm">Consigliato: disattivo, per tenere pulita la dashboard.</div>
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
          Le impostazioni vengono salvate sul dispositivo (localStorage).
        </motion.div>
      </div>
    </div>
  );
}
