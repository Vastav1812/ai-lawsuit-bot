// src/components/payment/PaymentHistory.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentStatus, PaymentStatusType } from './PaymentStatus';
import { Skeleton } from '@/components/shared/Skeleton';
import { apiClient } from '@/lib/api/client';
import { formatDistanceToNow } from 'date-fns';

interface PaymentResponse {
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: string;
  status: PaymentStatusType;
  endpoint: string;
  timestamp: string;
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await apiClient.get<PaymentResponse>('/api/payments/history');
      setPayments(response.payments || []);
    } catch (error: unknown) {
      console.error('Failed to fetch payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No payments yet</p>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="border-b border-gray-800 pb-4 last:border-0">
                <PaymentStatus
                  status={payment.status}
                  amount={payment.amount}
                  timestamp={formatDistanceToNow(new Date(payment.timestamp), { addSuffix: true })}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {payment.endpoint}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}