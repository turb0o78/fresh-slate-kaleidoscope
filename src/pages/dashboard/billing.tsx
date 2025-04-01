import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { PlanCard } from '../../components/subscription/plan-card';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession, getCurrentPlan } from '../../lib/stripe';
import type { SubscriptionPlan } from '../../lib/types';

export function BillingPage() {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  useEffect(() => {
    // Handle success/cancel messages from Stripe
    if (searchParams.get('success')) {
      setError(null);
    } else if (searchParams.get('canceled')) {
      setError('Payment canceled. Please try again.');
    }
  }, [searchParams]);

  const loadBillingData = async () => {
    try {
      setError(null);
      const [plansData, currentPlanData] = await Promise.all([
        supabase.from('plans').select('*').eq('active', true),
        getCurrentPlan(),
      ]);

      if (plansData.error) throw plansData.error;
      setPlans(plansData.data || []);
      setCurrentPlan(currentPlanData);
    } catch (error) {
      console.error('Error loading billing data:', error);
      setError('Failed to load subscription data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    try {
      setError(null);
      setProcessingPlan(plan.id);
      await createCheckoutSession(plan.id);
    } catch (error) {
      console.error('Error selecting plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to process subscription. Please try again later.');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your subscription and billing settings</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {currentPlan && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Current Plan: {currentPlan.plan.name}</h2>
              <p className="text-gray-600">
                Next billing date:{' '}
                {new Date(currentPlan.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Active</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isPopular={plan.name === 'Pro'}
            onSelect={handleSelectPlan}
            isLoading={processingPlan === plan.id}
            currentPlan={currentPlan?.plan_id === plan.id}
          />
        ))}
      </div>

      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <Shield className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">Secure Payment Processing</h3>
            <p className="text-blue-700 mt-1">
              All payments are processed securely through Stripe. We never store your credit card information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
