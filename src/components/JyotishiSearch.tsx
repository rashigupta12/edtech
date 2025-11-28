// src/components/courses/JyotishiSearch.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, User } from "lucide-react";

interface Jyotishi {
  id: string;
  name: string;
  email: string;
  jyotishiCode: string;
  commissionRate: string;
}

interface JyotishiSearchProps {
  value: string | null;
  onChange: (jyotishiId: string | null, jyotishiName: string | null) => void;
  selectedName?: string | null;
}

export function JyotishiSearch({ value, onChange, selectedName }: JyotishiSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Jyotishi[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for Jyotishis
  useEffect(() => {
    const searchJyotishis = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/jyotishi/search?q=${encodeURIComponent(searchTerm)}`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.jyotishis || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to search jyotishis:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchJyotishis, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelect = (jyotishi: Jyotishi) => {
    onChange(jyotishi.id, jyotishi.name);
    setSearchTerm("");
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    onChange(null, null);
    setSearchTerm("");
    setResults([]);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Jyotishi Display */}
      {value && selectedName ? (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <User className="h-5 w-5 text-blue-600" />
          <span className="flex-1 text-gray-900 font-medium">{selectedName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      ) : (
        /* Search Input */
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search by name, email, or code..."
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && !value && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((jyotishi) => (
            <button
              key={jyotishi.id}
              type="button"
              onClick={() => handleSelect(jyotishi)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-100 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {highlightMatch(jyotishi.name, searchTerm)}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {highlightMatch(jyotishi.email, searchTerm)}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {highlightMatch(jyotishi.jyotishiCode, searchTerm)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && searchTerm.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No instructor found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  );
}