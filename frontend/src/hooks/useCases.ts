// src/hooks/useCases.ts
import { useCallback } from 'react';
import { usePayment } from './usePayment';
import { ClaimType, FileCaseSuccessResponse } from '@/lib/types';
import toast from 'react-hot-toast';

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
    evidenceFiles?: File[];
  }): Promise<FileCaseSuccessResponse | null> => {
    // For now, we'll send without files until backend supports them
    const body = {
      defendant: caseData.defendant,
      claimType: caseData.claimType,
      evidence: caseData.evidence,
      requestedDamages: caseData.requestedDamages
    };

    console.log('📝 Filing case with data:', body);

    const response = await executePayment<FileCaseSuccessResponse>(
      '/api/cases-wallet/file',  // Using cases-wallet endpoint
      '$10.00',
      body,
      'POST'
    );
    
    console.log('📦 File case response:', response);
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
    console.log('⚖️ Requesting judgment for case:', caseId);
    
    const response = await executePayment(
      `/api/cases-wallet/${caseId}/judge`,  // Using cases-wallet endpoint
      '$5.00',
      {},
      'POST'
    );
    
    console.log('⚖️ Judgment response:', response);
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

export function useAppealCase() {
  const { executePayment, loading } = usePayment({
    onSuccess: () => toast.success('Appeal filed successfully!'),
    onError: (error) => toast.error(error.message)
  });

  const appealCase = useCallback(async (caseId: string, appealReason: string) => {
    const response = await executePayment(
      `/api/cases-wallet/${caseId}/appeal`,  // Using cases-wallet endpoint
      '$25.00',
      { reason: appealReason },  // Backend expects 'reason' field
      'POST'
    );
    return response;
  }, [executePayment]);

  return { appealCase, loading };
}

export function useSettleCase() {
  const { executePayment, loading } = usePayment({
    onSuccess: () => toast.success('Settlement initiated!'),
    onError: (error) => toast.error(error.message)
  });

  const settleCase = useCallback(async (caseId: string, amount: string) => {
    const response = await executePayment(
      `/api/cases-wallet/${caseId}/settle`,  // Using cases-wallet endpoint
      amount,
      { settlementAmount: amount },
      'POST'
    );
    return response;
  }, [executePayment]);

  return { settleCase, loading };
}

export function useGetPrecedentDetails() {
  const { executePayment, loading } = usePayment();

  const getPrecedentDetails = useCallback(async (precedentId: string) => {
    const response = await executePayment(
      `/api/precedents/full/${precedentId}`,
      '$5.00',
      undefined,
      'GET'
    );
    return response;
  }, [executePayment]);

  return { getPrecedentDetails, loading };
}

// Additional hooks for case-related operations

export function useGetCaseDetails() {
  const { executePayment, loading } = usePayment();

  const getCaseDetails = useCallback(async (caseId: string) => {
    const response = await executePayment(
      `/api/cases-wallet/${caseId}`,
      '',  // Free endpoint
      undefined,
      'GET'
    );
    return response;
  }, [executePayment]);

  return { getCaseDetails, loading };
}

export function useGetSettlementStatus() {
  const { executePayment, loading } = usePayment();

  const getSettlementStatus = useCallback(async (caseId: string) => {
    const response = await executePayment(
      `/api/cases-wallet/${caseId}/settlement`,  // Using cases-wallet endpoint
      '',  // Free endpoint
      undefined,
      'GET'
    );
    return response;
  }, [executePayment]);

  return { getSettlementStatus, loading };
}

export function useGetCaseWallet() {
  const { executePayment, loading } = usePayment();

  const getCaseWallet = useCallback(async (caseId: string) => {
    const response = await executePayment(
      `/api/cases-wallet/${caseId}/wallet`,
      '',  // Free endpoint
      undefined,
      'GET'
    );
    return response;
  }, [executePayment]);

  return { getCaseWallet, loading };
}

export function useGetCaseStats() {
  const { executePayment, loading } = usePayment();

  const getCaseStats = useCallback(async () => {
    const response = await executePayment(
      `/api/cases-wallet/stats`,
      '',  // Free endpoint
      undefined,
      'GET'
    );
    return response;
  }, [executePayment]);

  return { getCaseStats, loading };
}