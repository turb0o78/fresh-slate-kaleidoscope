
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/toast';

interface PayoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardAmount: number;
  onSuccess: () => void;
}

export function PayoutModal({ open, onOpenChange, rewardAmount, onSuccess }: PayoutModalProps) {
  const [paypalEmail, setPaypalEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!paypalEmail || !paypalEmail.includes('@')) {
      setError('Please enter a valid PayPal email address');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create the payout request
      const { error: payoutError } = await supabase
        .from('payout_requests')
        .insert({
          user_id: user!.id,
          amount: rewardAmount,
          payment_method: 'paypal',
          payment_email: paypalEmail,
          status: 'pending'
        });

      if (payoutError) throw payoutError;

      // Reset the claimed rewards
      const { error: rewardError } = await supabase
        .rpc('reset_claimed_rewards');

      if (rewardError) throw rewardError;

      toast({
        title: 'Payout Request Submitted',
        description: `Your payout request for $${rewardAmount} has been submitted and will be processed soon.`,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error requesting payout:', err);
      setError('Failed to submit payout request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center justify-between">
          Request Payout
          <DialogClose className="w-6 h-6 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogTitle>
        <DialogDescription>
          Enter your PayPal email to receive your referral reward of ${rewardAmount}.
        </DialogDescription>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paypal-email">PayPal Email</Label>
            <Input 
              id="paypal-email"
              type="email" 
              placeholder="your-email@example.com"
              value={paypalEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaypalEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Request Payout'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
