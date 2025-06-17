// src/components/payment/FeeBreakdown.tsx
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FeeItem {
  label: string;
  amount: string;
  percentage?: number;
  tooltip?: string;
}

interface FeeBreakdownProps {
  fees: FeeItem[];
  total: string;
  className?: string;
}

export function FeeBreakdown({ fees, total, className }: FeeBreakdownProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        {fees.map((fee, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{fee.label}</span>
              {fee.tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{fee.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>{fee.amount}</span>
              {fee.percentage && (
                <span className="text-xs text-gray-500">({fee.percentage}%)</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold text-green-400">{total}</span>
        </div>
      </div>
    </div>
  );
}