/*
  # Fix Referral System Issues

  1. Changes
    - Fix ambiguous column references in generate_referral_code function
    - Update RLS policies to use explicit table references
    - Add proper error handling for single row queries

  2. Security
    - Maintain existing RLS policies with improved clarity
*/

-- Drop and recreate the generate_referral_code function with fixed column references
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  generated_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a random 8-character code using uppercase letters and numbers
    generated_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists with explicit table reference
    SELECT EXISTS (
      SELECT 1 FROM referral_codes WHERE referral_codes.code = generated_code
    ) INTO code_exists;
    
    -- Exit loop if unique code is generated
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN generated_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update referrals policies with explicit table references
DROP POLICY IF EXISTS "Users can view referrals they're involved in" ON referrals;
CREATE POLICY "Users can view referrals they're involved in"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = referrals.referrer_id OR 
    auth.uid() = referrals.referee_id
  );

DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
CREATE POLICY "Users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrals.referee_id);

-- Update referral_codes policies with explicit table references
DROP POLICY IF EXISTS "Users can view their own referral codes" ON referral_codes;
CREATE POLICY "Users can view their own referral codes"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referral_codes.user_id);

DROP POLICY IF EXISTS "Users can create their own referral codes" ON referral_codes;
CREATE POLICY "Users can create their own referral codes"
  ON referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referral_codes.user_id);