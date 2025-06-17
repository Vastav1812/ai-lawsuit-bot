// src/hooks/useCases.ts
import { useCallback } from 'react';
import { usePayment } from './usePayment';
import { ClaimType, FileCaseSuccessResponse } from '@/lib/types';
import toast from 'react-hot-toast';

// interface FileCaseSuccessResponse {
//   success: boolean;
//   caseId: string;
// }

export function useFileCase() {
  const { executePayment, loading } = usePayment({
    onSuccess: () => toast.success('Case filed successfully!'),
    onError: (error) => toast.error(error.message)
  });

  const fileCase = useCallback(async (caseData: {
    defendant: string;
    claimType: ClaimType;
    evidence: string;
    requestedDamages: string;
  }): Promise<FileCaseSuccessResponse | null> => {
    const response = await executePayment<FileCaseSuccessResponse>(
      '/api/cases/file',
      '$10.00',
      caseData,
      'POST'
    );
    return response;
  }, [executePayment]);

  return { fileCase, loading };
}

export function useRequestJudgment() {
  const { executePayment, loading } = usePayment({
    onSuccess: () => toast.success('Judgment requested!'),
    onError: (error) => toast.error(error.message)
  });

  const requestJudgment = useCallback(async (caseId: string) => {
    const response = await executePayment(
      `/api/cases/${caseId}/judge`,
      '$5.00',
      {},
      'POST'
    );
    return response;
  }, [executePayment]);

  return { requestJudgment, loading };
}

export function useSearchPrecedents() {
  const { executePayment, loading } = usePayment();

  const searchPrecedents = useCallback(async (query: {
    type?: string;
    keywords?: string;
    verdict?: string;
  }) => {
    const params = new URLSearchParams(query as Record<string, string>).toString();
    const response = await executePayment(
      `/api/precedents/search?${params}`,
      '$0.50',
      undefined,
      'GET'
    );
    return response;
  }, [executePayment]);

  return { searchPrecedents, loading };
}