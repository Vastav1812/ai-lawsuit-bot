// src/components/cases/CaseFilingModal.tsx
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClaimType } from '@/lib/types';
import { API_URL } from '@/lib/constants';
import axios from 'axios';
import toast from 'react-hot-toast';

interface CaseFilingModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function CaseFilingModal({ onClose, onSuccess }: CaseFilingModalProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    defendant: '',
    claimType: ClaimType.API_FRAUD,
    evidence: '',
    requestedDamages: '0.1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const paymentData = btoa(JSON.stringify({
        from: address,
        amount: '$10.00'
      }));

      const response = await axios.post(
        `${API_URL}/api/cases/file`,
        formData,
        {
          headers: {
            'X-PAYMENT': paymentData
          }
        }
      );

      if (response.data.success) {
        toast.success(`Case filed successfully! ID: ${response.data.caseId}`);
        onSuccess?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to file case';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>File a New Case</DialogTitle>
          <DialogDescription>
            Submit a grievance against an AI agent. Filing fee: $10
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Describe your evidence in detail..."
              rows={4}
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Filing...' : 'File Case ($10)'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}