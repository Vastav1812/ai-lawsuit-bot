// src/components/precedent/PrecedentFilters.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  RotateCcw,
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { ClaimType } from '@/lib/types';

interface FilterOptions {
  caseType?: ClaimType | 'all';
  verdict?: 'guilty' | 'not_guilty' | 'all';
  dateRange?: 'week' | 'month' | 'year' | 'all';
  minCitations?: number;
  maxDamages?: number;
  sortBy?: 'relevance' | 'date' | 'citations' | 'damages';
  includeSettled?: boolean;
}

interface PrecedentFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
  className?: string;
}

export function PrecedentFilters({
  filters,
  onFiltersChange,
  onReset,
  className
}: PrecedentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: string | number | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([, value]) => value !== 'all' && value !== undefined && value !== false && value !== 0
  ).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={activeFilterCount === 0}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm mb-2">Case Type</Label>
            <Select
              value={filters.caseType || 'all'}
              onValueChange={(value: ClaimType | 'all') => handleFilterChange('caseType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={ClaimType.API_FRAUD}>API Fraud</SelectItem>
                <SelectItem value={ClaimType.DATA_THEFT}>Data Theft</SelectItem>
                <SelectItem value={ClaimType.SERVICE_MANIPULATION}>Service Manipulation</SelectItem>
                <SelectItem value={ClaimType.TOKEN_FRAUD}>Token Fraud</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm mb-2">Verdict</Label>
            <Select
              value={filters.verdict || 'all'}
              onValueChange={(value: 'guilty' | 'not_guilty' | 'all') => handleFilterChange('verdict', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verdicts</SelectItem>
                <SelectItem value="guilty">Guilty</SelectItem>
                <SelectItem value="not_guilty">Not Guilty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm mb-2">Sort By</Label>
            <Select
              value={filters.sortBy || 'relevance'}
              onValueChange={(value: 'relevance' | 'date' | 'citations' | 'damages') => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="date">Most Recent</SelectItem>
                <SelectItem value="citations">Most Cited</SelectItem>
                <SelectItem value="damages">Highest Damages</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div>
              <Label className="text-sm mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <Select
                value={filters.dateRange || 'all'}
                onValueChange={(value: 'week' | 'month' | 'year' | 'all') => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Minimum Citations: {filters.minCitations || 0}
              </Label>
              <Slider
                value={[filters.minCitations || 0]}
                onValueChange={([value]: number[]) => handleFilterChange('minCitations', value)}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Maximum Damages: {filters.maxDamages || 10} ETH
              </Label>
              <Slider
                value={[filters.maxDamages || 10]}
                onValueChange={([value]: number[]) => handleFilterChange('maxDamages', value)}
                max={10}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="includeSettled"
                checked={filters.includeSettled || false}
                onCheckedChange={(checked: boolean) => handleFilterChange('includeSettled', checked)}
              />
              <Label htmlFor="includeSettled" className="text-sm cursor-pointer">
                Include settled cases only
              </Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}