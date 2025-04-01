/*
  # Create Dashboard Tables

  1. New Tables
    - `social_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `platform` (text) - e.g., 'twitter', 'instagram'
      - `platform_user_id` (text) - ID from the platform
      - `access_token` (text)
      - `refresh_token` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `workflows`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `source_platform` (text)
      - `target_platforms` (text[])
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `workflow_id` (uuid, references workflows)
      - `content` (text)
      - `media_urls` (text[])
      - `scheduled_for` (timestamp)
      - `status` (text) - 'draft', 'scheduled', 'published', 'failed'
      - `platform_post_ids` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Social Connections Table
CREATE TABLE social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  platform text NOT NULL,
  platform_user_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own connections"
  ON social_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Workflows Table
CREATE TABLE workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  source_platform text NOT NULL,
  target_platforms text[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workflows"
  ON workflows
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Posts Table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  workflow_id uuid REFERENCES workflows,
  content text NOT NULL,
  media_urls text[],
  scheduled_for timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  platform_post_ids jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own posts"
  ON posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_social_connections_updated_at
  BEFORE UPDATE ON social_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();