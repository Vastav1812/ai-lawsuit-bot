// src/components/payment/PaymentConfirmation.tsx
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { PriceDisplay } from './PriceDisplay';
import { FeeBreakdown } from './FeeBreakdown';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PaymentConfirmationProps {
  title: string;
  description: string;
  amount: string;
  fees?: Array<{
    label: string;
    amount: string;
    percentage?: number;
    tooltip?: string;
  }>;
  onConfirm: () => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function PaymentConfirmation({
  title,
  description,
  amount,
  fees = [],
  onConfirm,
  onCancel,
  className
}: PaymentConfirmationProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      setSuccess(true);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className={cn("text-center", className)}>
        <CardContent className="py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
          <p className="text-gray-400">Your transaction has been processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-4">
          <PriceDisplay amount={amount} size="xl" />
        </div>

        {fees.length > 0 && (
          <FeeBreakdown fees={fees} total={amount} />
        )}

        <div className="flex gap-3">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={loading || !address}
            loading={loading}
            className="flex-1"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {!address && (
          <p className="text-sm text-center text-gray-400">
            Please connect your wallet to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
}