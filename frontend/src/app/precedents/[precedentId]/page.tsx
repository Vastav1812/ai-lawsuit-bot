// src/app/precedents/[precedentId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { PrecedentDetails } from '@/components/precedent/PrecedentDetails';
import { PrecedentPricing } from '@/components/precedent/PrecedentPricing';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface Precedent {
  id: string;
  caseId: string;
  type: string;
  filedDate: string;
  settledDate: string;
  plaintiff: string;
  defendant: string;
  verdict: 'guilty' | 'not_guilty';
  awardedDamages?: string;
  requestedDamages: string;
  summary: string;
  fullDetails: {
    facts: string;
    legalReasoning: string;
    precedentsCited: string[];
    keyPrinciples: string[];
    dissenting?: string;
  };
  citationCount: number;
  relatedCases: string[];
  accessFee: string;
  isLocked: boolean;
  relevanceScore?: number;
  date: string;
}

export default function PrecedentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { executePayment } = usePayment();
  
  const [precedent, setPrecedent] = useState<Precedent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const precedentId = params.precedentId as string;

  const fetchPrecedentDetails = useCallback(async () => {
    setLoading(true);
    try {
      const unlockedResponse: { hasAccess: boolean } = await apiClient.get(`/api/precedents/check-access/${precedentId}`);
      setIsUnlocked(unlockedResponse.hasAccess);
      
      const response: Precedent = await apiClient.get(`/api/precedents/${precedentId}`);
      setPrecedent(response);
    } catch (error) {
      console.error('Error fetching precedent:', error);
      toast.error('Failed to load precedent details');
      router.push('/precedents');
    } finally {
      setLoading(false);
    }
  }, [precedentId, router]);

  useEffect(() => {
    fetchPrecedentDetails();
  }, [precedentId, fetchPrecedentDetails]);

  const handleUnlock = async () => {
    try {
      const response: Precedent | null = await executePayment(
        `/api/precedents/full/${precedentId}`,
        precedent?.accessFee || '0',
        undefined,
        'GET'
      );
      
      if (response) {
        setIsUnlocked(true);
        setPrecedent(response);
        toast.success('Precedent unlocked successfully!');
      }
    } catch (error) {
      console.error('Failed to unlock precedent:', error);
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

  if (!precedent) {
    return null;
  }

  const citationBonus = precedent.citationCount > 50 ? 0.2 : 0;
  const ageInDays = Math.floor(
    (new Date().getTime() - new Date(precedent.settledDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  const timeDecay = ageInDays > 365 ? 0.2 : ageInDays > 180 ? 0.1 : 0;

  return (
    <PageContainer>
      <PageHeader 
        title={`Precedent: Case #${precedent.caseId}`}
        description={precedent.type.replace('_', ' ')}
      >
        <Button variant="outline" onClick={() => router.push('/precedents')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isUnlocked ? (
            <PrecedentDetails precedent={precedent} />
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Unlock to view full case details and legal analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm">{precedent.summary}</p>
                    </div>
                    <div className="text-center py-8">
                      <Lock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">
                        Full precedent details are locked
                      </p>
                      <Button onClick={() => setShowPaymentModal(true)}>
                        Unlock Full Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div>
          <PrecedentPricing
            basePrice={precedent.accessFee}
            citationBonus={citationBonus}
            timeDecay={timeDecay}
            isUnlocked={isUnlocked}
            isPremium={precedent.citationCount > 100}
          />
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={precedent.accessFee}
        description={`Unlock full precedent for Case #${precedent.caseId}`}
        onConfirm={handleUnlock}
        endpoint={`/api/precedents/full/${precedentId}`}
      />
    </PageContainer>
  );
}