// src/app/cases/[caseId]/page.tsx (updated)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { CaseStatus } from '@/components/cases/CaseStatus';
import { JudgmentDisplay } from '@/components/judgment/JudgmentDisplay';
import { JudgmentRequest } from '@/components/judgment/JudgmentRequest';
import { SettlementStatus } from '@/components/settlement/SettlementStatus';
import { SettlementActions } from '@/components/settlement/SettlementActions';
import { EscrowDisplay } from '@/components/settlement/EscrowDisplay';
import { PayoutBreakdown } from '@/components/settlement/PayoutBreakdown';
import { Case } from '@/lib/types';
import { apiClient } from '@/lib/api/client';
import { Users, Building, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface PayoutItem {
  recipient: string;
  label: string;
  amount: string;
  percentage: number;
  icon: React.ReactNode;
  status: 'pending' | 'completed';
}

export default function CaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const caseId = params.caseId as string;

  const fetchCaseDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Case>(`/api/cases/${caseId}`);
      setCaseData(response);
      
      // Set active tab based on case status
      if (response.judgment) {
        setActiveTab('judgment');
      } else if (response.settlement) {
        setActiveTab('settlement');
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
      toast.error('Failed to load case details');
      router.push('/my-cases');
    } finally {
      setLoading(false);
    }
  }, [caseId, router]);

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId, fetchCaseDetails]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!caseData) {
    return null;
  }

  const isPlaintiff = address?.toLowerCase() === caseData.plaintiff.toLowerCase();
  const isDefendant = address?.toLowerCase() === caseData.defendant.toLowerCase();
  const isParty = isPlaintiff || isDefendant;

  const payouts: PayoutItem[] = caseData.judgment && caseData.settlement ? [
    {
      recipient: caseData.plaintiff,
      label: 'Plaintiff',
      amount: (parseFloat(caseData.judgment.awardedDamages) * 0.75).toFixed(3),
      percentage: 75,
      icon: <Users className="h-4 w-4" />,
      status: caseData.settlement.status === 'distributed' ? 'completed' : 'pending'
    },
    {
      recipient: '0xCourtTreasury',
      label: 'Court Treasury',
      amount: (parseFloat(caseData.judgment.awardedDamages) * 0.15).toFixed(3),
      percentage: 15,
      icon: <Building className="h-4 w-4" />,
      status: caseData.settlement.status === 'distributed' ? 'completed' : 'pending'
    },
    {
      recipient: '0xJuryPool',
      label: 'Jury Pool',
      amount: (parseFloat(caseData.judgment.awardedDamages) * 0.05).toFixed(3),
      percentage: 5,
      icon: <Users className="h-4 w-4" />,
      status: caseData.settlement.status === 'distributed' ? 'completed' : 'pending'
    },
    {
      recipient: '0xPrecedentFund',
      label: 'Precedent Fund',
      amount: (parseFloat(caseData.judgment.awardedDamages) * 0.05).toFixed(3),
      percentage: 5,
      icon: <FileText className="h-4 w-4" />,
      status: caseData.settlement.status === 'distributed' ? 'completed' : 'pending'
    }
  ] : [];

  return (
    <PageContainer>
      <PageHeader 
        title={`Case #${caseData.id}`}
        description={`${caseData.claimType.replace('_', ' ')} • Filed ${new Date(caseData.filedAt).toLocaleDateString()}`}
      >
        <CaseStatus status={caseData.status} size="lg" />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          {(caseData.judgment || caseData.status === 'filed') && (
            <TabsTrigger value="judgment">Judgment</TabsTrigger>
          )}
          {caseData.settlement && (
            <TabsTrigger value="settlement">Settlement</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Case overview content from previous implementation */}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-6">
          {/* Evidence display */}
        </TabsContent>

        <TabsContent value="judgment" className="space-y-6">
          {caseData.judgment ? (
            <JudgmentDisplay
              judgment={caseData.judgment}
              canAppeal={isParty}
              onAppeal={() => console.log('Appeal')}
            />
          ) : (
            <JudgmentRequest
              caseId={caseData.id}
              onSuccess={fetchCaseDetails}
            />
          )}
        </TabsContent>

        <TabsContent value="settlement" className="space-y-6">
          {caseData.settlement && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <SettlementStatus settlement={caseData.settlement} />
                <SettlementActions
                  settlement={caseData.settlement}
                  isDefendant={isDefendant}
                  onDeposit={async (amount) => {
                    // Handle deposit
                    console.log('Deposit', amount);
                  }}
                />
              </div>
              <div className="space-y-6">
                <EscrowDisplay
                  escrowAddress={caseData.settlement.escrowAddress}
                  balance={caseData.settlement.depositedAmount}
                  status={
                    caseData.settlement.status === 'funded' ? 'funded' :
                    parseFloat(caseData.settlement.depositedAmount || '0') > 0 ? 'partial' : 'empty'
                  }
                />
                <PayoutBreakdown
                  totalAmount={caseData.judgment?.awardedDamages || '0'}
                  payouts={payouts}
                  distributed={caseData.settlement.status === 'distributed'}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}