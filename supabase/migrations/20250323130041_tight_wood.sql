/*
  # Update subscription plans with Stripe IDs

  1. Changes
    - Update Basic and Pro plan Stripe price IDs
    - Remove Free Trial plan since it's not supported in Stripe
    - Update features to match new tiers
*/

-- Delete the Free Trial plan since we can't create free subscriptions
DELETE FROM subscription_plans WHERE name = 'Free Trial';

-- Update Basic plan
UPDATE subscription_plans
SET stripe_price_id = 'prod_RznBssD1wbdAMn',
    features = '{
      "video_uploads": 50,
      "accounts_per_platform": 2,
      "support_level": "priority",
      "analytics": "advanced",
      "white_label": false,
      "api_access": false
    }'::jsonb
WHERE name = 'Basic';

-- Update Pro plan
UPDATE subscription_plans
SET stripe_price_id = 'prod_RznC7pNH86orB1',
    features = '{
      "video_uploads": 100,
      "accounts_per_platform": 5,
      "support_level": "premium",
      "analytics": "premium",
      "white_label": true,
      "api_access": true
    }'::jsonb
WHERE name = 'Pro';