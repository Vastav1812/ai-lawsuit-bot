// src/app/my-cases/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { CaseList } from '@/components/cases/CaseList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus } from 'lucide-react';
import { Case, CaseStatus, ClaimType } from '@/lib/types';
import { API_URL } from '@/lib/constants';
import { useRequestJudgment } from '@/hooks/useCases';
import axios from 'axios';
import toast from 'react-hot-toast';

type StatusCounts = {
  all: number;
} & Record<CaseStatus, number>;

export default function MyCasesPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { requestJudgment, loading: judgmentLoading } = useRequestJudgment();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ClaimType | 'all'>('all');
  const [activeTab, setActiveTab] = useState('plaintiff');

  useEffect(() => {
    if (!address) {
      router.push('/');
      return;
    }
    fetchCases();
  }, [address, activeTab]);

  useEffect(() => {
    filterCases();
  }, [cases, searchQuery, statusFilter, typeFilter]);

  const fetchCases = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const endpoint = activeTab === 'plaintiff' 
        ? `/api/cases-wallet/search?plaintiff=${address}`
        : `/api/cases-wallet/search?defendant=${address}`;
      
      const response = await axios.get(`${API_URL}${endpoint}`);
      setCases(response.data.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = [...cases];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(case_ =>
        case_.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.claimType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.defendant.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.claimType === typeFilter);
    }

    setFilteredCases(filtered);
  };

  const handleRequestJudgment = async (caseId: string) => {
    try {
      console.log('Requesting judgment for case:', caseId);
      const result = await requestJudgment(caseId);
      
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        toast.success('Judgment requested successfully!');
        // Refresh cases to show updated status
        await fetchCases();
      }
    } catch (error: unknown) {
      console.error('Error requesting judgment:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { error?: string } })?.data?.error || 'Failed to request judgment'
        : error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Failed to request judgment';
      toast.error(errorMessage);
    }
  };

  const getStatusCounts = (): StatusCounts => {
    const counts = {
      all: cases.length,
      ...Object.values(CaseStatus).reduce((acc, status) => ({
        ...acc,
        [status]: 0
      }), {} as Record<CaseStatus, number>)
    } as StatusCounts;

    cases.forEach(case_ => {
      if (case_.status in counts) {
        counts[case_.status as CaseStatus]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (!address) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader 
        title="My Cases"
        description="View and manage your filed cases and disputes"
      >
        <Button onClick={() => router.push('/file-case')}>
          <Plus className="mr-2 h-4 w-4" />
          File New Case
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="plaintiff">Cases I Filed</TabsTrigger>
          <TabsTrigger value="defendant">Cases Against Me</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select 
              value={statusFilter} 
              onValueChange={(value: CaseStatus | 'all') => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                <SelectItem value={CaseStatus.FILED}>
                  Filed ({statusCounts[CaseStatus.FILED]})
                </SelectItem>
                <SelectItem value={CaseStatus.UNDER_REVIEW}>
                  Under Review ({statusCounts[CaseStatus.UNDER_REVIEW]})
                </SelectItem>
                <SelectItem value={CaseStatus.JUDGED}>
                  Judged ({statusCounts[CaseStatus.JUDGED]})
                </SelectItem>
                <SelectItem value={CaseStatus.SETTLED}>
                  Settled ({statusCounts[CaseStatus.SETTLED]})
                </SelectItem>
                <SelectItem value={CaseStatus.UNDER_APPEAL}>
                  Under Appeal ({statusCounts[CaseStatus.UNDER_APPEAL]})
                </SelectItem>
                <SelectItem value={CaseStatus.DISMISSED}>
                  Dismissed ({statusCounts[CaseStatus.DISMISSED]})
                </SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={typeFilter} 
              onValueChange={(value: ClaimType | 'all') => setTypeFilter(value)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by type" />
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

          {/* Case List */}
          <CaseList
            cases={filteredCases}
            loading={loading || judgmentLoading}
            emptyMessage={
              activeTab === 'plaintiff' 
                ? "You haven't filed any cases yet" 
                : "No cases filed against you"
            }
            onRequestJudgment={handleRequestJudgment}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}