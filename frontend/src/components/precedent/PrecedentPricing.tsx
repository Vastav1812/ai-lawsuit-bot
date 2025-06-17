// src/components/precedent/PrecedentPricing.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Info,
  Lock,
  Unlock,
  Star
} from 'lucide-react';
import { PriceDisplay } from '@/components/payment/PriceDisplay';
import { cn } from '@/lib/utils';

interface PrecedentPricingProps {
  basePrice: string;
  citationBonus?: number;
  timeDecay?: number;
  bulkDiscount?: number;
  isUnlocked?: boolean;
  isPremium?: boolean;
  className?: string;
}

export function PrecedentPricing({
  basePrice,
  citationBonus = 0,
  timeDecay = 0,
  bulkDiscount = 0,
  isUnlocked = false,
  isPremium = false,
  className
}: PrecedentPricingProps) {
  const basePriceNum = parseFloat(basePrice.replace('$', ''));
  const finalPrice = basePriceNum * (1 + citationBonus) * (1 - timeDecay) * (1 - bulkDiscount);
  const savings = basePriceNum - finalPrice;

  return (
    <Card className={cn(
      "overflow-hidden",
      isPremium && "border-yellow-500/50",
      className
    )}>
      {isPremium && (
        <div className="bg-yellow-500/10 px-4 py-2 border-b border-yellow-500/20">
          <div className="flex items-center gap-2 text-yellow-500">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Premium Precedent</span>
          </div>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isUnlocked ? (
            <>
              <Unlock className="h-5 w-5 text-green-400" />
              Unlocked
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              Access Pricing
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isUnlocked 
            ? "You have full access to this precedent" 
            : "One-time payment for permanent access"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isUnlocked && (
          <>
            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Base Price</span>
                <span className="font-medium">${basePriceNum.toFixed(2)}</span>
              </div>
              
              {citationBonus > 0 && (
                <div className="flex items-center justify-between text-yellow-400">
                  <span className="text-sm flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    High Citation Bonus
                  </span>
                  <span className="text-sm">+{(citationBonus * 100).toFixed(0)}%</span>
                </div>
              )}
              
              {timeDecay > 0 && (
                <div className="flex items-center justify-between text-green-400">
                  <span className="text-sm">Age Discount</span>
                  <span className="text-sm">-{(timeDecay * 100).toFixed(0)}%</span>
                </div>
              )}
              
              {bulkDiscount > 0 && (
                <div className="flex items-center justify-between text-blue-400">
                  <span className="text-sm">Bulk Discount</span>
                  <span className="text-sm">-{(bulkDiscount * 100).toFixed(0)}%</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Final Price</span>
                  <PriceDisplay amount={finalPrice.toFixed(2)} size="lg" />
                </div>
                {savings > 0.01 && (
                  <p className="text-xs text-green-400 text-right mt-1">
                    You save ${savings.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Precedent access includes full case details, legal reasoning, and all supporting documents. 
                Access is permanent and can be referenced unlimited times.
              </AlertDescription>
            </Alert>
          </>
        )}
        
        {isUnlocked && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-green-400">
              <Unlock className="h-5 w-5" />
              <span className="font-medium">Full Access Granted</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              You can view this precedent anytime
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}