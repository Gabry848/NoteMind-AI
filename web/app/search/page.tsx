/**
 * Search page - Advanced search and filters
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { search as searchApi } from "@/lib/api";
import { Button } from "@/components/Button";
import type { SearchResponse, SearchFilters } from "@/types";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isInitialized } = useAuthStore();

  const [query, setQuery] = useState(searchParams?.get("q") || "");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, isInitialized, router]);

  // Perform search
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const filters: SearchFilters = {};
      if (fileTypes.length > 0) {
        filters.file_types = fileTypes;
      }

      const response = await searchApi.search({
        query,
        filters,
        sort_by: sortBy,
        limit: 50,
        offset: 0,
      });

      setResults(response);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search on mount if query in URL
  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, []);

  const handleFileTypeToggle = (type: string) => {
    setFileTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  if (!isInitialized) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔍 Search</h1>
          <p className="text-gray-400">Search through your documents and conversations</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, conversations..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !query.trim()}
              className="px-6"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
            <Button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              className="px-6"
            >
              {showFilters ? "Hide Filters" : "Filters"}
            </Button>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h3 className="font-semibold mb-4">Filters</h3>

            {/* File Types */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">File Types</label>
              <div className="flex flex-wrap gap-2">
                {[".pdf", ".md", ".txt", ".docx", ".mp3", ".mp4"].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFileTypeToggle(type)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      fileTypes.includes(type)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="relevance">Relevance</option>
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Documents Section */}
            {results.total_documents > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Documents ({results.total_documents})
                </h2>
                <div className="space-y-3">
                  {results.documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/document/${doc.id}`)}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 cursor-pointer transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{doc.original_filename}</h3>
                          {doc.highlight && (
                            <p className="text-gray-400 text-sm mb-2">{doc.highlight}</p>
                          )}
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span>Type: {doc.file_type}</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversations Section */}
            {results.total_conversations > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Conversations ({results.total_conversations})
                </h2>
                <div className="space-y-3">
                  {results.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => router.push(`/document/${conv.document_id}`)}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 cursor-pointer transition"
                    >
                      <h3 className="font-semibold mb-2">{conv.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {conv.highlight || conv.message_content}
                      </p>
                      <div className="text-xs text-gray-500">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results.total_documents === 0 && results.total_conversations === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-400">
                  Try different keywords or adjust your filters
                </p>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!results && !isLoading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Start searching</h3>
            <p className="text-gray-400">
              Enter a query to search through your documents and conversations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
