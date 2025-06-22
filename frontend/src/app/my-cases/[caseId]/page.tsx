// src/app/my-cases/[caseId]/page.tsx
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
import { AppealModal } from '@/components/judgment/AppealModal';
import { AppealStatus } from '@/components/judgment/AppealStatus';
import { PenaltyDisplay } from '@/components/judgment/PenaltyDisplay';
import { DefendantPayment } from '@/components/settlement/DefendantPayment';
import { Case, Settlement } from '@/lib/types';
import { apiClient } from '@/lib/api/client';
import { useAppealCase } from '@/hooks/useCases';
import { Users, Building, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PayoutItem {
  recipient: string;
  label: string;
  amount: string;
  percentage: number;
  icon: React.ReactNode;
  status: 'pending' | 'completed';
}

interface CaseResponse {
  success: boolean;
  case: Case;
}

export default function CaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAppealModal, setShowAppealModal] = useState(false);
  
  const { appealCase, loading: appealLoading } = useAppealCase();

  const caseId = params.caseId as string;

  const fetchCaseDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<CaseResponse>(`/api/cases-wallet/${caseId}`);
      
      if (response.success && response.case) {
        const caseData = response.case;
        setCaseData(caseData);
        
        // If there's a judgment with guilty verdict, fetch settlement info
        if (caseData.judgment && caseData.judgment.verdict === 'guilty' && !caseData.settlement) {
          try {
            const settlementResponse = await apiClient.get(`/api/cases-wallet/${caseId}/settlement`);
            if (settlementResponse && typeof settlementResponse === 'object' && 'settlement' in settlementResponse) {
              setCaseData({
                ...caseData,
                settlement: (settlementResponse as { settlement: Settlement }).settlement
              });
            }
          } catch {
            console.log('No settlement found yet');
          }
        }
        
        // Set active tab based on case status and content
        if (caseData.penalty) {
          setActiveTab('penalty');
        } else if (caseData.appeal) {
          setActiveTab('appeal');
        } else if (caseData.settlement || (caseData.judgment && caseData.judgment.verdict === 'guilty')) {
          setActiveTab('settlement');
        } else if (caseData.judgment) {
          setActiveTab('judgment');
        }
      } else {
        throw new Error('Invalid response format');
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

  const handleAppeal = async (reason: string) => {
    try {
      const result = await appealCase(caseId, reason);
      
      if (result) {
        toast.success('Appeal filed successfully!');
        setShowAppealModal(false);
        await fetchCaseDetails();
      }
    } catch (error) {
      console.error('Appeal error:', error);
      toast.error('Failed to file appeal');
      throw error;
    }
  };

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

  const isPlaintiff = address?.toLowerCase() === caseData.plaintiff?.toLowerCase();
  const isDefendant = address?.toLowerCase() === caseData.defendant?.toLowerCase();
  const isParty = isPlaintiff || isDefendant;

  const payouts: PayoutItem[] = caseData.judgment && caseData.settlement ? [
    {
      recipient: caseData.plaintiff,
      label: 'Plaintiff',
      amount: (parseFloat(caseData.judgment.awardedDamages.toString()) * 0.75).toFixed(3),
      percentage: 75,
      icon: <Users className="h-4 w-4" />,
      status: caseData.settlement.status === 'distributed' ? 'completed' : 'pending'
    },
    {
      recipient: '0xCourtTreasury',
      label: 'Court Treasury',
      amount: (parseFloat(caseData.judgment.awardedDamages.toString()) * 0.15).toFixed(3),
      percentage: 15,
      icon: <Building className="h-4 w-4" />,
      status: caseData.settlement.status === 'distributed' ? 'completed' : 'pending'
    },
    {
      recipient: '0xJuryPool',
      label: 'Jury Pool',
      amount: (parseFloat(caseData.judgment.awardedDamages.toString()) * 0.05).toFixed(3),
      percentage: 5,
      icon: <Users className="h-4 w-4" />,
      status: caseData.settlement.status === 'distributed' ? 'completed' : 'pending'
    },
    {
      recipient: '0xPrecedentFund',
      label: 'Precedent Fund',
      amount: (parseFloat(caseData.judgment.awardedDamages.toString()) * 0.05).toFixed(3),
      percentage: 5,
      icon: <FileText className="h-4 w-4" />,
      status: caseData.settlement.status === 'distributed' ? 'completed' : 'pending'
    }
  ] : [];

  const canAppeal = isParty && 
    caseData.status === 'judged' && 
    !caseData.appealed &&
    caseData.judgment?.verdict !== 'dismissed_frivolous';

  return (
    <PageContainer>
      <PageHeader 
        title={`Case #${caseData.id}`}
        description={`${caseData.claimType.replace('_', ' ')} • Filed ${(() => {
          try {
            return new Date(caseData.filedAt).toLocaleDateString();
          } catch {
            return 'Unknown date';
          }
        })()}`}
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
          {(caseData.settlement || (caseData.judgment && caseData.judgment.verdict === 'guilty')) && (
            <TabsTrigger value="settlement">
              Settlement
              {isDefendant && caseData.judgment?.verdict === 'guilty' && (
                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                  Payment Required
                </span>
              )}
            </TabsTrigger>
          )}
          {caseData.penalty && (
            <TabsTrigger value="penalty" className="text-orange-400">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Penalty
            </TabsTrigger>
          )}
          {caseData.appeal && (
            <TabsTrigger value="appeal">Appeal</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Case Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-400">Plaintiff</dt>
                  <dd className="text-sm font-mono">{caseData.plaintiff}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">Defendant</dt>
                  <dd className="text-sm font-mono">{caseData.defendant}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">Claim Type</dt>
                  <dd className="text-sm">{caseData.claimType.replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">Requested Damages</dt>
                  <dd className="text-sm">{caseData.requestedDamages} ETH</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">Status</dt>
                  <dd className="text-sm">
                    <CaseStatus status={caseData.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">Case Wallet</dt>
                  <dd className="text-sm font-mono">{caseData.caseWalletAddress}</dd>
                </div>
              </dl>
            </div>

            {/* Evidence Quality Summary */}
            {caseData.judgment && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Evidence Assessment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-400">Quality Rating</dt>
                    <dd className="text-sm font-semibold capitalize">
                      {caseData.judgment.evidenceQuality || 'Not assessed'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Evidence Score</dt>
                    <dd className="text-sm">
                      {caseData.judgment.evidenceScore !== undefined 
                        ? `${caseData.judgment.evidenceScore}/100`
                        : 'N/A'}
                    </dd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Evidence Submitted</h3>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{caseData.evidence}</p>
          </div>
        </TabsContent>

        <TabsContent value="judgment" className="space-y-6">
          {caseData.judgment ? (
            <JudgmentDisplay
              judgment={caseData.judgment}
              canAppeal={canAppeal}
              onAppeal={() => setShowAppealModal(true)}
            />
          ) : (
            <JudgmentRequest
              caseId={caseData.id}
              onSuccess={fetchCaseDetails}
            />
          )}
        </TabsContent>

        <TabsContent value="settlement" className="space-y-6">
          {caseData.settlement && caseData.judgment && (
            <div className="space-y-6">
              {/* Show payment UI for guilty defendant */}
              {isDefendant && caseData.judgment.verdict === 'guilty' && 
               caseData.settlement.status === 'pending_payment' && (
                <DefendantPayment
                  settlement={caseData.settlement}
                  caseId={caseData.id}
                />
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <SettlementStatus settlement={caseData.settlement} />
                  <SettlementActions
                    settlement={caseData.settlement}
                    isDefendant={isDefendant}
                    onDeposit={async (amount) => {
                      console.log('Deposit requested:', amount);
                      // This will be handled by the DefendantPayment component
                      // The SettlementActions is just for UI display
                      toast('Please use the payment section above to make your deposit');
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
                    totalAmount={caseData.judgment.awardedDamages.toString()}
                    payouts={payouts}
                    distributed={caseData.settlement.status === 'distributed'}
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="penalty" className="space-y-6">
          {caseData.penalty && (
            <PenaltyDisplay
              penalty={caseData.penalty}
              isPlaintiff={isPlaintiff}
              caseId={caseData.id}
            />
          )}
        </TabsContent>

        <TabsContent value="appeal" className="space-y-6">
          {caseData.appeal && (
            <AppealStatus
              appeal={caseData.appeal}
              appealDecision={caseData.appealDecision}
              caseId={caseData.id}
              onProcessAppeal={fetchCaseDetails}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Appeal Modal */}
      <AppealModal
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        onSubmit={handleAppeal}
        loading={appealLoading}
      />
    </PageContainer>
  );
}