// Extracted entities interface
export interface ExtractedEntities {
  characters?: Array<{
    name: string;
    role?: string;
    description?: string;
    personality?: string;
    traits?: string[];
    goals?: string;
    arc?: string;
    backstory?: string;
    physical_traits?: any;
  }>;
  locations?: Array<{
    name: string;
    description?: string;
    type?: string;
    atmosphere?: string;
    significance?: string;
  }>;
  events?: Array<{
    event_type?: string;
    description?: string;
    content?: string;
    participants?: string[];
    emotional_impact?: string;
    consequences?: string;
    significance?: string;
  }>;
  relationships?: Array<{
    character_1: string;
    character_2: string;
    relationship_type?: string;
    description?: string;
    dynamic?: string;
    development?: string;
  }>;
  themes?: string[];
  summary?: string;
}

// Type aliases for better type safety
type Character = NonNullable<ExtractedEntities["characters"]>[number];
type Location = NonNullable<ExtractedEntities["locations"]>[number];

// Merge and deduplicate entities from multiple extraction chunks
export function mergeEntities(
  entitiesArray: ExtractedEntities[],
): ExtractedEntities {
  const merged: ExtractedEntities = {
    characters: [],
    locations: [],
    events: [],
    relationships: [],
    themes: [],
    summary: "",
  };

  const characterMap = new Map<string, Character>();
  const locationMap = new Map<string, Location>();
  const relationshipSet = new Set<string>();
  const themeSet = new Set<string>();

  for (const entities of entitiesArray) {
    // Merge characters (deduplicate by name)
    if (entities.characters) {
      for (const char of entities.characters) {
        const key = char.name.toLowerCase().trim();
        if (!characterMap.has(key)) {
          characterMap.set(key, char);
        } else {
          // Merge data, preferring longer/richer descriptions
          const existing = characterMap.get(key)!;

          if (
            char.description &&
            char.description.length > (existing.description?.length || 0)
          ) {
            existing.description = char.description;
          }
          if (
            char.personality &&
            char.personality.length > (existing.personality?.length || 0)
          ) {
            existing.personality = char.personality;
          }
          if (char.goals && char.goals.length > (existing.goals?.length || 0)) {
            existing.goals = char.goals;
          }
          if (char.arc) {
            existing.arc = (existing.arc || "") + " " + char.arc;
          }
          if (
            char.backstory &&
            char.backstory.length > (existing.backstory?.length || 0)
          ) {
            existing.backstory = char.backstory;
          }

          // Merge traits arrays
          if (char.traits && Array.isArray(char.traits)) {
            const existingTraits = Array.isArray(existing.traits)
              ? existing.traits
              : [];
            existing.traits = [...new Set([...existingTraits, ...char.traits])];
          }
        }
      }
    }

    // Merge locations
    if (entities.locations) {
      for (const loc of entities.locations) {
        const key = loc.name.toLowerCase().trim();
        if (!locationMap.has(key)) {
          locationMap.set(key, loc);
        } else {
          const existing = locationMap.get(key)!;
          if (
            loc.description &&
            loc.description.length > (existing.description?.length || 0)
          ) {
            existing.description = loc.description;
          }
          if (loc.atmosphere && !existing.atmosphere) {
            existing.atmosphere = loc.atmosphere;
          }
          if (loc.significance && !existing.significance) {
            existing.significance = loc.significance;
          }
        }
      }
    }

    // Merge events (keep all, they're unique)
    if (entities.events) {
      merged.events!.push(...entities.events);
    }

    // Merge relationships (deduplicate by character pair)
    if (entities.relationships) {
      for (const rel of entities.relationships) {
        const key = [rel.character_1, rel.character_2]
          .sort()
          .join("|")
          .toLowerCase();
        if (!relationshipSet.has(key)) {
          relationshipSet.add(key);
          merged.relationships!.push(rel);
        }
      }
    }

    // Merge themes
    if (entities.themes && Array.isArray(entities.themes)) {
      entities.themes.forEach((theme) => {
        if (theme && theme.trim()) {
          themeSet.add(theme.trim().toLowerCase());
        }
      });
    }

    // Combine summaries
    if (entities.summary) {
      merged.summary += (merged.summary ? " " : "") + entities.summary;
    }
  }

  merged.characters = Array.from(characterMap.values());
  merged.locations = Array.from(locationMap.values());
  merged.themes = Array.from(themeSet);

  return merged;
}

// Clean text by removing extra whitespace and normalizing line breaks
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// Count words in text
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

// Chunk text into smaller pieces for processing
export function chunkText(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }

  return chunks;
}
