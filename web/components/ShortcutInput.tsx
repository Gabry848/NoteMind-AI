/**
 * ShortcutInput - capture keyboard combinations like Ctrl+K
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface ShortcutInputProps {
  label?: string;
  value: string;
  onChange: (combo: string) => void;
  className?: string;
}

export const ShortcutInput: React.FC<ShortcutInputProps> = ({
  label,
  value,
  onChange,
  className = "",
}) => {
  const [recording, setRecording] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (e.metaKey) parts.push("Meta");
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      if (!["Meta", "Control", "Shift", "Alt"].includes(e.key)) {
        parts.push(key);
      }
      const combo = parts.join("+");
      if (combo) onChange(combo);
      setRecording(false);
    },
    [onChange, recording]
  );

  useEffect(() => {
    if (recording) {
      window.addEventListener("keydown", handleKeyDown, { capture: true });
      return () => window.removeEventListener("keydown", handleKeyDown, { capture: true } as any);
    }
  }, [recording, handleKeyDown]);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      )}
      <div
        ref={ref}
        tabIndex={0}
        onClick={() => setRecording(true)}
        onKeyDown={(e) => {
          // prevent page scroll while focused
          if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
        }}
        className={`w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-text`}
      >
        <span className="font-mono text-sm text-gray-200">
          {recording ? "Premi la combinazione..." : value || "Clicca per registrare"}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-500">Suggerimento: includi Ctrl/⌘ per evitare conflitti.</p>
    </div>
  );
};
