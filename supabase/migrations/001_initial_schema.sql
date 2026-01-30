-- Create story_parts table
CREATE TABLE IF NOT EXISTS story_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  word_count INTEGER,
  summary TEXT
);

-- Create characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('main', 'side', 'minor')),
  description TEXT,
  personality JSONB,
  physical_traits JSONB,
  background TEXT,
  avatar_url TEXT,
  first_appearance_part INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create character_traits table
CREATE TABLE IF NOT EXISTS character_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  trait_category TEXT CHECK (trait_category IN ('personality', 'physical', 'behavioral')),
  trait_name TEXT NOT NULL,
  trait_value TEXT,
  evidence TEXT[]
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('indoor', 'outdoor', 'private', 'public')),
  first_mentioned_part INTEGER,
  importance TEXT CHECK (importance IN ('major', 'minor'))
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_part_id UUID REFERENCES story_parts(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  event_type TEXT CHECK (event_type IN ('dialogue', 'action', 'revelation')),
  description TEXT,
  content TEXT,
  timestamp_in_story TEXT,
  significance INTEGER
);

-- Create relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_1_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  character_2_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT,
  status TEXT,
  description TEXT,
  key_moments TEXT[]
);

-- Create story_context table
CREATE TABLE IF NOT EXISTS story_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT,
  key TEXT,
  value TEXT,
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_story_parts_part_number ON story_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_role ON characters(role);
CREATE INDEX IF NOT EXISTS idx_character_traits_character_id ON character_traits(character_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_events_story_part_id ON events(story_part_id);
CREATE INDEX IF NOT EXISTS idx_events_character_id ON events(character_id);
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_relationships_character_1_id ON relationships(character_1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_character_2_id ON relationships(character_2_id);
