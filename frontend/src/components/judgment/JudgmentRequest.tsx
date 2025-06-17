// src/components/judgment/JudgmentRequest.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gavel, Info, Clock, DollarSign } from 'lucide-react';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { useRequestJudgment } from '@/hooks/useCases';

interface JudgmentRequestProps {
  caseId: string;
  onSuccess?: () => void;
  className?: string;
}

export function JudgmentRequest({ caseId, onSuccess, className }: JudgmentRequestProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { requestJudgment, loading } = useRequestJudgment();

  const handleRequestJudgment = async () => {
    const result = await requestJudgment(caseId);
    if (result) {
      onSuccess?.();
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Request AI Judgment
          </CardTitle>
          <CardDescription>
            Let our AI judge analyze your case and render a verdict
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Processing Time</p>
                <p className="text-sm text-gray-400">Usually within 5 minutes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Judgment Fee</p>
                <p className="text-sm text-gray-400">$5.00 one-time payment</p>
              </div>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The AI judge will analyze all evidence and render an impartial verdict based on 
              established precedents and legal principles.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => setShowPaymentModal(true)}
            className="w-full"
            size="lg"
            disabled={loading}
          >
            <Gavel className="mr-2 h-4 w-4" />
            Request Judgment ($5)
          </Button>
        </CardContent>
      </Card>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount="$5.00"
        description="AI Judgment Service"
        onConfirm={handleRequestJudgment}
        endpoint={`/api/cases/${caseId}/judge`}
      />
    </>
  );
}