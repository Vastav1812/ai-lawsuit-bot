// src/components/precedent/PrecedentCard.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Quote, 
  TrendingUp, 
  Lock,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { PriceDisplay } from '@/components/payment/PriceDisplay';
import { usePayment } from '@/hooks/usePayment';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PrecedentCardProps {
  precedent: {
    id: string;
    caseId: string;
    type: string;
    summary: string;
    verdict: 'guilty' | 'not_guilty';
    damages?: string;
    citationCount: number;
    relevanceScore?: number;
    date: string;
    accessFee: string;
    isLocked: boolean;
  };
  onUnlock?: (precedentId: string) => void;
  highlighted?: boolean;
  className?: string;
}

export function PrecedentCard({ 
  precedent, 
  onUnlock,
  highlighted = false,
  className 
}: PrecedentCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { executePayment } = usePayment();

  const handleViewFull = async () => {
    try {
      const response = await executePayment(
        `/api/precedents/full/${precedent.id}`,
        precedent.accessFee,
        undefined,
        'GET'
      );
      
      if (response) {
        toast.success('Precedent unlocked successfully');
        onUnlock?.(precedent.id);
      }
    } catch (error) {
      console.error('Failed to access precedent:', error);
    }
  };

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <>
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300",
        highlighted && "ring-2 ring-blue-500",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Case #{precedent.caseId}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {precedent.type.replace('_', ' ')}
                  </Badge>
                  <Badge 
                    variant={precedent.verdict === 'guilty' ? 'destructive' : 'success'}
                    className="text-xs"
                  >
                    {precedent.verdict === 'guilty' ? (
                      <XCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {precedent.verdict.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            
            {precedent.relevanceScore && (
              <div className="text-right">
                <p className={cn("text-2xl font-bold", getRelevanceColor(precedent.relevanceScore))}>
                  {precedent.relevanceScore}%
                </p>
                <p className="text-xs text-gray-400">relevance</p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-300 italic">&#x201C;{precedent.summary}&#x201D;</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Citations</span>
              </div>
              <p className="font-semibold">{precedent.citationCount}</p>
            </div>
            
            {precedent.damages && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Damages</span>
                </div>
                <p className="font-semibold">{precedent.damages} ETH</p>
              </div>
            )}
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Date</span>
              </div>
              <p className="font-semibold text-sm">
                {formatDistanceToNow(new Date(precedent.date), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Access Button */}
          <div className="pt-2">
            {precedent.isLocked ? (
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full"
                variant="outline"
              >
                <Lock className="mr-2 h-4 w-4" />
                Unlock Full Details
                <PriceDisplay 
                  amount={precedent.accessFee.replace('$', '')} 
                  size="sm" 
                  className="ml-auto" 
                />
              </Button>
            ) : (
              <Button 
                onClick={() => onUnlock?.(precedent.id)}
                className="w-full"
                variant="default"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Full Details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={precedent.accessFee}
        description={`Access full precedent for Case #${precedent.caseId}`}
        onConfirm={handleViewFull}
        endpoint={`/api/precedents/full/${precedent.id}`}
      />
    </>
  );
}