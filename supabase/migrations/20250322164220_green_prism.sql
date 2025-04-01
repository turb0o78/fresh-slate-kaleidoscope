/*
  # Dashboard Schema Setup

  1. Tables:
    - social_connections: Store social media platform connections
    - workflows: Manage cross-posting workflows
    - posts: Track posts across platforms
  
  2. Security:
    - RLS enabled on all tables
    - Policies for user data isolation
    - Triggers for timestamp management
*/

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Social Connections Table
CREATE TABLE IF NOT EXISTS social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  platform_user_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own connections" ON social_connections;
CREATE POLICY "Users can manage their own connections"
  ON social_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_social_connections_updated_at ON social_connections;
CREATE TRIGGER update_social_connections_updated_at
  BEFORE UPDATE ON social_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  source_platform text NOT NULL,
  target_platforms text[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own workflows" ON workflows;
CREATE POLICY "Users can manage their own workflows"
  ON workflows
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workflow_id uuid,
  content text NOT NULL,
  media_urls text[],
  scheduled_for timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  platform_post_ids jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own posts" ON posts;
CREATE POLICY "Users can manage their own posts"
  ON posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();