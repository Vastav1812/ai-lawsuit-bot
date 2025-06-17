// src/components/judgment/DamagesDisplay.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, Info } from 'lucide-react';
import { PriceDisplay } from '@/components/payment/PriceDisplay';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DamagesDisplayProps {
  requestedDamages: string;
  awardedDamages?: string;
  reasoning?: string;
  className?: string;
}

export function DamagesDisplay({
  requestedDamages,
  awardedDamages,
  reasoning,
  className
}: DamagesDisplayProps) {
  const requested = parseFloat(requestedDamages);
  const awarded = awardedDamages ? parseFloat(awardedDamages) : 0;
  const reductionPercentage = awardedDamages 
    ? Math.round((1 - awarded / requested) * 100)
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Damages Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Requested</p>
            <PriceDisplay amount={requestedDamages} currency="ETH" size="lg" />
          </div>
          
          {awardedDamages && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-green-400 mb-1">Awarded</p>
              <PriceDisplay amount={awardedDamages} currency="ETH" size="lg" />
            </div>
          )}
        </div>

        {awardedDamages && reductionPercentage > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-orange-400" />
            <span className="text-orange-400">
              {reductionPercentage}% reduction from requested amount
            </span>
            {reasoning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">{reasoning}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}