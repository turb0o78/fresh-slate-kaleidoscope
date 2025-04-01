/*
  # Create Referral System Tables

  1. New Tables
    - `referral_codes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `code` (text, unique)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, optional)
    
    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references users)
      - `referee_id` (uuid, references users)
      - `code` (text, references referral_codes)
      - `status` (text: pending/completed)
      - `reward_claimed` (boolean)
      - `created_at` (timestamp)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their referrals
*/

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT valid_code CHECK (code ~ '^[A-Z0-9]{8}$')
);

-- Enable RLS and create policies for referral_codes
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral codes"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes"
  ON referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id),
  referee_id uuid NOT NULL REFERENCES auth.users(id),
  code text NOT NULL REFERENCES referral_codes(code),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT different_users CHECK (referrer_id != referee_id)
);

-- Enable RLS and create policies for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals they're involved in"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referee_id);

-- Function to generate random referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Generate a random 8-character code using uppercase letters and numbers
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS (
      SELECT 1 FROM referral_codes WHERE referral_codes.code = code
    ) INTO exists;
    
    -- Exit loop if unique code is generated
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql VOLATILE;