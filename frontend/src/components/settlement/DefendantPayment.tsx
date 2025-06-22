// src/components/settlement/DefendantPayment.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Wallet,
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Settlement } from '@/lib/types';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

interface DefendantPaymentProps {
  settlement: Settlement;
  caseId: string;
  onPaymentComplete?: () => void;
}

export function DefendantPayment({ 
  settlement, 
  caseId,
  onPaymentComplete 
}: DefendantPaymentProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'qr'>('wallet');
  
  const { address } = useAccount();
  const { sendTransaction, data: hash, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(settlement.escrowAddress);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  const handleWalletPayment = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    console.log('🔍 Wallet payment debug info:', {
      address,
      escrowAddress: settlement.escrowAddress,
      requiredAmount: settlement.requiredAmount,
      requiredAmountType: typeof settlement.requiredAmount,
      isConnected: !!address
    });

    try {
      // Ensure requiredAmount is a string and convert to proper format
      const amount = String(settlement.requiredAmount);
      
      console.log('💳 Initiating wallet payment:', {
        to: settlement.escrowAddress,
        value: amount,
        from: address
      });

      // Validate escrow address
      if (!settlement.escrowAddress || !settlement.escrowAddress.startsWith('0x')) {
        throw new Error('Invalid escrow address');
      }

      const transaction = {
        to: settlement.escrowAddress as `0x${string}`,
        value: parseEther(amount),
        data: `0x${Buffer.from(`Settlement for Case #${caseId}`).toString('hex')}` as `0x${string}`
      };

      console.log('📝 Transaction object:', transaction);

      await sendTransaction(transaction);

      toast.success('Transaction initiated! Please confirm in your wallet.');
    } catch (error: unknown) {
      console.error('Payment error:', error);
      console.error('Payment error type:', typeof error);
      console.error('Payment error keys:', error && typeof error === 'object' ? Object.keys(error) : 'not an object');
      
      let errorMessage = 'Payment failed';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('details' in error && typeof error.details === 'string') {
          errorMessage = error.details;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  // Handle successful payment
  if (isSuccess) {
    toast.success('Payment successful! Settlement will be processed shortly.');
    onPaymentComplete?.();
  }

  const isOverdue = settlement.deadlinePassed;
  const isFunded = settlement.isFullyFunded;
  const isProcessing = isSending || isConfirming;

  // Generate QR code data
  const qrData = `ethereum:${settlement.escrowAddress}?value=${settlement.requiredAmount}&label=Settlement%20Case%20${caseId}`;

  return (
    <Card className="border-yellow-500/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-500" />
            Settlement Payment Required
          </CardTitle>
          {settlement.daysRemaining !== undefined && !isFunded && (
            <div className={cn(
              "text-sm",
              isOverdue ? "text-red-400" : "text-gray-400"
            )}>
              <Clock className="h-4 w-4 inline mr-1" />
              {isOverdue ? "Overdue!" : `${settlement.daysRemaining} days left`}
            </div>
          )}
        </div>
        <CardDescription>
          You have been found guilty and must pay the awarded damages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Due */}
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Total Amount Due</p>
          <p className="text-4xl font-bold text-yellow-400">
            {settlement.requiredAmount} ETH
          </p>
          {settlement.currentBalance && parseFloat(settlement.currentBalance) > 0 && (
            <p className="text-sm text-gray-400 mt-2">
              Paid: {settlement.currentBalance} ETH | 
              Remaining: {settlement.remainingAmount} ETH
            </p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('wallet')}
            className="h-auto p-4 flex flex-col gap-2"
          >
            <Wallet className="h-6 w-6" />
            <span>Pay with Wallet</span>
          </Button>
          <Button
            variant={paymentMethod === 'qr' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('qr')}
            className="h-auto p-4 flex flex-col gap-2"
          >
            <QrCode className="h-6 w-6" />
            <span>Manual Transfer</span>
          </Button>
        </div>

        {/* Wallet Payment */}
        {paymentMethod === 'wallet' && (
          <div className="space-y-4">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Click the button below to send the payment directly from your connected wallet.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleWalletPayment}
              disabled={!address || isProcessing || isFunded}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  {isSending ? 'Confirm in wallet...' : 'Processing...'}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay {settlement.requiredAmount} ETH
                </>
              )}
            </Button>
          </div>
        )}

        {/* Manual Transfer */}
        {paymentMethod === 'qr' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Network</p>
                <p className="text-sm font-semibold">Base Sepolia</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-1">Escrow Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-900 px-2 py-1 rounded flex-1 overflow-hidden">
                    {settlement.escrowAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-1">Amount</p>
                <p className="text-sm font-mono font-semibold">
                  {settlement.requiredAmount} ETH
                </p>
              </div>

              {settlement.paymentInstructions?.memo && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Memo</p>
                  <p className="text-sm">{settlement.paymentInstructions.memo}</p>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              {showQR ? 'Hide' : 'Show'} QR Code
            </Button>

            {showQR && (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG 
                    value={qrData}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Scan with your wallet app to send {settlement.requiredAmount} ETH
                </p>
              </div>
            )}
          </div>
        )}

        {/* Warnings */}
        {isOverdue && !isFunded && (
          <Alert className="border-red-500/50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              <strong>Payment Overdue!</strong> Failure to pay may result in:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Additional penalties and interest charges</li>
                <li>Automatic judgment enforcement</li>
                <li>Negative impact on future case eligibility</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Instructions */}
        <div className="text-sm text-gray-400 space-y-2">
          <p>• Payments are processed on the Base Sepolia network</p>
          <p>• Ensure you send the exact amount to avoid delays</p>
          <p>• Settlement will be distributed after full payment</p>
        </div>
      </CardContent>
    </Card>
  );
}