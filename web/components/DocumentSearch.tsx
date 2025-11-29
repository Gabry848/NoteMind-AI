"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import type { Document } from "@/types";

interface DocumentSearchProps {
  onResultsChange: (documents: Document[], isSearching: boolean) => void;
}

export function DocumentSearch({ onResultsChange }: DocumentSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const response = await api.get("/documents/search", {
            params: { q: query },
          });
          onResultsChange(response.data.documents, true);
        } catch (error) {
          console.error("Search error:", error);
          onResultsChange([], true);
        } finally {
          setIsSearching(false);
        }
      } else if (query.trim().length === 0) {
        // Clear search
        onResultsChange([], false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query, onResultsChange]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca documenti per nome o contenuto..."
          className="w-full px-4 py-3 pl-12 pr-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        {query && !isSearching && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Digita almeno 2 caratteri per cercare
        </p>
      )}
    </div>
  );
}
