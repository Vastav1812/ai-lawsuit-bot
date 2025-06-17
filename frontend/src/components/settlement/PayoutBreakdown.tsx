// src/components/settlement/PayoutBreakdown.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Scale,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayoutItem {
  recipient: string;
  label: string;
  amount: string;
  percentage: number;
  icon: React.ReactNode;
  status?: 'pending' | 'completed';
}

interface PayoutBreakdownProps {
  totalAmount: string;
  payouts: PayoutItem[];
  distributed?: boolean;
  className?: string;
}

export function PayoutBreakdown({
  totalAmount,
  payouts,
  distributed = false,
  className
}: PayoutBreakdownProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Distribution Breakdown
          </CardTitle>
          {distributed && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Distributed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Amount */}
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">Total Settlement</p>
          <p className="text-3xl font-bold">{totalAmount} ETH</p>
        </div>

        {/* Distribution Flow */}
        <div className="space-y-3">
          {payouts.map((payout, index) => (
            <div key={index} className="relative">
              {index < payouts.length - 1 && (
                <div className="absolute left-6 top-12 h-8 w-0.5 bg-gray-700" />
              )}
              
              <div className={cn(
                "rounded-lg p-4 border transition-colors",
                distributed && payout.status === 'completed'
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-gray-800 border-gray-700"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    distributed && payout.status === 'completed'
                      ? "bg-green-500/20"
                      : "bg-gray-700"
                  )}>
                    {payout.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{payout.label}</p>
                      <p className="font-semibold">{payout.amount} ETH</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={distributed && payout.status === 'completed' ? 100 : 0} 
                        className="h-1.5 flex-1" 
                      />
                      <span className="text-xs text-gray-400">
                        {payout.percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {payout.recipient.slice(0, 8)}...{payout.recipient.slice(-6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}