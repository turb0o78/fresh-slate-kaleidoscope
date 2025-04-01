/*
  # Add TikTok Integration Tables

  1. New Tables
    - tiktok_videos: Store TikTok video data
    - tiktok_webhooks: Log webhook events

  2. Security
    - Enable RLS
    - Add policies for data access
*/

-- Create tiktok_videos table
CREATE TABLE tiktok_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  creator_id text NOT NULL,
  title text,
  description text,
  thumbnail_url text,
  share_url text,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  raw_data jsonb DEFAULT '{}'::jsonb,
  UNIQUE(video_id)
);

-- Enable RLS
ALTER TABLE tiktok_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their connected TikTok videos"
  ON tiktok_videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_connections
      WHERE social_connections.user_id = auth.uid()
      AND social_connections.platform = 'tiktok'
      AND social_connections.platform_user_id = creator_id
    )
  );

-- Create tiktok_webhooks table for logging
CREATE TABLE tiktok_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  signature text,
  payload jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  status text DEFAULT 'success',
  error_message text
);

-- Enable RLS
ALTER TABLE tiktok_webhooks ENABLE ROW LEVEL SECURITY;

-- Only allow system access
CREATE POLICY "No direct access to webhook logs"
  ON tiktok_webhooks
  FOR ALL
  TO authenticated
  USING (false);