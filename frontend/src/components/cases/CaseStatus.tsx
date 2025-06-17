// src/components/cases/CaseStatus.tsx
import { Badge } from '@/components/ui/badge';
import { CaseStatus as CaseStatusType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { type VariantProps } from 'class-variance-authority';

interface CaseStatusProps {
  status: CaseStatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function CaseStatus({ status, size = 'md', className }: CaseStatusProps) {
  const getVariant = (status: CaseStatusType): VariantProps<typeof Badge>['variant'] => {
    switch (status) {
      case CaseStatusType.FILED:
        return 'warning';
      case CaseStatusType.UNDER_REVIEW:
        return 'info';
      case CaseStatusType.JUDGED:
        return 'secondary';
      case CaseStatusType.SETTLED:
        return 'success';
      case CaseStatusType.DISMISSED:
        return 'destructive';
      case CaseStatusType.APPEALED:
        return 'outline';
      default:
        return 'default';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  return (
    <Badge 
      variant={getVariant(status)}
      className={cn(sizeClasses[size], className)}
    >
      {status.replace('_', ' ')}
    </Badge>
  );
}