-- Migration for Advanced Continue Story Features

-- Create continuation_drafts table for saving non-finalized story parts
CREATE TABLE IF NOT EXISTS continuation_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_prompt TEXT NOT NULL,
  character_focus TEXT,
  generated_content TEXT NOT NULL,
  revision_instructions TEXT,
  tags TEXT[],
  side_notes TEXT,
  scene_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create continuation_history table for tracking generation history
CREATE TABLE IF NOT EXISTS continuation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES continuation_drafts(id) ON DELETE CASCADE,
  user_prompt TEXT NOT NULL,
  character_focus TEXT,
  revision_instructions TEXT,
  generated_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create continuation_branches table for alternative scenarios
CREATE TABLE IF NOT EXISTS continuation_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_draft_id UUID REFERENCES continuation_drafts(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  character_focus TEXT,
  generated_content TEXT NOT NULL,
  side_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_continuation_drafts_created_at ON continuation_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuation_history_draft_id ON continuation_history(draft_id);
CREATE INDEX IF NOT EXISTS idx_continuation_history_created_at ON continuation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuation_branches_parent_draft_id ON continuation_branches(parent_draft_id);
CREATE INDEX IF NOT EXISTS idx_continuation_drafts_tags ON continuation_drafts USING GIN(tags);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_continuation_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_continuation_drafts_updated_at_trigger
BEFORE UPDATE ON continuation_drafts
FOR EACH ROW
EXECUTE FUNCTION update_continuation_drafts_updated_at();
