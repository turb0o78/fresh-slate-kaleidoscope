
import { Check } from 'lucide-react';
import { Button } from '../ui/button';
import { formatPrice } from '../../lib/stripe';
import type { SubscriptionPlan } from '../../lib/types';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading?: boolean;
  currentPlan?: boolean;
}

export function PlanCard({ plan, isPopular, onSelect, isLoading, currentPlan }: PlanCardProps) {
  const features = plan.features as any;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-8 relative ${
      isPopular ? 'border-blue-200' : ''
    }`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm">
          Popular
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-4">{plan.description}</p>
        <div className="text-4xl font-bold">{formatPrice(plan.price)}</div>
        {plan.price > 0 && (
          <p className="text-gray-500 text-sm">per month</p>
        )}
      </div>
      
      <ul className="space-y-4 mb-8">
        <li className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <span>{features.video_uploads} video uploads</span>
        </li>
        <li className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <span>{features.accounts_per_platform} account{features.accounts_per_platform > 1 ? 's' : ''} per platform</span>
        </li>
        <li className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <span>{features.support_level} support</span>
        </li>
        <li className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <span>{features.analytics} analytics</span>
        </li>
        {features.white_label && (
          <li className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span>White-label exports</span>
          </li>
        )}
        {features.api_access && (
          <li className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span>API access</span>
          </li>
        )}
      </ul>
      
      <Button
        className={`w-full ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
        onClick={() => onSelect(plan)}
        disabled={isLoading || currentPlan}
      >
        {currentPlan ? 'Current Plan' : isLoading ? 'Processing...' : `Choose ${plan.name}`}
      </Button>
    </div>
  );
}
