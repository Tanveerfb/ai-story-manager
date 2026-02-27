import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Warn if environment variables are not set (during development)
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "⚠️ Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
    );
  }
}

// Use placeholder values for build time, but will fail at runtime if not configured
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
);

// Helper functions for common queries

export async function getStoryParts(limit?: number, worldId?: string) {
  let query = supabase
    .from("story_parts")
    .select("*")
    .order("part_number", { ascending: true })
    .order("chapter_number", { ascending: true });

  if (worldId) query = query.eq("world_id", worldId);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getCharacters(roleFilter?: string, worldId?: string) {
  let query = supabase
    .from("characters")
    .select("*")
    .order("name", { ascending: true });

  if (roleFilter) query = query.eq("role", roleFilter);
  if (worldId) query = query.eq("world_id", worldId);

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getCharacterById(id: string) {
  const { data, error } = await supabase
    .from("characters")
    .select(
      `
      *,
      character_traits (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  // Fetch relationships in both directions
  const { data: rels1 } = await supabase
    .from("relationships")
    .select("*")
    .eq("character_1_id", id);

  const { data: rels2 } = await supabase
    .from("relationships")
    .select("*")
    .eq("character_2_id", id);

  // Deduplicate by id
  const relMap = new Map<string, any>();
  for (const r of [...(rels1 || []), ...(rels2 || [])]) {
    relMap.set(r.id, r);
  }

  return { ...data, relationships: Array.from(relMap.values()) };
}

export async function getLocations(worldId?: string) {
  let query = supabase
    .from("locations")
    .select("*")
    .order("name", { ascending: true });

  if (worldId) query = query.eq("world_id", worldId);

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getEvents(filters?: {
  storyPartId?: string;
  characterId?: string;
  locationId?: string;
}) {
  let query = supabase
    .from("events")
    .select("*, story_parts(*), characters(*), locations(*)");

  if (filters?.storyPartId) {
    query = query.eq("story_part_id", filters.storyPartId);
  }
  if (filters?.characterId) {
    query = query.eq("character_id", filters.characterId);
  }
  if (filters?.locationId) {
    query = query.eq("location_id", filters.locationId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function insertStoryPart(storyPart: {
  part_number: number;
  chapter_number?: number;
  title?: string;
  content: string;
  word_count?: number;
  summary?: string;
  world_id?: string | null;
}) {
  const { data, error } = await supabase
    .from("story_parts")
    .insert(storyPart)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertCharacter(character: any) {
  const { data, error } = await supabase
    .from("characters")
    .insert(character)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertLocation(location: any) {
  const { data, error } = await supabase
    .from("locations")
    .insert(location)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertEvent(event: any) {
  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertRelationship(relationship: any) {
  const { data, error } = await supabase
    .from("relationships")
    .insert(relationship)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertTheme(theme: {
  story_part_id: string;
  theme: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from("themes")
    .insert(theme)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getThemes(storyPartId?: string) {
  let query = supabase
    .from("themes")
    .select("*")
    .order("created_at", { ascending: true });

  if (storyPartId) {
    query = query.eq("story_part_id", storyPartId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// ── Supabase Storage helpers (Image Studio) ──────────────────────────────

const IMAGE_BUCKET = "story-images";

/**
 * Ensure the storage bucket exists. Creates it (public) if missing.
 * Safe to call repeatedly — idempotent.
 */
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === IMAGE_BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB max
    });
    if (error && !error.message?.includes("already exists")) {
      console.error("Failed to create storage bucket:", error);
      throw error;
    }
  }
}

/**
 * Upload a base64 data-URL image to Supabase Storage and return the public URL.
 * Falls back to returning the original data-URL if storage is unavailable.
 */
export async function uploadImageToStorage(
  base64DataUrl: string,
  folder = "gallery",
): Promise<string> {
  try {
    await ensureBucket();

    // Strip the data:image/...;base64, prefix
    const matches = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
    if (!matches) {
      console.warn("Not a valid base64 data URL, storing as-is");
      return base64DataUrl;
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const raw = matches[2];
    const buffer = Buffer.from(raw, "base64");
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: `image/${matches[1]}`,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "Storage upload failed, falling back to data URL:",
        uploadError,
      );
      return base64DataUrl;
    }

    const { data: urlData } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Storage upload error, falling back to data URL:", err);
    return base64DataUrl;
  }
}
