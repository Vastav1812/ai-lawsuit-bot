// src/components/settlement/SettlementActions.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  AlertCircle,
  Info
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { Settlement } from '@/lib/types';

interface SettlementActionsProps {
  settlement: Settlement;
  isDefendant: boolean;
  onDeposit?: (amount: string) => Promise<void>;
  onWithdraw?: () => Promise<void>;
  className?: string;
}

export function SettlementActions({
  settlement,
  isDefendant,
  onDeposit,
  onWithdraw,
  className
}: SettlementActionsProps) {
  const { address } = useAccount();
  const [depositAmount, setDepositAmount] = useState(settlement.requiredAmount);
  const [loading, setLoading] = useState(false);

  const remainingAmount = parseFloat(settlement.requiredAmount) - parseFloat(settlement.depositedAmount || '0');
  const canDeposit = isDefendant && settlement.status === 'pending_payment' && remainingAmount > 0;
  const canWithdraw = !isDefendant && settlement.status === 'expired' && parseFloat(settlement.depositedAmount || '0') > 0;

  const handleDeposit = async () => {
    if (!onDeposit) return;
    
    setLoading(true);
    try {
      await onDeposit(depositAmount);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;
    
    setLoading(true);
    try {
      await onWithdraw();
    } finally {
      setLoading(false);
    }
  };

  if (!canDeposit && !canWithdraw) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Settlement Actions</CardTitle>
        <CardDescription>
          {canDeposit ? 'Deposit funds to settle the case' : 'Withdraw expired settlement funds'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canDeposit && (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You must deposit {remainingAmount} ETH to settle this case. 
                Funds will be automatically distributed according to the judgment.
              </AlertDescription>
            </Alert>

            <div>
              <label className="block text-sm font-medium mb-2">
                Deposit Amount (ETH)
              </label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min={remainingAmount}
                step="0.01"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleDeposit}
              disabled={!address || loading || parseFloat(depositAmount) < remainingAmount}
              loading={loading}
              className="w-full"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              Deposit {depositAmount} ETH
            </Button>
          </>
        )}

        {canWithdraw && (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The settlement period has expired. You can withdraw the deposited funds.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Available to Withdraw</p>
              <p className="text-2xl font-bold">{settlement.depositedAmount} ETH</p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={!address || loading}
              loading={loading}
              className="w-full"
              size="lg"
              variant="outline"
            >
              Withdraw Funds
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}