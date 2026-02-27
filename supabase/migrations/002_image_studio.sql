-- ═══════════════════════════════════════════════════════════════════════════
-- Image Studio — Tables for generated images & official character designs
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Generated Images ─────────────────────────────────────────────────────
-- Stores every image the user decides to save from the Image Studio.

CREATE TABLE IF NOT EXISTS generated_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID REFERENCES story_worlds(id) ON DELETE SET NULL,
  title           TEXT,
  prompt          TEXT NOT NULL,
  negative_prompt TEXT,
  image_url       TEXT NOT NULL,            -- base64 data-url or Supabase storage URL
  width           INTEGER DEFAULT 512,
  height          INTEGER DEFAULT 768,
  -- What kind of content: scene, character_design, environment, item, custom
  category        TEXT DEFAULT 'custom',
  -- Optional links to story entities
  character_ids   UUID[] DEFAULT '{}',
  story_part_ids  UUID[] DEFAULT '{}',
  location_ids    UUID[] DEFAULT '{}',
  -- Generation metadata
  model_used      TEXT,
  seed            BIGINT,
  steps           INTEGER,
  cfg_scale       REAL,
  tags            TEXT[] DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_images_world_id      ON generated_images(world_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_category      ON generated_images(category);
CREATE INDEX IF NOT EXISTS idx_generated_images_character_ids  ON generated_images USING GIN(character_ids);
CREATE INDEX IF NOT EXISTS idx_generated_images_story_part_ids ON generated_images USING GIN(story_part_ids);
CREATE INDEX IF NOT EXISTS idx_generated_images_tags           ON generated_images USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at     ON generated_images(created_at DESC);


-- ── Official Character Designs ───────────────────────────────────────────
-- When the user marks a generated image as the "official" design for a
-- character, it gets recorded here. Only one active design per character.

CREATE TABLE IF NOT EXISTS character_designs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id    UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  image_id        UUID REFERENCES generated_images(id) ON DELETE SET NULL,
  image_url       TEXT NOT NULL,
  design_notes    TEXT,                     -- e.g. "casual outfit", "battle gear"
  is_active       BOOLEAN DEFAULT TRUE,     -- only one active at a time per character
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_designs_character_id ON character_designs(character_id);
CREATE INDEX IF NOT EXISTS idx_character_designs_active       ON character_designs(character_id, is_active) WHERE is_active = TRUE;


-- ── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE generated_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_designs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON generated_images  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON character_designs FOR ALL USING (true) WITH CHECK (true);
