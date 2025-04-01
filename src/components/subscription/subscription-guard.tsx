import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { getSubscriptionLimits } from '../../lib/subscription';
import type { SubscriptionLimits } from '../../lib/types';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredFeature: keyof SubscriptionLimits;
  fallbackUrl?: string;
}

export function SubscriptionGuard({ children, requiredFeature, fallbackUrl = '/dashboard/billing' }: SubscriptionGuardProps) {
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      const limits = await getSubscriptionLimits();
      setLimits(limits);
    } catch (error) {
      console.error('Error loading subscription limits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!limits) {
    navigate(fallbackUrl);
    return null;
  }

  const hasAccess = checkFeatureAccess(limits, requiredFeature);
  
  if (!hasAccess) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-yellow-800 font-medium">Subscription Required</h3>
              <p className="text-yellow-700 mt-1">
                This feature requires a higher subscription tier.{' '}
                <a href={fallbackUrl} className="font-medium underline">
                  Upgrade your plan
                </a>{' '}
                to access this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function checkFeatureAccess(limits: SubscriptionLimits, feature: keyof SubscriptionLimits): boolean {
  const value = limits[feature];
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value > 0;
  }
  
  if (feature === 'analyticsLevel') {
    return ['basic', 'advanced', 'premium'].includes(value);
  }
  
  if (feature === 'supportLevel') {
    return ['basic', 'priority', 'premium'].includes(value);
  }
  
  return false;
}