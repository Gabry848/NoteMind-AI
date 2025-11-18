"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import translations from "@/lib/translations";

type Language = "it" | "en";

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { assistantLanguage, setAssistantLanguage } = useSettingsStore();
  const [language, setLanguageState] = useState<Language>("it");

  // Sincronizza con le impostazioni dell'assistente
  useEffect(() => {
    const lang = assistantLanguage === "en" ? "en" : "it";
    setLanguageState(lang);
  }, [assistantLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setAssistantLanguage(lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        return key; // Fallback: ritorna la chiave se non trova la traduzione
      }
    }

    return typeof value === "string" ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
