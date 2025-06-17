// src/lib/utils/payment.ts
import { PaymentData } from '@/lib/types';

export function generatePaymentHeader(data: PaymentData): string {
  const paymentData = {
    from: data.from,
    amount: data.amount,
    timestamp: new Date().toISOString(),
    nonce: Math.random().toString(36).substring(7)
  };
  
  return btoa(JSON.stringify(paymentData));
}

export function parsePaymentHeader(header: string): PaymentData | null {
  try {
    const decoded = atob(header);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse payment header:', error);
    return null;
  }
}

export function formatPaymentAmount(amount: number | string, currency: 'USD' | 'ETH' = 'USD'): string {
  if (currency === 'USD') {
    return `$${parseFloat(amount.toString()).toFixed(2)}`;
  }
  return `${amount} ETH`;
}