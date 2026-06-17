import { z } from "zod";

/**
 * Zod schemas for all artifact types. Extraction responses from the LLM are
 * validated against these before anything touches the filesystem (plan §5/§10).
 * Types are inferred from the schemas so there is a single source of truth.
 */

export const storyRefSchema = z.object({
  part: z.string(),
  chapter: z.string(),
  addition: z.string(),
});

export const relationshipSchema = z.object({
  /** Slug of the related character. */
  target: z.string(),
  /** Free-text descriptor, e.g. "sister", "rival". */
  kind: z.string(),
  notes: z.string().default(""),
});

export const characterSchema = z.object({
  slug: z.string(),
  name: z.string(),
  firstAppearedAt: storyRefSchema.nullable().default(null),
  lastUpdatedAt: storyRefSchema.nullable().default(null),
  lastUpdatedByAddition: z.number().nullable().default(null),
  /** Set true when the author manually edits this profile. */
  authorOverride: z.boolean().default(false),
  authorOverrideNote: z.string().nullable().default(null),
  traits: z.array(z.string()).default([]),
  relationships: z.array(relationshipSchema).default([]),
  knownLocations: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

export const locationSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().default(""),
  notes: z.string().default(""),
});

export const timelineEventSchema = z.object({
  id: z.string(),
  /** Where in the story this event was described. */
  ref: storyRefSchema,
  summary: z.string(),
  characters: z.array(z.string()).default([]),
  location: z.string().nullable().default(null),
});

export const factionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().default(""),
  members: z.array(z.string()).default([]),
});

export const loreEntrySchema = z.object({
  slug: z.string(),
  term: z.string(),
  definition: z.string().default(""),
});

export type Relationship = z.infer<typeof relationshipSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Location = z.infer<typeof locationSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type Faction = z.infer<typeof factionSchema>;
export type LoreEntry = z.infer<typeof loreEntrySchema>;

/** Discriminator used to select the right schema/prompt per extraction call. */
export type ArtifactType =
  | "characters"
  | "locations"
  | "timeline"
  | "factions"
  | "lore";

/** All artifact collections, as returned to the dashboard. */
export type ArtifactBundle = {
  characters: Character[];
  locations: Location[];
  timeline: TimelineEvent[];
  factions: Faction[];
  lore: LoreEntry[];
  lastSyncedAddition: number | null;
};
