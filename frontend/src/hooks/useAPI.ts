// src/hooks/useAPI.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { usePayment } from './usePayment';
import axios from 'axios';

interface UseAPIOptions<T> {
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  autoFetch?: boolean;
  requiresPayment?: boolean;
  paymentAmount?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useAPI<T = unknown>(options: UseAPIOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { executePayment } = usePayment();

  const fetchData = useCallback(async () => {
    if (!options.endpoint) return;

    setLoading(true);
    setError(null);

    try {
      let responseData: T | null; // Changed from unknown
      
      if (options.requiresPayment && options.paymentAmount) {
        responseData = await executePayment<T>(
          options.endpoint,
          options.paymentAmount,
          options.data,
          options.method
        );
      } else {
        switch (options.method) {
          case 'POST':
            responseData = await apiClient.post<T>(options.endpoint, options.data);
            break;
          case 'PUT':
            responseData = await apiClient.put<T>(options.endpoint, options.data);
            break;
          case 'DELETE':
            responseData = await apiClient.delete<T>(options.endpoint);
            break;
          default:
            responseData = await apiClient.get<T>(options.endpoint);
        }
      }

      if (responseData !== null) {
        setData(responseData);
        options.onSuccess?.(responseData);
      } else {
        setData(null);
        // Do not call onSuccess with null data, as onSuccess implies successful data retrieval.
      }

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      let errorMessage = error.message;

      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(new Error(errorMessage));
      options.onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [
    options.endpoint,
    options.method,
    options.data,
    options.requiresPayment,
    options.paymentAmount,
    executePayment,
    options.onSuccess,
    options.onError,
  ]);

  useEffect(() => {
    if (options.autoFetch && options.endpoint) {
      fetchData();
    }
  }, [options.autoFetch, options.endpoint, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}