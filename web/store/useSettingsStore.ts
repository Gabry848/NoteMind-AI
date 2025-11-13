/**
 * Settings store (Zustand) with persistence
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AssistantLanguage = "it" | "en" | "es" | "fr" | "de";

export type ShortcutAction =
  | "openChat"
  | "openDocuments"
  | "openQuiz"
  | "upload"
  | "toggleSidebar";

export type ShortcutMap = Record<ShortcutAction, string>; // e.g., "Ctrl+K", "Meta+K"

interface SettingsState {
  assistantLanguage: AssistantLanguage;
  shortcuts: ShortcutMap;
  showShortcutsHelpInDashboard: boolean;
  setAssistantLanguage: (lang: AssistantLanguage) => void;
  setShortcut: (action: ShortcutAction, combo: string) => void;
  resetShortcuts: () => void;
  setShowShortcutsHelpInDashboard: (value: boolean) => void;
}

const defaultShortcuts: ShortcutMap = {
  openChat: "Ctrl+K",
  openDocuments: "Ctrl+D",
  openQuiz: "Ctrl+Q",
  upload: "Ctrl+U",
  toggleSidebar: "Ctrl+B",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      assistantLanguage: "it",
      shortcuts: defaultShortcuts,
      showShortcutsHelpInDashboard: false,
      setAssistantLanguage: (lang) => set({ assistantLanguage: lang }),
      setShortcut: (action, combo) =>
        set((state) => ({ shortcuts: { ...state.shortcuts, [action]: combo } })),
      resetShortcuts: () => set({ shortcuts: defaultShortcuts }),
      setShowShortcutsHelpInDashboard: (value) => set({ showShortcutsHelpInDashboard: value }),
    }),
    { name: "settings" }
  )
);

// Utility to match a native KeyboardEvent to a stored combo like "Ctrl+K" or "Meta+K"
export function isEventMatchingShortcut(e: KeyboardEvent, combo: string) {
  const parts = combo.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const needCtrl = parts.includes("ctrl");
  const needMeta = parts.includes("meta") || parts.includes("cmd") || parts.includes("⌘");
  const needAlt = parts.includes("alt");
  const needShift = parts.includes("shift");
  const pressedKey = e.key.toLowerCase();
  return (
    pressedKey === key &&
    (!!e.ctrlKey === needCtrl || (!!e.metaKey && needCtrl)) // treat Meta as Ctrl on mac if user saved Ctrl
      && (!!e.metaKey === needMeta) && (!!e.altKey === needAlt) && (!!e.shiftKey === needShift)
  );
}

export function prettyShortcut(combo: string) {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  if (isMac) return combo.replace(/Ctrl/gi, "⌘");
  return combo.replace(/Meta|Cmd|⌘/gi, "Ctrl");
}
