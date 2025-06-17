// src/app/file-case/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentConfirmation } from '@/components/payment/PaymentConfirmation';
import { ClaimType } from '@/lib/types';
import { useFileCase } from '@/hooks/useCases';
import { Button } from '@/components/ui/button';

export default function FileCasePage() {
  const router = useRouter();
  const { address } = useAccount();
  const { fileCase, loading } = useFileCase();
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [formData, setFormData] = useState({
    defendant: '',
    claimType: ClaimType.API_FRAUD,
    evidence: '',
    requestedDamages: '0.1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentConfirm = async () => {
    const result = await fileCase(formData);
    if (result && result.success) {
      router.push(`/cases/${result.caseId}`);
    }
  };

  const handlePaymentCancel = () => {
    setStep('form');
  };

  return (
    <PageContainer>
      <PageHeader 
        title="File a New Case"
        description="Submit a grievance against an AI agent"
      />

      <div className="max-w-2xl mx-auto">
        {step === 'form' ? (
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
              <CardDescription>
                Provide information about your dispute
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Defendant Address
                  </label>
                  <Input
                    type="text"
                    value={formData.defendant}
                    onChange={(e) => setFormData({...formData, defendant: e.target.value})}
                    placeholder="0x..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Claim Type
                  </label>
                  <Select
                    value={formData.claimType}
                    onValueChange={(value) => setFormData({...formData, claimType: value as ClaimType})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ClaimType.API_FRAUD}>API Fraud</SelectItem>
                      <SelectItem value={ClaimType.DATA_THEFT}>Data Theft</SelectItem>
                      <SelectItem value={ClaimType.SERVICE_MANIPULATION}>Service Manipulation</SelectItem>
                      <SelectItem value={ClaimType.TOKEN_FRAUD}>Token Fraud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Evidence
                  </label>
                  <Textarea
                    value={formData.evidence}
                   onChange={(e) => setFormData({...formData, evidence: e.target.value})}
                   placeholder="Provide detailed evidence supporting your claim..."
                   rows={6}
                   required
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2">
                   Requested Damages (ETH)
                 </label>
                 <Input
                   type="number"
                   value={formData.requestedDamages}
                   onChange={(e) => setFormData({...formData, requestedDamages: e.target.value})}
                   min="0.01"
                   step="0.01"
                   required
                 />
               </div>

               <Button
                 type="submit"
                 disabled={!address || loading}
                 className="w-full"
                 size="lg"
               >
                 Continue to Payment
               </Button>

               {!address && (
                 <p className="text-sm text-center text-gray-400">
                   Please connect your wallet to file a case
                 </p>
               )}
             </form>
           </CardContent>
         </Card>
       ) : (
         <PaymentConfirmation
           title="Confirm Case Filing"
           description="Review your case details and confirm payment"
           amount="$10.00"
           fees={[
             {
               label: "Filing Fee",
               amount: "$8.00",
               percentage: 80,
               tooltip: "Base fee for case processing"
             },
             {
               label: "Court Treasury",
               amount: "$1.50",
               percentage: 15,
               tooltip: "Funds court operations"
             },
             {
               label: "Jury Pool",
               amount: "$0.50",
               percentage: 5,
               tooltip: "Rewards for jury participants"
             }
           ]}
           onConfirm={handlePaymentConfirm}
           onCancel={handlePaymentCancel}
         />
       )}
     </div>
   </PageContainer>
 );
}