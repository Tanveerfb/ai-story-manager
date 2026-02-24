-- Migration: Story Worlds
-- Enables multiple isolated story worlds, each with their own
-- characters, locations, and story parts.

-- ── World table ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS story_worlds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  genre       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Add world_id FK to existing tables ───────────────────────────────────────

ALTER TABLE story_parts
  ADD COLUMN IF NOT EXISTS world_id UUID REFERENCES story_worlds(id) ON DELETE SET NULL;

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS world_id UUID REFERENCES story_worlds(id) ON DELETE SET NULL;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS world_id UUID REFERENCES story_worlds(id) ON DELETE SET NULL;

-- continuation_drafts may or may not exist depending on migration version
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'continuation_drafts') THEN
    ALTER TABLE continuation_drafts
      ADD COLUMN IF NOT EXISTS world_id UUID REFERENCES story_worlds(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── Character behavior / personality columns ──────────────────────────────────

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS behavior_notes        TEXT,
  ADD COLUMN IF NOT EXISTS speech_patterns       TEXT,
  ADD COLUMN IF NOT EXISTS fears                 TEXT,
  ADD COLUMN IF NOT EXISTS motivations           TEXT,
  ADD COLUMN IF NOT EXISTS relationships_summary TEXT,
  ADD COLUMN IF NOT EXISTS arc_notes             TEXT;

-- ── Seed a default world and backfill existing rows ──────────────────────────

INSERT INTO story_worlds (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default World', 'Your original story world')
ON CONFLICT (id) DO NOTHING;

UPDATE story_parts SET world_id = '00000000-0000-0000-0000-000000000001' WHERE world_id IS NULL;
UPDATE characters  SET world_id = '00000000-0000-0000-0000-000000000001' WHERE world_id IS NULL;
UPDATE locations   SET world_id = '00000000-0000-0000-0000-000000000001' WHERE world_id IS NULL;

-- ── RLS policies (adjust to your Supabase auth setup) ────────────────────────

ALTER TABLE story_worlds ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (tighten when you add auth)
CREATE POLICY "allow_all_story_worlds" ON story_worlds FOR ALL USING (true) WITH CHECK (true);

-- ── Index for fast world-scoped queries ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_story_parts_world_id ON story_parts(world_id);
CREATE INDEX IF NOT EXISTS idx_characters_world_id  ON characters(world_id);
CREATE INDEX IF NOT EXISTS idx_locations_world_id   ON locations(world_id);
