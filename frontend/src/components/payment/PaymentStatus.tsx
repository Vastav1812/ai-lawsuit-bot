// src/components/payment/PaymentStatus.tsx
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PaymentStatusType = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

interface PaymentStatusProps {
  status: PaymentStatusType;
  amount?: string;
  timestamp?: string;
  className?: string;
}

export function PaymentStatus({ status, amount, timestamp, className }: PaymentStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          label: 'Pending'
        };
      case 'processing':
        return {
          icon: AlertCircle,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          label: 'Processing'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          label: 'Completed'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          label: 'Failed'
        };
      case 'refunded':
        return {
          icon: AlertCircle,
          color: 'text-purple-400',
          bgColor: 'bg-purple-400/10',
          label: 'Refunded'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("p-2 rounded-lg", config.bgColor)}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("border-0", config.bgColor, config.color)}>
            {config.label}
          </Badge>
          {amount && (
            <span className="text-sm font-medium">{amount}</span>
          )}
        </div>
        {timestamp && (
          <p className="text-xs text-gray-400 mt-1">{timestamp}</p>
        )}
      </div>
    </div>
  );
}