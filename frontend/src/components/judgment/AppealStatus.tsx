// src/components/judgment/AppealStatus.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Scale, 
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Appeal, AppealDecision } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface AppealStatusProps {
  appeal: Appeal;
  appealDecision?: AppealDecision;
  caseId: string;
  onProcessAppeal?: () => void;
}

export function AppealStatus({ 
  appeal, 
  appealDecision,
  caseId,
  onProcessAppeal 
}: AppealStatusProps) {
  const [processing, setProcessing] = useState(false);

  const handleProcessAppeal = async () => {
    setProcessing(true);
    try {
      await apiClient.post(`/api/cases-wallet/${caseId}/process-appeal`);
      toast.success('Appeal processed successfully');
      onProcessAppeal?.();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as ErrorResponse)?.response?.data?.error || 'Failed to process appeal'
        : 'Failed to process appeal';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const progressPercentage = appeal.hoursRemaining 
    ? Math.max(0, Math.min(100, ((48 - appeal.hoursRemaining) / 48) * 100))
    : 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Appeal Status
            </CardTitle>
            <Badge variant={appealDecision ? "default" : "secondary"}>
              {appealDecision ? 'DECIDED' : appeal.status.toUpperCase()}
            </Badge>
          </div>
          <CardDescription>
            Filed {formatDistanceToNow(new Date(appeal.filedAt), { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Appeal Progress */}
          {!appealDecision && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Review Progress</span>
                <span className="font-medium">
                  {appeal.hoursRemaining ? `${appeal.hoursRemaining}h remaining` : 'Ready'}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-gray-400">
                Appeals are reviewed by a higher AI court within 48 hours
              </p>
            </div>
          )}

          {/* Appeal Reason */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Appeal Grounds
            </h4>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm">{appeal.reason}</p>
            </div>
          </div>

          {/* Process Appeal Button */}
          {appeal.readyForReview && !appealDecision && (
            <Button 
              onClick={handleProcessAppeal}
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing Appeal...
                </>
              ) : (
                <>
                  <Scale className="mr-2 h-4 w-4" />
                  Process Appeal Now
                </>
              )}
            </Button>
          )}

          {/* Appeal Decision */}
          {appealDecision && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">Appeal Decision</span>
                  <Badge 
                    variant={
                      appealDecision.decision === 'upheld' ? 'destructive' : 
                      appealDecision.decision === 'overturned' ? 'success' : 
                      'default'
                    }
                  >
                    {appealDecision.decision.toUpperCase()}
                  </Badge>
                </div>
                
                {/* Decision Icon */}
                <div className="flex justify-center py-4">
                  {appealDecision.decision === 'upheld' ? (
                    <div className="p-3 bg-red-500/10 rounded-full">
                      <XCircle className="h-12 w-12 text-red-500" />
                    </div>
                  ) : (
                    <div className="p-3 bg-green-500/10 rounded-full">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-300 mt-4">
                  {appealDecision.reasoning}
                </p>

                {/* Key Findings */}
                {appealDecision.keyFindings && appealDecision.keyFindings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Key Findings:</p>
                    <ul className="space-y-1">
                      {appealDecision.keyFindings.map((finding, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-gray-500 mt-0.5">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* New Verdict/Damages */}
                {appealDecision.decision !== 'upheld' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                    {appealDecision.newVerdict && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">New Verdict</span>
                        <span className="font-medium">
                          {appealDecision.newVerdict.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                    {appealDecision.newAwardedDamages !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">New Damages</span>
                        <span className="font-medium">
                          {appealDecision.newAwardedDamages} ETH
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Costs */}
                {appealDecision.costsAwarded && appealDecision.costsAwarded !== 'none' && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Appeal costs awarded to {appealDecision.costsAwarded}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      {appealDecision && (
        <Alert>
          <Scale className="h-4 w-4" />
          <AlertDescription>
            {appealDecision.decision === 'upheld' 
              ? 'The original judgment stands. No further appeals are permitted.'
              : appealDecision.decision === 'overturned'
              ? 'The original judgment has been overturned. Case status will be updated accordingly.'
              : 'The judgment has been modified. Please review the new terms.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}