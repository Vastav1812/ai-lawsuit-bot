// src/components/settlement/SettlementStatus.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Wallet,
  Copy
} from 'lucide-react';
import { Settlement } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SettlementStatusProps {
  settlement: Settlement & { paymentDeadline?: string };
  className?: string;
}

export function SettlementStatus({ settlement, className }: SettlementStatusProps) {
  const deposited = parseFloat(settlement.depositedAmount || '0');
  const required = parseFloat(settlement.requiredAmount);
  const progress = (deposited / required) * 100;
  const isFunded = settlement.status === 'funded' || settlement.status === 'distributed';
  
  // Handle both deadline and paymentDeadline fields from backend
  const deadlineString = settlement.paymentDeadline || settlement.deadline;
  const deadline = deadlineString ? new Date(deadlineString) : new Date();
  const isOverdue = deadline < new Date() && !isFunded;

  const getStatusColor = () => {
    switch (settlement.status) {
      case 'pending_payment':
        return 'warning';
      case 'funded':
        return 'info';
      case 'distributed':
        return 'success';
      case 'expired':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  const getStatusIcon = () => {
    switch (settlement.status) {
      case 'pending_payment':
        return <Clock className="h-4 w-4" />;
      case 'funded':
        return <Wallet className="h-4 w-4" />;
      case 'distributed':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Settlement Status
          </CardTitle>
          <Badge variant={getStatusColor() as 'warning' | 'info' | 'success' | 'destructive' | 'default'} className="flex items-center gap-1">
            {getStatusIcon()}
            {settlement.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Funding Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Funding Progress</span>
            <span className="font-medium">
              {deposited} / {required} ETH
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-gray-400 mt-1">
            {progress.toFixed(1)}% funded
          </p>
        </div>
    
        {/* Escrow Address */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Escrow Address</p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">
              {settlement.escrowAddress}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(settlement.escrowAddress)}
              className="text-gray-400 hover:text-white"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
    
        {/* Deadline */}
        {settlement.status === 'pending_payment' && (
          <div className={cn(
            "rounded-lg p-3",
            isOverdue ? "bg-red-500/10 border border-red-500/20" : "bg-gray-800"
          )}>
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "h-4 w-4",
                isOverdue ? "text-red-400" : "text-gray-400"
              )} />
              <span className="text-sm">
                {isOverdue ? (
                  <span className="text-red-400">Overdue</span>
                ) : (
                  <>
                    Deadline: {formatDistanceToNow(deadline, { addSuffix: true })}
                  </>
                )}
              </span>
            </div>
          </div>
        )}
    
        {/* Distribution Status */}
        {settlement.status === 'distributed' && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Settlement distributed successfully
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}