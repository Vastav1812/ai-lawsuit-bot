import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('📦 Request Data:', config.data);
    console.log('📋 Request Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);
    
    // Handle different error types
    if (error.code === 'ERR_NETWORK') {
      toast.error('Network error - please check your connection');
    } else if (error.response) {
      // Server responded with error
      const message = error.response.data?.error || 
                     error.response.data?.message || 
                     `Server error: ${error.response.status}`;
      toast.error(message);
    } else if (error.request) {
      // Request made but no response
      toast.error('No response from server');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Helper to create payment header
export const createPaymentHeader = (amount: string, from: string = '0x0') => {
  const paymentData = {
    from,
    amount,
    timestamp: new Date().toISOString(),
    nonce: Math.random().toString(36).substring(7), // Add nonce for uniqueness
  };
  return Buffer.from(JSON.stringify(paymentData)).toString('base64');
};

export interface Case {
  id: string;
  plaintiff: string;
  defendant: string;
  claimType: string;
  evidence: unknown;
  requestedDamages: string;
  status: string;
  filedAt: string;
  caseWalletAddress?: string;
  judgment?: {
    verdict: string;
    awardedDamages: number;
    reasoning: string;
    evidenceQuality?: string;
    evidenceScore?: number;
  };
  settlement?: {
    escrowAddress: string;
    requiredAmount: string;
    deadline: string;
    status: string;
    paymentInstructions?: {
      network: string;
      address: string;
      amount: string;
      memo: string;
    };
  };
  appeal?: {
    id: string;
    reason: string;
    status: string;
    filedAt: string;
    reviewDate: string;
  };
}

export interface WalletInfo {
  walletAddress: string;
  network: string;
  balances?: {
    ETH?: string;
    [key: string]: string | undefined;
  };
  error?: string;
}

export const courtAPI = {
  // File a case - FIXED endpoint
  async fileCase(caseData: {
    defendant: string;
    claimType: string;
    evidence: unknown;
    requestedDamages: string;
  }, payerAddress: string) {
    const { data } = await api.post('/api/cases-wallet/file', caseData, {
      headers: {
        'X-PAYMENT': createPaymentHeader('$10.00', payerAddress),
      },
    });
    return data;
  },

  // Get case details
  async getCase(caseId: string): Promise<{ success: boolean; case: Case }> {
    const { data } = await api.get(`/api/cases-wallet/${caseId}`);
    return data;
  },

  // Judge a case
  async judgeCase(caseId: string, payerAddress: string) {
    const { data } = await api.post(`/api/cases-wallet/${caseId}/judge`, {}, {
      headers: {
        'X-PAYMENT': createPaymentHeader('$5.00', payerAddress),
      },
    });
    return data;
  },

  // Search cases
  async searchCases(params: {
    plaintiff?: string;
    defendant?: string;
    claimType?: string;
    status?: string;
    limit?: number;
  }): Promise<{ success: boolean; cases: Case[]; count: number }> {
    const { data } = await api.get('/api/cases-wallet/search', { params });
    return data;
  },

  // Get user's cases
  async getMyCases(address: string): Promise<Case[]> {
    const { data } = await api.get('/api/cases-wallet/search', {
      params: { plaintiff: address }
    });
    return data.cases || [];
  },

  // Get all cases (paginated)
  async getAllCases(page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    cases: Case[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { data } = await api.get('/api/cases-wallet/', {
      params: { page, limit }
    });
    return data;
  },

  // Get settlement status
  async getSettlement(caseId: string) {
    const { data } = await api.get(`/api/cases-wallet/${caseId}/settlement`);
    return data;
  },

  // Execute settlement
  async executeSettlement(caseId: string) {
    const { data } = await api.post(`/api/cases-wallet/${caseId}/settle`);
    return data;
  },

  // Get wallet info
  async getWalletInfo(caseId: string): Promise<WalletInfo> {
    const { data } = await api.get(`/api/cases-wallet/${caseId}/wallet`);
    return data;
  },

  // Appeal a case
  async appealCase(caseId: string, reason: string, payerAddress: string) {
    const { data } = await api.post(
      `/api/cases-wallet/${caseId}/appeal`,
      { reason },
      {
        headers: {
          'X-PAYMENT': createPaymentHeader('$25.00', payerAddress),
        },
      }
    );
    return data;
  },

  // Get appeal status
  async getAppealStatus(caseId: string) {
    const { data } = await api.get(`/api/cases-wallet/${caseId}/appeal-status`);
    return data;
  },

  // Process appeal (for admin/automated processing)
  async processAppeal(caseId: string) {
    const { data } = await api.post(`/api/cases-wallet/${caseId}/process-appeal`);
    return data;
  },

  // Get case statistics
  async getCaseStats() {
    const { data } = await api.get('/api/cases-wallet/stats/summary');
    return data;
  },

  // Get pending appeals
  async getPendingAppeals() {
    const { data } = await api.get('/api/cases-wallet/appeals/pending');
    return data;
  },

  // Health check
  async healthCheck() {
    const { data } = await api.get('/health');
    return data;
  },

  // Get API info
  async getApiInfo() {
    const { data } = await api.get('/api/info');
    return data;
  },
};

// Export the api instance for custom requests
export { api };