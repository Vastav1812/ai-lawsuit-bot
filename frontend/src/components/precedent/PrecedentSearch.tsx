// src/components/precedent/PrecedentSearch.tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrecedentSearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  suggestions?: string[];
  loading?: boolean;
  className?: string;
}

export function PrecedentSearch({
  onSearch,
  onClear,
  suggestions = [],
  loading = false,
  className
}: PrecedentSearchProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search by keywords, case type, verdict..."
            className="pl-10 pr-24"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            type="submit"
            disabled={!query.trim() || loading}
            loading={loading}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
              <Sparkles className="h-3 w-3" />
              Suggested searches
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition-colors"
              >
                <p className="text-sm">{suggestion}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}