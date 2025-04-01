/*
  # Add workflow configuration

  1. Changes
    - Add config JSONB column to workflows table to store workflow configuration
    - Add webhook_url column to social_connections table
    - Add last_checked_at column to workflows table for monitoring

  2. Security
    - Maintain existing RLS policies
*/

-- Add config column to workflows table
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

-- Add webhook_url to social_connections
ALTER TABLE social_connections
ADD COLUMN IF NOT EXISTS webhook_url text;

-- Create index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_social_connections_platform_webhook
ON social_connections(platform) WHERE webhook_url IS NOT NULL;

-- Create index for faster workflow monitoring
CREATE INDEX IF NOT EXISTS idx_workflows_active_last_checked
ON workflows(last_checked_at) WHERE is_active = true;