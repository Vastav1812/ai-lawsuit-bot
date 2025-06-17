// src/components/payment/PaymentModal.tsx
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import axios from 'axios'; // Import axios for error handling

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  description: string;
  onConfirm: () => Promise<void>;
  endpoint?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  description,
  onConfirm,
  endpoint
}: PaymentModalProps) {
  const { address } = useAccount();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      await onConfirm();
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setStatus('error');
      let errorMessage = 'Payment failed';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <CreditCard className="h-8 w-8 text-blue-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Review and confirm your payment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Status Icon */}
          <div className="flex justify-center py-4">
            {getStatusIcon()}
          </div>

          {/* Payment Details */}
          {status !== 'success' && (
            <>
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Amount</span>
                    <span className="text-2xl font-bold text-green-400">{amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Description</span>
                    <span className="text-sm">{description}</span>
                  </div>
                  {endpoint && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Endpoint</span>
                      <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">
                        {endpoint}
                      </span>
                    </div>
                  )}
                </div>

                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <AlertDescription>
                    Payment will be processed via x402 protocol. The amount will be 
                    automatically deducted from your connected wallet.
                  </AlertDescription>
                </Alert>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-green-400">Payment Successful!</h3>
              <p className="text-sm text-gray-400">Your transaction has been processed.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {status !== 'success' && (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={status === 'processing'}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={status === 'processing' || !address}
                  loading={status === 'processing'}
                  className="flex-1"
                >
                  {status === 'processing' ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}