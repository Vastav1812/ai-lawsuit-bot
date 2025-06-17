// src/app/precedents/page.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { PrecedentSearch } from '@/components/precedent/PrecedentSearch';
import { PrecedentFilters } from '@/components/precedent/PrecedentFilters';
import { PrecedentCard } from '@/components/precedent/PrecedentCard';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Grid, List, Info } from 'lucide-react';
import { useSearchPrecedents } from '@/hooks/useCases';
import { ClaimType } from '@/lib/types';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 12;

interface PrecedentSearchResult {
  id: string;
  caseId: string;
  type: string;
  summary: string;
  verdict: 'guilty' | 'not_guilty';
  damages?: string;
  citationCount: number;
  relevanceScore?: number;
  date: string;
  accessFee: string;
  isLocked: boolean;
}

interface PrecedentSearchFilters {
  caseType: ClaimType | 'all';
  verdict: 'guilty' | 'not_guilty' | 'all';
  dateRange: 'week' | 'month' | 'year' | 'all';
  minCitations: number;
  maxDamages: number;
  sortBy: 'relevance' | 'date' | 'citations' | 'damages';
  includeSettled: boolean;
  keywords?: string;
}

export default function PrecedentsPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<PrecedentSearchFilters>({
    caseType: (searchParams.get('type') as ClaimType | 'all') || 'all',
    verdict: (searchParams.get('verdict') as 'guilty' | 'not_guilty' | 'all') || 'all',
    dateRange: (searchParams.get('range') as 'week' | 'month' | 'year' | 'all') || 'all',
    minCitations: parseInt(searchParams.get('citations') || '0'),
    maxDamages: parseFloat(searchParams.get('damages') || '10'),
    sortBy: (searchParams.get('sort') as 'relevance' | 'date' | 'citations' | 'damages') || 'relevance',
    includeSettled: searchParams.get('settled') === 'true'
  });
  
  const [results, setResults] = useState<PrecedentSearchResult[]>([]);
  const [unlockedPrecedents, setUnlockedPrecedents] = useState<Set<string>>(new Set());
  
  const { searchPrecedents, loading } = useSearchPrecedents();

  // Search suggestions based on common queries
  const searchSuggestions = [
    "API accuracy fraud cases",
    "Data theft with damages over 1 ETH",
    "Service manipulation guilty verdicts",
    "Token fraud precedents 2024",
    "High citation API cases"
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    const searchRequestParams: PrecedentSearchFilters = {
      keywords: searchQuery,
      ...filters
    };
    
    // Remove 'all' values
    Object.keys(searchRequestParams).forEach(key => {
      if (searchRequestParams[key as keyof PrecedentSearchFilters] === 'all' || searchRequestParams[key as keyof PrecedentSearchFilters] === 0) {
        delete searchRequestParams[key as keyof PrecedentSearchFilters];
      }
    });

    try {
      const response = await searchPrecedents(searchRequestParams) as { results: PrecedentSearchResult[] };
      if (response?.results) {
        setResults(response.results);
        setHasSearched(true);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleUnlock = (precedentId: string) => {
    setUnlockedPrecedents(prev => new Set(prev).add(precedentId));
  };

  const resetFilters = () => {
    setFilters({
      caseType: 'all',
      verdict: 'all',
      dateRange: 'all',
      minCitations: 0,
      maxDamages: 10,
      sortBy: 'relevance',
      includeSettled: false
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
  };

  // Pagination
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedResults = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Mock data for demonstration
  const mockResults: PrecedentSearchResult[] = hasSearched ? [] : [
    {
      id: '1',
      caseId: '10234',
      type: 'API_FRAUD',
      summary: 'AI translation service promised 99% accuracy but delivered only 60% in production environment',
      verdict: 'guilty',
      damages: '2.5',
      citationCount: 87,
      relevanceScore: 95,
      date: '2024-11-15',
      accessFee: '$5.00',
      isLocked: !unlockedPrecedents.has('1')
    },
    {
      id: '2',
      caseId: '10198',
      type: 'DATA_THEFT',
      summary: 'Unauthorized use of proprietary dataset for model training without consent',
      verdict: 'guilty',
      damages: '5.0',
      citationCount: 62,
      relevanceScore: 88,
      date: '2024-10-22',
      accessFee: '$5.00',
      isLocked: !unlockedPrecedents.has('2')
    }
  ];

  const displayResults = hasSearched ? paginatedResults : mockResults;

  return (
    <PageContainer>
      <PageHeader 
        title="Legal Precedents"
        description="Search and access case law to support your claims"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Search Bar */}
        <PrecedentSearch
          onSearch={handleSearch}
          onClear={clearSearch}
          suggestions={searchSuggestions}
          loading={loading}
        />

        {/* Info Alert */}
        {!hasSearched && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Search our database of legal precedents to find cases similar to yours. 
              Each search costs $0.50 and returns relevant cases based on your criteria.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <PrecedentFilters
          filters={{
            caseType: filters.caseType,
            verdict: filters.verdict,
            dateRange: filters.dateRange,
            minCitations: filters.minCitations,
            maxDamages: filters.maxDamages,
            sortBy: filters.sortBy,
            includeSettled: filters.includeSettled
          }}
          onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onReset={resetFilters}
        />

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : displayResults.length === 0 && hasSearched ? (
          <EmptyState
            title="No precedents found"
            description="Try adjusting your search criteria or filters"
            icon="search"
            action={{
              label: "Clear Search",
              onClick: clearSearch
            }}
          />
        ) : displayResults.length > 0 ? (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {hasSearched 
                  ? `Found ${results.length} precedent${results.length !== 1 ? 's' : ''}`
                  : 'Popular precedents'}
              </p>
            </div>

            {/* Results Grid/List */}
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            )}>
              {displayResults.map((precedent) => (
                <PrecedentCard
                  key={precedent.id}
                  precedent={precedent}
                  onUnlock={handleUnlock}
                  highlighted={precedent.relevanceScore ? precedent.relevanceScore >= 90 : false}
                />
              ))}
            </div>

            {/* Pagination */}
            {hasSearched && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <EmptyState
            title="Search for precedents"
            description="Find relevant cases to strengthen your legal position"
            icon="search"
          />
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount="$0.50"
        description="Search precedents database"
        onConfirm={handlePaymentConfirm}
        endpoint="/api/precedents/search"
      />
    </PageContainer>
  );
}