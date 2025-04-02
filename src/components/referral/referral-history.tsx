
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { CheckCircle, Clock, X } from 'lucide-react';

interface Referral {
  id: string;
  referee_username: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  payment_method: string;
}

export function ReferralHistory() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Load referrals with referee usernames
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          created_at,
          completed_at,
          referee:referee_id(email)
        `)
        .eq('referrer_id', user!.id)
        .order('created_at', { ascending: false });
        
      if (referralsError) throw referralsError;

      // Load payout requests
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
        
      if (payoutsError) throw payoutsError;

      // Format the data
      const formattedReferrals = referralsData.map((referral: any) => ({
        id: referral.id,
        referee_username: referral.referee?.email ? referral.referee.email.split('@')[0] + '***' : 'Unknown user',
        status: referral.status,
        created_at: referral.created_at,
        completed_at: referral.completed_at,
      }));

      setReferrals(formattedReferrals);
      setPayoutRequests(payoutsData);
    } catch (err) {
      console.error('Error loading referral history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Referrals History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Referral History</h3>

          {referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{referral.referee_username}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(referral.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(referral.status)}
                          <span className="ml-2 capitalize">{referral.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(referral.completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              You haven't referred anyone yet.
            </div>
          )}
        </div>
      </div>

      {/* Payout History */}
      {payoutRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payout History</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payoutRequests.map((payout) => (
                    <tr key={payout.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(payout.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${payout.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize">{payout.payment_method}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(payout.status)}
                          <span className="ml-2 capitalize">{payout.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
