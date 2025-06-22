// src/components/judgment/PenaltyDisplay.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign,
  QrCode,
  Copy,
  CheckCircle
} from 'lucide-react';
import { Penalty } from '@/lib/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
// import { QRCodeSVG } from 'qrcode.react'; // TODO: Install qrcode.react package

interface PenaltyDisplayProps {
  penalty: Penalty;
  isPlaintiff: boolean;
  caseId: string;
}

export function PenaltyDisplay({ 
  penalty, 
  isPlaintiff,
  caseId
}: PenaltyDisplayProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(penalty.paymentAddress);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  const isPaid = penalty.status === 'paid' || penalty.isPaid;
  const isOverdue = penalty.deadlinePassed && !isPaid;

  return (
    <div className="space-y-6">
      <Alert className={cn(
        "border-orange-500/50",
        isOverdue && "border-red-500/50"
      )}>
        <AlertTriangle className={cn(
          "h-4 w-4",
          isOverdue ? "text-red-500" : "text-orange-500"
        )} />
        <AlertDescription>
          <strong>Penalty for Frivolous Lawsuit</strong>
          <p className="mt-1">
            {penalty.reason}
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Penalty Payment Required</CardTitle>
            <Badge variant={isPaid ? "success" : isOverdue ? "destructive" : "warning"}>
              {isPaid ? "PAID" : isOverdue ? "OVERDUE" : "PENDING"}
            </Badge>
          </div>
          <CardDescription>
            Case #{caseId} - Frivolous lawsuit penalty
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Due */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Penalty Amount</span>
              <DollarSign className="h-4 w-4 text-orange-400" />
            </div>
            <p className="text-3xl font-bold">{penalty.amount} ETH</p>
          </div>

          {/* Deadline */}
          {!isPaid && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className={cn(
                "h-4 w-4",
                isOverdue ? "text-red-400" : "text-gray-400"
              )} />
              <span className={isOverdue ? "text-red-400" : ""}>
                {isOverdue 
                  ? "Payment overdue!" 
                  : `Due in ${penalty.daysRemaining} days`}
              </span>
            </div>
          )}

          {/* Payment Instructions for Plaintiff */}
          {isPlaintiff && !isPaid && (
            <>
              <div className="space-y-4">
                <h4 className="font-semibold">Payment Instructions</h4>
                
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Network</p>
                    <p className="text-sm">Base Sepolia</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Payment Address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-900 px-2 py-1 rounded flex-1 overflow-hidden">
                        {penalty.paymentAddress}
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
                    <p className="text-sm font-mono">{penalty.amount} ETH</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowQR(!showQR)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {showQR ? 'Hide' : 'Show'} QR Code
                </Button>

                {/* TODO: Uncomment when qrcode.react is installed
                {showQR && penalty.qrCode && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={penalty.qrCode} size={200} />
                  </div>
                )}
                */}
              </div>

              <Alert className="border-red-500/50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription>
                  <strong>Important:</strong> Failure to pay this penalty may result in:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Additional penalties and interest</li>
                    <li>Restriction from filing future cases</li>
                    <li>Legal action for contempt of court</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Payment Distribution Info */}
          {penalty.distribution && (
            <div>
              <h4 className="font-semibold mb-3">Penalty Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Court Treasury (70%)</span>
                  <span>{penalty.distribution.courtTreasury} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Defendant Compensation (30%)</span>
                  <span>{penalty.distribution.defendantCompensation} ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Status for Paid Penalty */}
          {isPaid && (
            <Alert className="border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Penalty has been paid. Thank you for your compliance.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}