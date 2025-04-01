/*
  # Subscription System Schema

  1. New Tables
    - subscription_plans: Stores available subscription plans
    - subscriptions: Tracks user subscriptions
  
  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing subscriptions
    - Add policies for viewing active plans

  3. Default Data
    - Insert default subscription plans
*/

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  stripe_price_id text UNIQUE NOT NULL,
  price integer NOT NULL,
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table with reference to auth.users
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  plan_id uuid REFERENCES subscription_plans NOT NULL,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL CHECK (status IN ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid')),
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  USING (active = true);

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, stripe_price_id, price, interval, features) VALUES
  ('Free Trial', 'Try all features free for 14 days', 'price_free_trial', 0, 'month', '{
    "video_uploads": 20,
    "accounts_per_platform": 1,
    "support_level": "basic",
    "analytics": "basic"
  }'::jsonb),
  ('Basic', 'Perfect for small creators', 'price_basic_monthly', 1000, 'month', '{
    "video_uploads": 50,
    "accounts_per_platform": 2,
    "support_level": "priority",
    "analytics": "advanced",
    "white_label": false
  }'::jsonb),
  ('Pro', 'For growing creators', 'price_pro_monthly', 1800, 'month', '{
    "video_uploads": 100,
    "accounts_per_platform": 5,
    "support_level": "premium",
    "analytics": "premium",
    "white_label": true,
    "api_access": true
  }'::jsonb);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();