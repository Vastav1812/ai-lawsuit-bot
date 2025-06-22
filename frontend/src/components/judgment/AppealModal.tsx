// src/components/judgment/AppealModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, AlertCircle } from 'lucide-react';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  loading?: boolean;
}

export function AppealModal({ isOpen, onClose, onSubmit, loading }: AppealModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for your appeal');
      return;
    }

    if (reason.length < 50) {
      setError('Please provide a more detailed reason (at least 50 characters)');
      return;
    }

    try {
      await onSubmit(reason);
      setReason('');
      onClose();
    } catch {
      setError('Failed to file appeal');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            File Appeal
          </DialogTitle>
          <DialogDescription>
            Explain why you believe the judgment should be reconsidered. Appeal fee: $25.00
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Appeal Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Provide a detailed explanation for your appeal..."
              rows={6}
              className="resize-none"
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <p className="text-xs text-gray-400">
              {reason.length} characters (minimum 50)
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Appeals are reviewed by a higher AI court. The $25 fee is non-refundable regardless of outcome.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'File Appeal ($25)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}