-- Migration for Next-Gen UX Features

-- Create character_aliases table for nickname/alias tracking
CREATE TABLE IF NOT EXISTS character_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  first_seen_part INTEGER,
  usage_count INTEGER DEFAULT 1,
  context_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create location_aliases table for location name variations
CREATE TABLE IF NOT EXISTS location_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  first_seen_part INTEGER,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashbacks table for saved flashback scenes
CREATE TABLE IF NOT EXISTS flashbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT NOT NULL,
  keywords TEXT[],
  character_ids UUID[],
  location_ids UUID[],
  story_part_ids UUID[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create location_usage table to track location references
CREATE TABLE IF NOT EXISTS location_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  story_part_id UUID REFERENCES story_parts(id) ON DELETE CASCADE,
  reference_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, story_part_id)
);

-- Create merge_history table for audit trail
CREATE TABLE IF NOT EXISTS merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('character', 'location')),
  primary_entity_id UUID NOT NULL,
  primary_entity_name TEXT NOT NULL,
  merged_entity_ids UUID[] NOT NULL,
  merged_entity_names TEXT[] NOT NULL,
  merged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_character_aliases_character_id ON character_aliases(character_id);
CREATE INDEX IF NOT EXISTS idx_character_aliases_alias ON character_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_location_aliases_location_id ON location_aliases(location_id);
CREATE INDEX IF NOT EXISTS idx_location_aliases_alias ON location_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_flashbacks_character_ids ON flashbacks USING GIN(character_ids);
CREATE INDEX IF NOT EXISTS idx_flashbacks_location_ids ON flashbacks USING GIN(location_ids);
CREATE INDEX IF NOT EXISTS idx_flashbacks_keywords ON flashbacks USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_location_usage_location_id ON location_usage(location_id);
CREATE INDEX IF NOT EXISTS idx_location_usage_story_part_id ON location_usage(story_part_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_entity_type ON merge_history(entity_type);
CREATE INDEX IF NOT EXISTS idx_merge_history_primary_entity_id ON merge_history(primary_entity_id);
