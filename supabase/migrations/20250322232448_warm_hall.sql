/*
  # Add TikTok metadata to social connections

  1. Changes
    - Add platform_username column to social_connections
    - Add metadata JSONB column for platform-specific data
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to social_connections
ALTER TABLE social_connections
ADD COLUMN IF NOT EXISTS platform_username text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can manage their own connections" ON social_connections;
CREATE POLICY "Users can manage their own connections"
  ON social_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);