// src/components/cases/CaseList.tsx
import { useState } from 'react';
import { CaseCard } from './CaseCard';
import { Pagination } from '@/components/shared/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/Skeleton';
import { Case } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface CaseListProps {
  cases: Case[];
  loading?: boolean;
  emptyMessage?: string;
  showPagination?: boolean;
  itemsPerPage?: number;
  onRequestJudgment?: (caseId: string) => void;
}

export function CaseList({ 
  cases, 
  loading,
  emptyMessage = "No cases found",
  showPagination = true,
  itemsPerPage = 10,
  onRequestJudgment
}: CaseListProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(cases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCases = cases.slice(startIndex, endIndex);

  const handleViewDetails = (caseId: string) => {
    router.push(`/my-cases/${caseId}`); // FIXED: Changed from /cases/ to /my-cases/
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <EmptyState
        title="No cases yet"
        description={emptyMessage}
        icon="folder"
        action={{
          label: "File a Case",
          onClick: () => router.push('/file-case')
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {currentCases.map((caseData) => (
        <CaseCard
          key={caseData.id}
          case={caseData}
          onViewDetails={() => handleViewDetails(caseData.id)}
          onRequestJudgment={
            onRequestJudgment ? () => onRequestJudgment(caseData.id) : undefined
          }
        />
      ))}
      
      {showPagination && totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}