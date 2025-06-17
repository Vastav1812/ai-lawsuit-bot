// src/hooks/usePayment.ts
import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { PaymentRequirement } from '@/lib/types/index';

interface UsePaymentOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePayment(options?: UsePaymentOptions) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executePayment = useCallback(async <TResponse = unknown>(
    endpoint: string,
    amount: string,
    data?: unknown,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
  ): Promise<TResponse | null> => {
    if (!address) {
      const err = new Error('Wallet not connected');
      setError(err);
      options?.onError?.(err);
      toast.error('Please connect your wallet');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const payment = {
        from: address,
        amount
      };

      let responseData: TResponse | null;
      switch (method) {
        case 'GET':
          responseData = await apiClient.requestWithPayment<TResponse>(
            { method: 'GET', url: endpoint },
            payment
          );
          break;
        case 'POST':
          responseData = await apiClient.requestWithPayment<TResponse>(
            { method: 'POST', url: endpoint, data },
            payment
          );
          break;
        case 'PUT':
          responseData = await apiClient.requestWithPayment<TResponse>(
            { method: 'PUT', url: endpoint, data },
            payment
          );
          break;
        case 'DELETE':
          responseData = await apiClient.requestWithPayment<TResponse>(
            { method: 'DELETE', url: endpoint },
            payment
          );
          break;
        default:
          responseData = null;
      }

      options?.onSuccess?.();
      return responseData;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      let errorMessage = error.message;
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(new Error(errorMessage));
      options?.onError?.(new Error(errorMessage));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [address, options]);

  const checkPaymentRequired = useCallback(async (endpoint: string) => {
    try {
      // Make a request without payment to check if payment is required
      await apiClient.get(endpoint);
      return false;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 402) {
        return (err.response.data as { paymentRequired: PaymentRequirement }).paymentRequired;
      }
      throw err;
    }
  }, []);

  return {
    executePayment,
    checkPaymentRequired,
    loading,
    error,
    address
  };
}