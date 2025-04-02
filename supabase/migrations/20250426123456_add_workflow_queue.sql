
-- Create workflow_queue table to track media detected by webhooks
CREATE TABLE IF NOT EXISTS workflow_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  source_platform TEXT NOT NULL,
  platform_media_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE workflow_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflow queue entries"
  ON workflow_queue
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM workflows WHERE id = workflow_id
    )
  );

CREATE POLICY "Service role can manage all workflow queue entries"
  ON workflow_queue
  USING (auth.role() = 'service_role');

-- Create index for efficient querying
CREATE INDEX workflow_queue_workflow_id_idx ON workflow_queue (workflow_id);
CREATE INDEX workflow_queue_status_idx ON workflow_queue (status);
CREATE INDEX workflow_queue_created_at_idx ON workflow_queue (created_at);
