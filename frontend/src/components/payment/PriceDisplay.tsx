// src/components/payment/PriceDisplay.tsx
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  amount: string | number;
  currency?: 'USD' | 'ETH';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
}

export function PriceDisplay({
  amount,
  currency = 'USD',
  size = 'md',
  showIcon = true,
  className
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showIcon && currency === 'USD' && (
        <span className={cn("text-green-400", sizeClasses[size])}>$</span>
      )}
      <span className={cn("font-bold", sizeClasses[size])}>
        {amount}
      </span>
      {currency === 'ETH' && (
        <span className={cn("text-gray-400", sizeClasses[size])}>ETH</span>
      )}
    </div>
  );
}