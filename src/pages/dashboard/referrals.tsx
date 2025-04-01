import { useState, useEffect } from 'react';
import { Share2, Copy, CheckCircle, Users, Gift, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

interface ReferralStats {
  totalInvites: number;
  successfulReferrals: number;
  pendingReferrals: number;
  rewardsEarned: number;
}

interface ReferralCode {
  code: string;
  created_at: string;
}

export function ReferralsPage() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    totalInvites: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    rewardsEarned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load referral code with explicit column selection
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('code:code, created_at')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (codeError) throw codeError;

      if (!codeData) {
        // Generate new referral code if none exists
        const { data: newCode, error: createError } = await supabase
          .rpc('generate_referral_code');

        if (createError) throw createError;

        const { data: insertedCode, error: insertError } = await supabase
          .from('referral_codes')
          .insert({ user_id: user!.id, code: newCode })
          .select('code:code, created_at')
          .single();

        if (insertError) throw insertError;
        setReferralCode(insertedCode);
      } else {
        setReferralCode(codeData);
      }

      // Load referral stats with explicit table reference
      const { data: referrals, error: statsError } = await supabase
        .from('referrals')
        .select('id, status, reward_claimed')
        .eq('referrer_id', user!.id);

      if (statsError) throw statsError;

      setStats({
        totalInvites: referrals?.length || 0,
        successfulReferrals: referrals?.filter(r => r.status === 'completed').length || 0,
        pendingReferrals: referrals?.filter(r => r.status === 'pending').length || 0,
        rewardsEarned: (referrals?.filter(r => r.reward_claimed).length || 0) * 10, // $10 per referral
      });
    } catch (err) {
      console.error('Error loading referral data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy referral code');
    }
  };

  const handleShare = async (platform: string) => {
    if (!referralCode) return;

    const referralUrl = `${window.location.origin}/signup?ref=${referralCode.code}`;
    const message = `Join me on Purposify! Use my referral code ${referralCode.code} to get $10 credit when you sign up.`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralUrl)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + referralUrl)}`);
        break;
      case 'email':
        window.location.href = `mailto:?subject=Join me on Purposify&body=${encodeURIComponent(message + '\n\n' + referralUrl)}`;
        break;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-600">Invite friends and earn rewards</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invites</p>
              <p className="text-2xl font-bold">{stats.totalInvites}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Share2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successful Referrals</p>
              <p className="text-2xl font-bold">{stats.successfulReferrals}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invites</p>
              <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rewards Earned</p>
              <p className="text-2xl font-bold">${stats.rewardsEarned}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Referral Code</h2>
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
              <code className="text-lg font-mono">{referralCode?.code}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className={copied ? 'text-green-600' : ''}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium mb-4">Share your referral link</h3>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="flex-1"
            >
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="flex-1"
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="flex-1"
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('email')}
              className="flex-1"
            >
              Email
            </Button>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Program Details</h2>
        <div className="prose prose-sm max-w-none text-gray-600">
          <h3 className="text-base font-medium text-gray-900">How it works</h3>
          <ul className="list-disc pl-5 mb-6">
            <li>Share your unique referral code with friends</li>
            <li>When they sign up using your code, they get $10 in credits</li>
            <li>Once they make their first purchase, you earn $10 in credits</li>
            <li>There's no limit to how many friends you can refer</li>
          </ul>

          <h3 className="text-base font-medium text-gray-900">Terms & Conditions</h3>
          <ul className="list-disc pl-5">
            <li>Referral rewards are only valid for new users</li>
            <li>Credits expire after 12 months</li>
            <li>We reserve the right to modify or terminate the referral program at any time</li>
            <li>Fraudulent referrals will result in account suspension</li>
          </ul>
        </div>
      </div>
    </div>
  );
}