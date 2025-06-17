// src/components/cases/CaseCard.tsx
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Gavel } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Case, CaseStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { type VariantProps } from 'class-variance-authority';

interface CaseCardProps {
  case: Case;
  onViewDetails: () => void;
  onRequestJudgment?: () => void;
  showActions?: boolean;
  className?: string;
}

export function CaseCard({ 
  case: caseData, 
  onViewDetails, 
  onRequestJudgment,
  showActions = true,
  className 
}: CaseCardProps) {
  const getStatusIcon = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.FILED:
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case CaseStatus.UNDER_REVIEW:
        return <AlertCircle className="h-5 w-5 text-blue-400" />;
      case CaseStatus.JUDGED:
        return <Gavel className="h-5 w-5 text-purple-400" />;
      case CaseStatus.SETTLED:
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case CaseStatus.DISMISSED:
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: CaseStatus): VariantProps<typeof Badge>['variant'] => {
    switch (status) {
      case CaseStatus.FILED:
        return 'warning';
      case CaseStatus.UNDER_REVIEW:
        return 'info';
      case CaseStatus.JUDGED:
        return 'secondary';
      case CaseStatus.SETTLED:
        return 'success';
      case CaseStatus.DISMISSED:
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-gray-800 rounded-lg">
              {getStatusIcon(caseData.status)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Case #{caseData.id}</h3>
              <p className="text-sm text-gray-400">
                Filed {formatDistanceToNow(new Date(caseData.filedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge variant={getStatusColor(caseData.status)}>
            {caseData.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-400">Type</p>
            <p className="font-medium">{caseData.claimType.replace('_', ' ')}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400">Defendant</p>
            <p className="font-mono text-sm">
              {caseData.defendant.slice(0, 6)}...{caseData.defendant.slice(-4)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Requested Damages</p>
              <p className="font-semibold text-lg">{caseData.requestedDamages} ETH</p>
            </div>
            {caseData.judgment && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Awarded</p>
                <p className="font-semibold text-lg text-green-400">
                  {caseData.judgment.awardedDamages} ETH
                </p>
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-6">
            <Button 
              onClick={onViewDetails}
              variant="outline" 
              className="flex-1"
            >
              View Details
            </Button>
            {caseData.status === CaseStatus.FILED && onRequestJudgment && (
              <Button 
                onClick={onRequestJudgment}
                className="flex-1"
              >
                <Gavel className="mr-2 h-4 w-4" />
                Request Judgment ($5)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}