import { supabase } from './supabase';
import type { SubscriptionFeatures, SubscriptionLimits } from './types';

export async function getSubscriptionLimits(): Promise<SubscriptionLimits> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return getDefaultLimits();
  }

  // Get user's active plan
  const { data: userPlan } = await supabase
    .from('user_plans')
    .select(`
      *,
      plan:plans(*)
    `)
    .eq('user_id', user.id)
    .eq('active', true)
    .single();

  if (!userPlan) {
    return getDefaultLimits();
  }

  const features = userPlan.plan.features as SubscriptionFeatures;

  // Get count of user's uploads this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyUploads } = await supabase
    .from('posts')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString());

  // Get count of connected accounts
  const { count: connectedAccounts } = await supabase
    .from('social_connections')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id);

  return {
    remainingUploads: features.video_uploads - (monthlyUploads || 0),
    remainingAccounts: features.accounts_per_platform * PLATFORMS.length - (connectedAccounts || 0),
    canUseWhiteLabel: features.white_label,
    canUseApi: features.api_access,
    analyticsLevel: features.analytics,
    supportLevel: features.support_level
  };
}

function getDefaultLimits(): SubscriptionLimits {
  return {
    remainingUploads: 0,
    remainingAccounts: 0,
    canUseWhiteLabel: false,
    canUseApi: false,
    analyticsLevel: 'basic',
    supportLevel: 'basic'
  };
}

export function checkSubscriptionFeature(limits: SubscriptionLimits, feature: keyof SubscriptionLimits): boolean {
  switch (feature) {
    case 'remainingUploads':
      return limits.remainingUploads > 0;
    case 'remainingAccounts':
      return limits.remainingAccounts > 0;
    case 'canUseWhiteLabel':
    case 'canUseApi':
      return limits[feature];
    case 'analyticsLevel':
    case 'supportLevel':
      return true; // These are always available, just at different levels
    default:
      return false;
  }
}