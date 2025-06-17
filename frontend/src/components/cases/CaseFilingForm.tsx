// src/components/cases/CaseFilingForm.tsx
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  Info
} from 'lucide-react';
import { ClaimType } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface CaseFilingFormData {
  defendant: string;
  claimType: ClaimType;
  evidence: string;
  requestedDamages: string;
  evidenceFiles: File[];
}

interface CaseFilingFormProps {
  onSubmit: (data: CaseFilingFormData) => void;
  loading?: boolean;
  className?: string;
}

export function CaseFilingForm({ onSubmit, loading, className }: CaseFilingFormProps) {
  const { address } = useAccount();
  const [formData, setFormData] = useState({
    defendant: '',
    claimType: ClaimType.API_FRAUD,
    evidence: '',
    requestedDamages: '0.1',
    evidenceFiles: [] as File[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.defendant || !formData.defendant.startsWith('0x')) {
      newErrors.defendant = 'Valid Ethereum address required';
    }

    if (formData.defendant.toLowerCase() === address?.toLowerCase()) {
      newErrors.defendant = 'Cannot file a case against yourself';
    }

    if (!formData.evidence || formData.evidence.length < 50) {
      newErrors.evidence = 'Please provide detailed evidence (min 50 characters)';
    }

    const damages = parseFloat(formData.requestedDamages);
    if (isNaN(damages) || damages <= 0 || damages > 100) {
      newErrors.requestedDamages = 'Damages must be between 0.01 and 100 ETH';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({
      ...formData,
      evidenceFiles: [...formData.evidenceFiles, ...files]
    });
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      evidenceFiles: formData.evidenceFiles.filter((_, i) => i !== index)
    });
  };

  return (
    <Card className={className}>
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
              error={!!errors.defendant}
              className={cn(errors.defendant && "border-red-500")}
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
              error={!!errors.evidence}
              className={cn(errors.evidence && "border-red-500")}
            />
            {errors.evidence && (
              <p className="text-sm text-red-400 mt-1">{errors.evidence}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formData.evidence.length} characters
            </p>
          </div>

          {/* Evidence Files */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Supporting Documents (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="evidence-files"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.json"
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
                  PDF, PNG, JPG, TXT, JSON up to 10MB
                </span>
              </label>
            </div>
            
            {formData.evidenceFiles.length > 0 && (
              <div className="mt-3 space-y-2">
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
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
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
              error={!!errors.requestedDamages}
              className={cn(errors.requestedDamages && "border-red-500")}
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
            loading={loading}
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
  );
}