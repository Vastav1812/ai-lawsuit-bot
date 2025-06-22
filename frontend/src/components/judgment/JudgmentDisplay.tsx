// src/components/judgment/JudgmentDisplay.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Gavel, 
  CheckCircle, 
  XCircle, 
  FileText,
  DollarSign,
  Scale,
  AlertCircle
} from 'lucide-react';
import { Judgment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface JudgmentDisplayProps {
  judgment: Judgment;
  onAppeal?: () => void;
  canAppeal?: boolean;
  className?: string;
}

export function JudgmentDisplay({
  judgment,
  onAppeal,
  canAppeal = false,
  className
}: JudgmentDisplayProps) {
  const isGuilty = judgment.verdict === 'guilty';

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className={cn(
        "h-2",
        isGuilty ? "bg-red-500" : "bg-green-500"
      )} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            AI Judgment
          </CardTitle>
          <Badge variant={isGuilty ? "destructive" : "success"} className="text-base px-4 py-1">
            {isGuilty ? "GUILTY" : "NOT GUILTY"}
          </Badge>
        </div>
        <CardDescription>
          Rendered {formatDistanceToNow(new Date(judgment.judgmentDate || Date.now()), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict Icon */}
        <div className="flex justify-center py-4">
          {isGuilty ? (
            <div className="p-4 bg-red-500/10 rounded-full">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
          ) : (
            <div className="p-4 bg-green-500/10 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          )}
        </div>

        {/* Damages */}
        {isGuilty && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Awarded Damages</span>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{judgment.awardedDamages} ETH</p>
          </div>
        )}

        {/* Reasoning */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Legal Reasoning
          </h4>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm leading-relaxed">{judgment.reasoning}</p>
          </div>
        </div>

        {/* Precedent Citations */}
        {judgment.precedentCitations && judgment.precedentCitations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Precedent Citations
            </h4>
            <div className="space-y-2">
              {judgment.precedentCitations.map((citation, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">#{index + 1}</span>
                  <span className="text-blue-400 hover:underline cursor-pointer">
                    {citation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appeal Option */}
        {canAppeal && (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have 7 days to appeal this judgment. Appeal fee: $25.00
              </AlertDescription>
            </Alert>
            <Button onClick={onAppeal} variant="outline" className="w-full">
              <Scale className="mr-2 h-4 w-4" />
              File Appeal ($25)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}