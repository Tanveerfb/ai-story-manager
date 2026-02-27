export interface Character {
  id?: string;
  name: string;
  role?: "main" | "side" | "minor";
  description?: string | null;
  personality?: string | null;
  physical_traits?: string | null; // JSON string of traits array
  traits?: string[]; // Temporary array before saving
  // Behavioral profile
  behavior_notes?: string | null; // How they react in different situations
  speech_patterns?: string | null; // How they talk, vocabulary, tone
  fears?: string | null; // What frightens or unsettles them
  motivations?: string | null; // What drives them forward
  relationships_summary?: string | null; // Their view of other characters
  arc_notes?: string | null; // Where their story arc is heading
  first_appearance_part?: number;
  avatar_url?: string | null;
  background?: string | null;
  created_at?: string;
}

export interface Location {
  id?: string;
  name: string;
  description?: string | null;
  type?: "indoor" | "outdoor" | "mystical" | "unknown";
  importance?: "major" | "minor";
  first_mentioned_part?: number;
  created_at?: string;
}

export interface StoryEvent {
  id?: string;
  story_part_id: string;
  event_type?: "action" | "dialogue" | "description" | "revelation";
  description: string;
  content?: string | null;
  significance?: number;
  created_at?: string;
}

export interface Relationship {
  id?: string;
  character_1_id: string;
  character_2_id: string;
  relationship_type: string;
  description?: string | null;
  created_at?: string;
}

export interface ExtractedEntities {
  characters: Array<{
    name: string;
    role?: string;
    personality?: string;
    traits?: string[];
    description?: string;
  }>;
  locations: Array<{
    name: string;
    description?: string;
    type?: string;
  }>;
  events: Array<{
    description: string;
    event_type?: string;
    content?: string;
  }>;
  relationships: Array<{
    character_1: string;
    character_2: string;
    relationship_type: string;
    description?: string;
  }>;
  summary?: string;
}

// ── Image Studio types ──────────────────────────────────────────────────

export interface GeneratedImage {
  id?: string;
  world_id?: string;
  title?: string | null;
  prompt: string;
  negative_prompt?: string | null;
  image_url: string;
  width?: number;
  height?: number;
  category?: "scene" | "character_design" | "environment" | "item" | "custom";
  character_ids?: string[];
  story_part_ids?: string[];
  location_ids?: string[];
  model_used?: string | null;
  seed?: number | null;
  steps?: number | null;
  cfg_scale?: number | null;
  tags?: string[];
  notes?: string | null;
  created_at?: string;
}

export interface CharacterDesign {
  id?: string;
  character_id: string;
  image_id?: string | null;
  image_url: string;
  design_notes?: string | null;
  is_active?: boolean;
  created_at?: string;
  // Joined fields
  character?: Character;
  generated_image?: GeneratedImage;
}
