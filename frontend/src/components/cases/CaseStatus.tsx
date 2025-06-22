// src/components/cases/CaseStatus.tsx
import { Badge } from '@/components/ui/badge';
import { CaseStatus as CaseStatusType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { type VariantProps } from 'class-variance-authority';
import {
  FileText,
  Clock,
  Gavel,
  CheckCircle,
  XCircle,
  Scale,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface CaseStatusProps {
  status: CaseStatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function CaseStatus({ status, size = 'md', showIcon = false, className }: CaseStatusProps) {
  const getVariant = (status: CaseStatusType): VariantProps<typeof Badge>['variant'] => {
    switch (status) {
      case CaseStatusType.FILED:
        return 'warning';
      case CaseStatusType.UNDER_REVIEW:
      case CaseStatusType.PENDING_JUDGMENT:
        return 'info';
      case CaseStatusType.JUDGED:
        return 'secondary';
      case CaseStatusType.SETTLED:
        return 'success';
      case CaseStatusType.DISMISSED:
        return 'destructive';
      case CaseStatusType.UNDER_APPEAL:
        return 'outline';
      case CaseStatusType.APPEAL_DENIED:
        return 'destructive';
      case CaseStatusType.APPEAL_GRANTED:
      case CaseStatusType.APPEAL_GRANTED_MODIFIED:
        return 'success';
      case CaseStatusType.APPEAL_GRANTED_DISMISSED:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getIcon = (status: CaseStatusType) => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
    switch (status) {
      case CaseStatusType.FILED:
        return <FileText className={iconSize} />;
      case CaseStatusType.UNDER_REVIEW:
      case CaseStatusType.PENDING_JUDGMENT:
        return <Clock className={iconSize} />;
      case CaseStatusType.JUDGED:
        return <Gavel className={iconSize} />;
      case CaseStatusType.SETTLED:
        return <CheckCircle className={iconSize} />;
      case CaseStatusType.DISMISSED:
        return <XCircle className={iconSize} />;
      case CaseStatusType.UNDER_APPEAL:
        return <Scale className={iconSize} />;
      case CaseStatusType.APPEAL_DENIED:
        return <XCircle className={iconSize} />;
      case CaseStatusType.APPEAL_GRANTED:
      case CaseStatusType.APPEAL_GRANTED_MODIFIED:
        return <RefreshCw className={iconSize} />;
      case CaseStatusType.APPEAL_GRANTED_DISMISSED:
        return <AlertTriangle className={iconSize} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: CaseStatusType): string => {
    switch (status) {
      case CaseStatusType.FILED:
        return 'Filed';
      case CaseStatusType.UNDER_REVIEW:
        return 'Under Review';
      case CaseStatusType.PENDING_JUDGMENT:
        return 'Pending Judgment';
      case CaseStatusType.JUDGED:
        return 'Judged';
      case CaseStatusType.SETTLED:
        return 'Settled';
      case CaseStatusType.DISMISSED:
        return 'Dismissed';
      case CaseStatusType.UNDER_APPEAL:
        return 'Under Appeal';
      case CaseStatusType.APPEAL_DENIED:
        return 'Appeal Denied';
      case CaseStatusType.APPEAL_GRANTED:
        return 'Appeal Granted';
      case CaseStatusType.APPEAL_GRANTED_MODIFIED:
        return 'Modified on Appeal';
      case CaseStatusType.APPEAL_GRANTED_DISMISSED:
        return 'Dismissed on Appeal';
      default:
        return String(status).replace(/_/g, ' ');
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  const getCustomStyles = (status: CaseStatusType) => {
    // Custom background colors for specific statuses
    switch (status) {
      case CaseStatusType.UNDER_APPEAL:
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20';
      case CaseStatusType.APPEAL_GRANTED_MODIFIED:
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20';
      case CaseStatusType.APPEAL_GRANTED_DISMISSED:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20';
      default:
        return '';
    }
  };

  return (
    <Badge 
      variant={getVariant(status)}
      className={cn(
        sizeClasses[size],
        getCustomStyles(status),
        showIcon && 'flex items-center gap-1',
        className
      )}
    >
      {showIcon && getIcon(status)}
      {getStatusText(status)}
    </Badge>
  );
}