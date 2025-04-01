/*
  # Remove Stripe Integration

  1. Changes:
    - Drop subscription_plans table
    - Drop subscriptions table
    - Drop payments table
    - Create new simplified plans table
*/

-- Drop existing tables
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS payments;

-- Create new plans table without Stripe dependencies
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing active plans
CREATE POLICY "Anyone can view active plans"
  ON plans
  FOR SELECT
  USING (active = true);

-- Insert default plans
INSERT INTO plans (name, description, price, features) VALUES
  ('Basic', 'Perfect for small creators', 1000, '{
    "video_uploads": 50,
    "accounts_per_platform": 2,
    "support_level": "priority",
    "analytics": "advanced",
    "white_label": false,
    "api_access": false
  }'::jsonb),
  ('Pro', 'For growing creators', 1800, '{
    "video_uploads": 100,
    "accounts_per_platform": 5,
    "support_level": "premium",
    "analytics": "premium",
    "white_label": true,
    "api_access": true
  }'::jsonb);

-- Create user_plans table for tracking user plan assignments
CREATE TABLE user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  plan_id uuid REFERENCES plans NOT NULL,
  active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own plan"
  ON user_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();