-- Migration 005: Story Memory table for AI context compression
-- Run this in the Supabase SQL editor

-- Condensed AI memory of the story so far
-- Used to keep context within token limits for long stories
CREATE TABLE IF NOT EXISTS story_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  part_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active memory at a time (we delete old rows when generating new)
-- No foreign keys needed — this is a project-wide single-row cache
