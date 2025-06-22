// src/app/file-case/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentConfirmation } from '@/components/payment/PaymentConfirmation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClaimType } from '@/lib/types';
import { useFileCase } from '@/hooks/useCases';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Info, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FileCasePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { fileCase, loading } = useFileCase();
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [formData, setFormData] = useState({
    defendant: '',
    claimType: ClaimType.API_FRAUD,
    evidence: '',
    requestedDamages: '0.1',
    evidenceFiles: [] as File[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if wallet disconnected
  useEffect(() => {
    if (!isConnected && step === 'payment') {
      setStep('form');
      toast.error('Please connect your wallet');
    }
  }, [isConnected, step]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.defendant || !formData.defendant.startsWith('0x') || formData.defendant.length !== 42) {
      newErrors.defendant = 'Valid Ethereum address required (42 characters starting with 0x)';
    }

    if (formData.defendant.toLowerCase() === address?.toLowerCase()) {
      newErrors.defendant = 'Cannot file a case against yourself';
    }

    if (!formData.evidence || formData.evidence.length < 50) {
      newErrors.evidence = 'Please provide detailed evidence (minimum 50 characters)';
    }

    const damages = parseFloat(formData.requestedDamages);
    if (isNaN(damages) || damages <= 0 || damages > 100) {
      newErrors.requestedDamages = 'Damages must be between 0.01 and 100 ETH';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    if (validateForm()) {
      setStep('payment');
    }
  };

  const handlePaymentConfirm = async () => {
    console.log('🚀 Starting payment confirmation...');
    console.log('📋 Form data:', formData);
    console.log('💳 Wallet address:', address);
    
    try {
      const result = await fileCase(formData);
      console.log('📦 File case result:', result);
      
      if (result && result.success) {
        toast.success(`Case #${result.caseId} filed successfully!`);
        // Small delay to show success message
        setTimeout(() => {
          router.push(`/my-cases`);
        }, 1000);
      } else {
        console.error('❌ No success response:', result);
        toast.error('Failed to file case. Please try again.');
        setStep('form');
      }
    } catch (error: unknown) {
      console.error('❌ Error filing case:', error);
      let errorMessage = 'Failed to file case';
      if (typeof error === 'object' && error !== null) {
        // Check for AxiosError shape
        const errObj = error as Record<string, unknown>;
        if (
          'response' in errObj &&
          typeof errObj.response === 'object' &&
          errObj.response !== null &&
          'data' in (errObj.response as Record<string, unknown>) &&
          typeof (errObj.response as Record<string, unknown>).data === 'object' &&
          (errObj.response as Record<string, unknown>).data !== null &&
          'error' in (errObj.response as { data?: Record<string, unknown> }).data!
        ) {
          errorMessage = String((errObj.response as { data?: { error?: unknown } }).data?.error) || errorMessage;
        } else if ('message' in errObj && typeof errObj.message === 'string') {
          errorMessage = errObj.message;
        }
      }
      toast.error(errorMessage);
      setStep('form');
    }
  };

  const handlePaymentCancel = () => {
    setStep('form');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    setFormData({
      ...formData,
      evidenceFiles: [...formData.evidenceFiles, ...validFiles]
    });
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      evidenceFiles: formData.evidenceFiles.filter((_, i) => i !== index)
    });
  };

  const getTotalFileSize = () => {
    const totalBytes = formData.evidenceFiles.reduce((sum, file) => sum + file.size, 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  };

  return (
    <PageContainer>
      <PageHeader 
        title="File a New Case"
        description="Submit a grievance against an AI agent ($10.00 filing fee)"
      />

      <div className="max-w-2xl mx-auto">
        {step === 'form' ? (
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
              <CardDescription>
                Provide comprehensive information about your dispute
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Defendant Address */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Defendant Address <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.defendant}
                    onChange={(e) => setFormData({...formData, defendant: e.target.value})}
                    placeholder="0x..."
                    className={errors.defendant ? "border-red-500" : ""}
                  />
                  {errors.defendant && (
                    <p className="text-sm text-red-400 mt-1">{errors.defendant}</p>
                  )}
                </div>

                {/* Claim Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Claim Type <span className="text-red-400">*</span>
                  </label>
                  <Select
                    value={formData.claimType}
                    onValueChange={(value) => setFormData({...formData, claimType: value as ClaimType})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ClaimType.API_FRAUD}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          API Fraud
                        </div>
                      </SelectItem>
                      <SelectItem value={ClaimType.DATA_THEFT}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-purple-400" />
                          Data Theft
                        </div>
                      </SelectItem>
                      <SelectItem value={ClaimType.SERVICE_MANIPULATION}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-400" />
                          Service Manipulation
                        </div>
                      </SelectItem>
                      <SelectItem value={ClaimType.TOKEN_FRAUD}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-400" />
                          Token Fraud
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Evidence */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Evidence <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    value={formData.evidence}
                    onChange={(e) => setFormData({...formData, evidence: e.target.value})}
                    placeholder="Provide detailed evidence supporting your claim. Include specific dates, transactions, communications, and any other relevant information..."
                    rows={6}
                    className={errors.evidence ? "border-red-500" : ""}
                  />
                  {errors.evidence && (
                    <p className="text-sm text-red-400 mt-1">{errors.evidence}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.evidence.length} characters
                  </p>
                </div>

                {/* Evidence Files Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Supporting Documents (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="evidence-files"
                      accept=".pdf,.png,.jpg,.jpeg,.txt,.json,.doc,.docx"
                    />
                    <label
                      htmlFor="evidence-files"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-400">
                        Click to upload files or drag and drop
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PDF, PNG, JPG, TXT, JSON, DOC up to 10MB each
                      </span>
                    </label>
                  </div>
                  
                  {/* File List */}
                  {formData.evidenceFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{formData.evidenceFiles.length} file(s) selected</span>
                        <span>Total: {getTotalFileSize()} MB</span>
                      </div>
                      {formData.evidenceFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 rounded p-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Requested Damages */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Requested Damages (ETH) <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.requestedDamages}
                    onChange={(e) => setFormData({...formData, requestedDamages: e.target.value})}
                    min="0.01"
                    max="100"
                    step="0.01"
                    className={errors.requestedDamages ? "border-red-500" : ""}
                  />
                  {errors.requestedDamages && (
                    <p className="text-sm text-red-400 mt-1">{errors.requestedDamages}</p>
                  )}
                  <Alert className="mt-3">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Ensure damages are proportional to the harm suffered. Excessive claims may result in dismissal.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!address || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </Button>

                {!address && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please connect your wallet to file a case
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Case Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
                <CardDescription>Review your case details before payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Defendant:</span>
                    <span className="font-mono">{formData.defendant.slice(0, 6)}...{formData.defendant.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Claim Type:</span>
                    <span>{formData.claimType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Requested Damages:</span>
                    <span>{formData.requestedDamages} ETH</span>
                  </div>
                  {formData.evidenceFiles.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Evidence Files:</span>
                      <span>{formData.evidenceFiles.length} file(s)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Confirmation */}
            <PaymentConfirmation
              title="Confirm Case Filing"
              description="Confirm payment to file your case"
              amount="$10.00"
              fees={[
                {
                  label: "Filing Fee",
                  amount: "$8.00",
                  percentage: 80,
                  tooltip: "Base fee for case processing and AI judgment"
                },
                {
                  label: "Court Treasury",
                  amount: "$1.50",
                  percentage: 15,
                  tooltip: "Funds court operations and infrastructure"
                },
                {
                  label: "Jury Pool",
                  amount: "$0.50",
                  percentage: 5,
                  tooltip: "Rewards for jury participants in appeals"
                }
              ]}
              onConfirm={handlePaymentConfirm}
              onCancel={handlePaymentCancel}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}