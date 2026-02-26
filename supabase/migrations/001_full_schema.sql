-- ═══════════════════════════════════════════════════════════════════════════
-- AI Story Manager — Full Database Schema
-- Run this once in the Supabase SQL editor to set up everything.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Story Worlds ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS story_worlds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  genre       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE story_worlds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_story_worlds" ON story_worlds FOR ALL USING (true) WITH CHECK (true);

-- NOTE: Supabase enables RLS by default on new tables.
-- We add permissive policies for all tables so the anon/service_role key can
-- read and write without restriction.  In production you would scope these
-- to authenticated users or specific roles.

-- Seed a default world
INSERT INTO story_worlds (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default World', 'Your original story world')
ON CONFLICT (id) DO NOTHING;


-- ── Story Parts ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS story_parts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id       UUID REFERENCES story_worlds(id) ON DELETE SET NULL,
  part_number    INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL DEFAULT 1,
  title          TEXT,
  content        TEXT NOT NULL,
  summary        TEXT,
  word_count     INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_parts_part_chapter ON story_parts(part_number, chapter_number);
CREATE INDEX IF NOT EXISTS idx_story_parts_world_id     ON story_parts(world_id);


-- ── Characters ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS characters (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id              UUID REFERENCES story_worlds(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  role                  TEXT CHECK (role IN ('main', 'side', 'minor', 'bg')),
  description           TEXT,
  personality           JSONB,
  physical_traits       JSONB,
  background            TEXT,
  goals                 TEXT,
  avatar_url            TEXT,
  first_appearance_part INTEGER,
  -- Traits as freeform array
  traits                TEXT[],
  -- Behavior
  behavior_notes        TEXT,
  speech_patterns       TEXT,
  fears                 TEXT,
  motivations           TEXT,
  relationships_summary TEXT,
  arc_notes             TEXT,
  -- Voice profile
  dialogue_style        TEXT,
  vocabulary_level      TEXT,
  catchphrases          TEXT[],
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_name     ON characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_role     ON characters(role);
CREATE INDEX IF NOT EXISTS idx_characters_world_id ON characters(world_id);


-- ── Character Traits (structured) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS character_traits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id   UUID REFERENCES characters(id) ON DELETE CASCADE,
  trait_category TEXT CHECK (trait_category IN ('personality', 'physical', 'behavioral')),
  trait_name     TEXT NOT NULL,
  trait_value    TEXT,
  evidence       TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_character_traits_character_id ON character_traits(character_id);


-- ── Character Aliases ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS character_aliases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id    UUID REFERENCES characters(id) ON DELETE CASCADE,
  alias           TEXT NOT NULL,
  first_seen_part INTEGER,
  usage_count     INTEGER DEFAULT 1,
  context_preview TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_aliases_character_id ON character_aliases(character_id);
CREATE INDEX IF NOT EXISTS idx_character_aliases_alias        ON character_aliases(alias);


-- ── Relationships ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relationships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_1_id    UUID REFERENCES characters(id) ON DELETE CASCADE,
  character_2_id    UUID REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT,
  status            TEXT,
  description       TEXT,
  key_moments       TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_relationships_character_1_id ON relationships(character_1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_character_2_id ON relationships(character_2_id);


-- ── Locations ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS locations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id            UUID REFERENCES story_worlds(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  type                TEXT CHECK (type IN ('indoor', 'outdoor', 'private', 'public')),
  significance        TEXT,
  first_mentioned_part INTEGER,
  importance          TEXT CHECK (importance IN ('major', 'minor'))
);

CREATE INDEX IF NOT EXISTS idx_locations_name     ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_world_id ON locations(world_id);


-- ── Location Aliases ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS location_aliases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     UUID REFERENCES locations(id) ON DELETE CASCADE,
  alias           TEXT NOT NULL,
  first_seen_part INTEGER,
  usage_count     INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_aliases_location_id ON location_aliases(location_id);
CREATE INDEX IF NOT EXISTS idx_location_aliases_alias       ON location_aliases(alias);


-- ── Location Usage ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS location_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     UUID REFERENCES locations(id) ON DELETE CASCADE,
  story_part_id   UUID REFERENCES story_parts(id) ON DELETE CASCADE,
  reference_count INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, story_part_id)
);

CREATE INDEX IF NOT EXISTS idx_location_usage_location_id   ON location_usage(location_id);
CREATE INDEX IF NOT EXISTS idx_location_usage_story_part_id ON location_usage(story_part_id);


-- ── Events ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_part_id      UUID REFERENCES story_parts(id) ON DELETE CASCADE,
  character_id       UUID REFERENCES characters(id) ON DELETE SET NULL,
  location_id        UUID REFERENCES locations(id) ON DELETE SET NULL,
  event_type         TEXT CHECK (event_type IN ('dialogue', 'action', 'revelation')),
  description        TEXT,
  content            TEXT,
  timestamp_in_story TEXT,
  significance       INTEGER
);

CREATE INDEX IF NOT EXISTS idx_events_story_part_id ON events(story_part_id);
CREATE INDEX IF NOT EXISTS idx_events_character_id  ON events(character_id);
CREATE INDEX IF NOT EXISTS idx_events_location_id   ON events(location_id);


-- ── Story Context ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS story_context (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT,
  key          TEXT,
  value        TEXT,
  notes        TEXT
);


-- ── Story Memory (single-row AI context cache) ──────────────────────────

CREATE TABLE IF NOT EXISTS story_memory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content      TEXT NOT NULL,
  part_count   INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── Flashbacks ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS flashbacks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT,
  content        TEXT NOT NULL,
  keywords       TEXT[],
  character_ids  UUID[],
  location_ids   UUID[],
  story_part_ids UUID[],
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashbacks_character_ids ON flashbacks USING GIN(character_ids);
CREATE INDEX IF NOT EXISTS idx_flashbacks_location_ids  ON flashbacks USING GIN(location_ids);
CREATE INDEX IF NOT EXISTS idx_flashbacks_keywords      ON flashbacks USING GIN(keywords);


-- ── Continuation Drafts ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS continuation_drafts (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id               UUID REFERENCES story_worlds(id) ON DELETE SET NULL,
  user_prompt            TEXT NOT NULL,
  character_focus        TEXT,
  generated_content      TEXT NOT NULL,
  revision_instructions  TEXT,
  tags                   TEXT[],
  side_notes             TEXT,
  scene_type             TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_continuation_drafts_created_at ON continuation_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuation_drafts_tags       ON continuation_drafts USING GIN(tags);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_continuation_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_continuation_drafts_updated_at_trigger ON continuation_drafts;
CREATE TRIGGER update_continuation_drafts_updated_at_trigger
BEFORE UPDATE ON continuation_drafts
FOR EACH ROW
EXECUTE FUNCTION update_continuation_drafts_updated_at();


-- ── Continuation History ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS continuation_history (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id               UUID REFERENCES continuation_drafts(id) ON DELETE CASCADE,
  user_prompt            TEXT NOT NULL,
  character_focus        TEXT,
  revision_instructions  TEXT,
  generated_content      TEXT NOT NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_continuation_history_draft_id   ON continuation_history(draft_id);
CREATE INDEX IF NOT EXISTS idx_continuation_history_created_at ON continuation_history(created_at DESC);


-- ── Continuation Branches ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS continuation_branches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_draft_id  UUID REFERENCES continuation_drafts(id) ON DELETE CASCADE,
  branch_name      TEXT NOT NULL,
  user_prompt      TEXT NOT NULL,
  character_focus  TEXT,
  generated_content TEXT NOT NULL,
  side_notes       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_continuation_branches_parent_draft_id ON continuation_branches(parent_draft_id);


-- ── Merge History (audit trail) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS merge_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type         TEXT CHECK (entity_type IN ('character', 'location')),
  primary_entity_id   UUID NOT NULL,
  primary_entity_name TEXT NOT NULL,
  merged_entity_ids   UUID[] NOT NULL,
  merged_entity_names TEXT[] NOT NULL,
  merged_at           TIMESTAMPTZ DEFAULT NOW(),
  notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_merge_history_entity_type       ON merge_history(entity_type);
CREATE INDEX IF NOT EXISTS idx_merge_history_primary_entity_id ON merge_history(primary_entity_id);


-- ── Scene Plans (kanban board) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scene_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id       UUID REFERENCES story_worlds(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  characters     TEXT[] DEFAULT '{}',
  location       TEXT,
  objectives     TEXT,
  mood           TEXT,
  status         TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'written', 'cut')),
  sort_order     INTEGER DEFAULT 0,
  target_part    INTEGER,
  target_chapter INTEGER,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scene_plans_world  ON scene_plans(world_id);
CREATE INDEX IF NOT EXISTS idx_scene_plans_status ON scene_plans(status);


-- ═══════════════════════════════════════════════════════════════════════════
-- Row-Level Security — permissive allow-all policies for every table
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE story_parts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_traits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_aliases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships          ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_aliases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_usage         ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_context          ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_memory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashbacks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuation_drafts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuation_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuation_branches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE merge_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_plans            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON story_parts            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON characters             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON character_traits       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON character_aliases      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON relationships          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON locations              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON location_aliases       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON location_usage         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON events                 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON story_context          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON story_memory           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON flashbacks             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON continuation_drafts    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON continuation_history   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON continuation_branches  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON merge_history          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON scene_plans            FOR ALL USING (true) WITH CHECK (true);
