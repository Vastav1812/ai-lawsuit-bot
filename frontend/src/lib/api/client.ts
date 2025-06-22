// src/lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_URL } from '@/lib/constants';
import { generatePaymentHeader } from '@/lib/utils/payment';
import toast from 'react-hot-toast';
import { PaymentRequirement } from '@/lib/types/index';

interface PaymentConfig {
  amount: string;
  from: string;
}

interface Error402Data {
  message: string;
  paymentRequired?: PaymentRequirement;
  error?: string;
}

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log('📤 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log('📥 API Response:', {
          status: response.status,
          data: response.data,
          url: response.config.url
        });
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        
        if (error.response?.status === 402) {
          this.handle402Error(error);
        }
        return Promise.reject(error);
      }
    );
  }

  private handle402Error(error: AxiosError) {
    const data = error.response?.data as Error402Data;
    const amount = data?.paymentRequired?.amount || 'Unknown amount';
    
    toast.error(`Payment Required: ${amount}`, {
      duration: 5000,
      icon: '💰',
    });
  }

  // Make request with payment
  async requestWithPayment<T>(
    config: AxiosRequestConfig<unknown>,
    payment: PaymentConfig
  ): Promise<T> {
    const paymentHeader = generatePaymentHeader(payment);
    
    console.log('💳 Making payment request:', {
      url: config.url,
      method: config.method,
      payment,
      paymentHeader,
      data: config.data
    });
    
    try {
      const response = await this.client.request({
        ...config,
        headers: {
          ...config.headers,
          'X-PAYMENT': paymentHeader,
        },
      });
      
      console.log('✅ Payment request successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Payment request failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw error;
    }
  }

  // Standard requests
  async get<T>(url: string, config?: AxiosRequestConfig<unknown>): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig<unknown>): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig<unknown>): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig<unknown>): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new APIClient();