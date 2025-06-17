// frontend/src/services/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Helper to create payment header
export const createPaymentHeader = (amount: string, from: string = '0x0') => {
  const paymentData = {
    from,
    amount,
    timestamp: new Date().toISOString(),
  };
  return Buffer.from(JSON.stringify(paymentData)).toString('base64');
};

export interface Case {
  id: string;
  plaintiff: string;
  defendant: string;
  claimType: string;
  evidence: any;
  requestedDamages: string;
  status: string;
  filedAt: string;
  caseWalletAddress?: string;
  judgment?: {
    verdict: string;
    awardedDamages: number;
    reasoning: string;
  };
  settlement?: {
    escrowAddress: string;
    requiredAmount: string;
    deadline: string;
    status: string;
  };
}

export interface WalletInfo {
  walletAddress: string;
  network: string;
  balances?: {
    ETH?: string;
  };
}

export const courtAPI = {
  // File a case
  async fileCase(caseData: {
    defendant: string;
    claimType: string;
    evidence: any;
    requestedDamages: string;
  }, payerAddress: string) {
    const { data } = await api.post('/api/cases/file', caseData, {
      headers: {
        'X-PAYMENT': createPaymentHeader('$10.00', payerAddress),
      },
    });
    return data;
  },

  // Get case details
  async getCase(caseId: string): Promise<{ success: boolean; case: Case }> {
    const { data } = await api.get(`/api/cases/${caseId}`);
    return data;
  },

  // Judge a case
  async judgeCase(caseId: string, payerAddress: string) {
    const { data } = await api.post(`/api/cases/${caseId}/judge`, {}, {
      headers: {
        'X-PAYMENT': createPaymentHeader('$5.00', payerAddress),
      },
    });
    return data;
  },

  // Get user's cases
  async getMyCases(address: string): Promise<Case[]> {
    const { data } = await api.get(`/api/cases/search?plaintiff=${address}`);
    return data.cases || [];
  },

  // Get settlement status
  async getSettlement(caseId: string) {
    const { data } = await api.get(`/api/cases/${caseId}/settlement`);
    return data;
  },

  // Get wallet info
  async getWalletInfo(caseId: string): Promise<WalletInfo> {
    const { data } = await api.get(`/api/cases/${caseId}/wallet`);
    return data;
  },
};