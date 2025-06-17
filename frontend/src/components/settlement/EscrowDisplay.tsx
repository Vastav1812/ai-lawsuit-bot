// src/components/settlement/EscrowDisplay.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Copy, 
  ExternalLink,
  Shield,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface EscrowDisplayProps {
  escrowAddress: string;
  balance?: string;
  status?: 'empty' | 'partial' | 'funded';
  network?: string;
  className?: string;
}

export function EscrowDisplay({
  escrowAddress,
  balance = '0',
  status = 'empty',
  network = 'base-sepolia',
  className
}: EscrowDisplayProps) {
  const copyAddress = () => {
    navigator.clipboard.writeText(escrowAddress);
    toast.success('Address copied to clipboard');
  };

  const getExplorerUrl = () => {
    const explorers: Record<string, string> = {
      'base-sepolia': 'https://sepolia.basescan.org',
      'base': 'https://basescan.org'
    };
    return `${explorers[network]}/address/${escrowAddress}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'empty':
        return 'text-gray-400';
      case 'partial':
        return 'text-yellow-400';
      case 'funded':
        return 'text-green-400';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Escrow Wallet
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Secure
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Contract Address</p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono flex-1 truncate">
              {escrowAddress}
            </code>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyAddress}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => window.open(getExplorerUrl(), '_blank')}
              className="h-8 w-8"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Current Balance</span>
          <span className={cn("text-lg font-semibold", getStatusColor())}>
            {balance} ETH
          </span>
        </div>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This escrow wallet is managed by a smart contract. Funds can only be 
            released according to the judgment terms.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}