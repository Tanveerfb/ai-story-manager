/**
 * Artifact extraction orchestration (plan §10, Batch 5). SERVER-ONLY.
 * Runs five typed extractions for one addition, normalizes the model's output,
 * and merges into the artifact files. Per-type policy: retry once, then flag
 * failed. authorOverride character fields are never overwritten, and existing
 * overrides are injected into the prompt as authoritative context.
 *
 * Local models name JSON keys loosely (e.g. "known locations", relationship
 * {person,type}), so each call gets an explicit shape spec and the output is
 * normalized defensively; the final stored objects are Zod-validated.
 */

import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { chatCompletion } from "@/lib/llm/gateway";
import { extractJson } from "@/lib/llm/parser";
import { artifactExtractorPrompt } from "@/lib/llm/prompts";
import { EXTRACTION_TEMPERATURE } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import { generateStoryBible } from "@/lib/bible";
import {
  characterSchema,
  factionSchema,
  loreEntrySchema,
  locationSchema,
  timelineEventSchema,
} from "@/types/artifacts";
import type {
  ArtifactType,
  Character,
  Faction,
  LoreEntry,
  Location,
  TimelineEvent,
} from "@/types/artifacts";
import type { StoryRef } from "@/types/story";
import {
  readCharacter,
  readCharacters,
  readFactions,
  readLocations,
  readLore,
  readTimeline,
  writeCharacter,
  writeFactions,
  writeLastSynced,
  writeLocations,
  writeLore,
  writeTimeline,
} from "@/lib/fs/artifacts";

type ExtractInput = {
  baseUrl: string;
  generationModel: string;
  part: string;
  chapter: string;
  additionNumber: number;
  text: string;
};

export type ExtractionSummary = {
  updated: Record<ArtifactType, number>;
  failed: ArtifactType[];
};

const SHAPE_HINT: Record<ArtifactType, string> = {
  characters:
    'Each item: {"name": string, "traits": string[], "relationships": [{"target": string, "kind": string}], "knownLocations": string[], "notes": string}.',
  locations: 'Each item: {"name": string, "description": string}.',
  timeline:
    'Each item: {"summary": string, "characters": string[], "location": string or null}.',
  factions: 'Each item: {"name": string, "description": string, "members": string[]}.',
  lore: 'Each item: {"term": string, "definition": string}.',
};

type Obj = Record<string, unknown>;
const rawArraySchema = z.array(z.record(z.string(), z.unknown()));

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const pick = (o: Obj, keys: string[]): unknown => {
  for (const k of keys) if (o[k] != null) return o[k];
  return undefined;
};
const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

/** Run one typed extraction, returning a raw object array (retry once). */
async function extractRaw(
  input: ExtractInput,
  type: ArtifactType,
  extraContext?: string,
): Promise<Obj[] | null> {
  const system = `${artifactExtractorPrompt(type)}\n${SHAPE_HINT[type]}\nRespond with ONLY a JSON array (no wrapper object, no prose).`;
  const user = `${extraContext ? `${extraContext}\n\n` : ""}Text:\n${input.text}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { content } = await chatCompletion(input.baseUrl, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      model: input.generationModel,
      temperature: EXTRACTION_TEMPERATURE,
    });
    try {
      const parsed = rawArraySchema.safeParse(JSON.parse(extractJson(content)));
      if (parsed.success) return parsed.data;
    } catch {
      // fall through to retry
    }
  }
  return null;
}

function normalizeRelationships(value: unknown): Character["relationships"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((r) => {
      const o = (r ?? {}) as Obj;
      return {
        target: asString(pick(o, ["target", "person", "name", "with"])).trim(),
        kind: asString(pick(o, ["kind", "type", "relationship"])).trim(),
        notes: asString(o.notes),
      };
    })
    .filter((r) => r.target.length > 0);
}

async function mergeCharacters(
  raw: Obj[],
  ref: StoryRef,
  additionNumber: number,
): Promise<number> {
  let count = 0;
  for (const o of raw) {
    const name = asString(pick(o, ["name", "character"])).trim();
    if (!name) continue;
    const slug = slugify(name);
    const existing = await readCharacter(slug);

    if (existing?.authorOverride) {
      await writeCharacter({
        ...existing,
        lastUpdatedAt: ref,
        lastUpdatedByAddition: additionNumber,
      });
      count++;
      continue;
    }

    const traits = asStringArray(pick(o, ["traits", "attributes"]));
    const knownLocations = asStringArray(
      pick(o, ["knownLocations", "known locations", "known_locations", "locations"]),
    );
    const notes = asString(o.notes);

    const candidate = {
      slug,
      name,
      firstAppearedAt: existing?.firstAppearedAt ?? ref,
      lastUpdatedAt: ref,
      lastUpdatedByAddition: additionNumber,
      authorOverride: false,
      authorOverrideNote: existing?.authorOverrideNote ?? null,
      traits: union(existing?.traits ?? [], traits),
      relationships: mergeRelationships(
        existing?.relationships ?? [],
        normalizeRelationships(o.relationships),
      ),
      knownLocations: union(existing?.knownLocations ?? [], knownLocations),
      notes: existing?.notes?.trim() ? existing.notes : notes,
    };

    const valid = characterSchema.safeParse(candidate);
    if (valid.success) {
      await writeCharacter(valid.data);
      count++;
    }
  }
  return count;
}

function mergeRelationships(
  existing: Character["relationships"],
  incoming: Character["relationships"],
): Character["relationships"] {
  const byTarget = new Map(existing.map((r) => [r.target, r]));
  for (const r of incoming) byTarget.set(r.target, r);
  return Array.from(byTarget.values());
}

function upsertBySlug<T extends { slug: string }>(items: T[], next: T): T[] {
  const idx = items.findIndex((i) => i.slug === next.slug);
  if (idx === -1) return [...items, next];
  const copy = [...items];
  copy[idx] = next;
  return copy;
}

export async function runExtraction(
  input: ExtractInput,
): Promise<ExtractionSummary> {
  const addition = String(input.additionNumber).padStart(3, "0");
  const ref: StoryRef = { part: input.part, chapter: input.chapter, addition };
  const updated: Record<ArtifactType, number> = {
    characters: 0,
    locations: 0,
    timeline: 0,
    factions: 0,
    lore: 0,
  };
  const failed: ArtifactType[] = [];

  const overrides = (await readCharacters()).filter(
    (c) => c.authorOverride && c.authorOverrideNote,
  );
  const overrideNote = overrides.length
    ? `Author-set, authoritative details (do not contradict):\n${overrides
        .map((c) => `- ${c.name}: ${c.authorOverrideNote}`)
        .join("\n")}`
    : undefined;

  const chars = await extractRaw(input, "characters", overrideNote);
  if (chars) updated.characters = await mergeCharacters(chars, ref, input.additionNumber);
  else failed.push("characters");

  const locs = await extractRaw(input, "locations");
  if (locs) {
    let items = await readLocations();
    for (const o of locs) {
      const name = asString(pick(o, ["name", "location"])).trim();
      if (!name) continue;
      const slug = slugify(name);
      const existing = items.find((i) => i.slug === slug);
      const candidate: Location = {
        slug,
        name,
        description: existing?.description?.trim()
          ? existing.description
          : asString(pick(o, ["description", "desc"])),
        notes: existing?.notes ?? "",
      };
      const valid = locationSchema.safeParse(candidate);
      if (valid.success) {
        items = upsertBySlug(items, valid.data);
        updated.locations++;
      }
    }
    await writeLocations(items);
  } else failed.push("locations");

  const events = await extractRaw(input, "timeline");
  if (events) {
    const timeline = await readTimeline();
    for (const o of events) {
      const summary = asString(pick(o, ["summary", "event", "description"])).trim();
      if (!summary) continue;
      const candidate: TimelineEvent = {
        id: randomUUID(),
        ref,
        summary,
        characters: asStringArray(pick(o, ["characters", "people"])),
        location: asString(pick(o, ["location", "place"])) || null,
      };
      const valid = timelineEventSchema.safeParse(candidate);
      if (valid.success) {
        timeline.push(valid.data);
        updated.timeline++;
      }
    }
    await writeTimeline(timeline);
  } else failed.push("timeline");

  const factions = await extractRaw(input, "factions");
  if (factions) {
    let items = await readFactions();
    for (const o of factions) {
      const name = asString(pick(o, ["name", "faction", "group"])).trim();
      if (!name) continue;
      const slug = slugify(name);
      const existing = items.find((i) => i.slug === slug);
      const candidate: Faction = {
        slug,
        name,
        description: existing?.description?.trim()
          ? existing.description
          : asString(pick(o, ["description", "desc"])),
        members: union(
          existing?.members ?? [],
          asStringArray(pick(o, ["members", "people"])),
        ),
      };
      const valid = factionSchema.safeParse(candidate);
      if (valid.success) {
        items = upsertBySlug(items, valid.data);
        updated.factions++;
      }
    }
    await writeFactions(items);
  } else failed.push("factions");

  const lore = await extractRaw(input, "lore");
  if (lore) {
    let items = await readLore();
    for (const o of lore) {
      const term = asString(pick(o, ["term", "name", "title"])).trim();
      if (!term) continue;
      const slug = slugify(term);
      const existing = items.find((i) => i.slug === slug);
      const candidate: LoreEntry = {
        slug,
        term,
        definition: existing?.definition?.trim()
          ? existing.definition
          : asString(pick(o, ["definition", "description", "meaning"])),
      };
      const valid = loreEntrySchema.safeParse(candidate);
      if (valid.success) {
        items = upsertBySlug(items, valid.data);
        updated.lore++;
      }
    }
    await writeLore(items);
  } else failed.push("lore");

  await writeLastSynced(input.additionNumber);

  // Refresh the always-injected story bible from the updated artifacts (§6).
  try {
    await generateStoryBible();
  } catch (error) {
    console.error("[extract: story bible refresh failed]", error);
  }

  return { updated, failed };
}
