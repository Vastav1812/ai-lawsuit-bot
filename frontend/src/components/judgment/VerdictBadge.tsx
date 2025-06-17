// src/components/judgment/VerdictBadge.tsx
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerdictBadgeProps {
  verdict: 'guilty' | 'not_guilty';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function VerdictBadge({ 
  verdict, 
  size = 'md', 
  showIcon = true,
  className 
}: VerdictBadgeProps) {
  const isGuilty = verdict === 'guilty';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      variant={isGuilty ? "destructive" : "success"}
      className={cn(
        sizeClasses[size],
        "font-semibold",
        className
      )}
    >
      {showIcon && (
        isGuilty ? (
          <XCircle className={cn(iconSizes[size], "mr-1")} />
        ) : (
          <CheckCircle className={cn(iconSizes[size], "mr-1")} />
        )
      )}
      {isGuilty ? "GUILTY" : "NOT GUILTY"}
    </Badge>
  );
}