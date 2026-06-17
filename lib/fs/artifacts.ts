/**
 * Artifact storage (plan §6, Batch 5). SERVER-ONLY.
 * Characters get one file each (frequent, independent edits); the other types
 * are small arrays in single files.
 *   artifacts/characters/<slug>.json
 *   artifacts/{locations,timeline,factions,lore}.json
 *   artifacts/sync.json   — { lastSyncedAddition }
 */

import "server-only";
import path from "node:path";
import type {
  Character,
  Faction,
  LoreEntry,
  Location,
  TimelineEvent,
} from "@/types/artifacts";
import {
  appendJsonl,
  listFiles,
  readJson,
  readJsonl,
  storyRoot,
  writeJson,
} from "@/lib/fs/paths";

const artifactsDir = () => path.join(storyRoot(), "artifacts");
const charactersDir = () => path.join(artifactsDir(), "characters");
const characterFile = (slug: string) =>
  path.join(charactersDir(), `${slug}.json`);
const collectionFile = (name: string) =>
  path.join(artifactsDir(), `${name}.json`);
const timelineFile = () => path.join(artifactsDir(), "timeline.jsonl");
const syncFile = () => path.join(artifactsDir(), "sync.json");

export async function readCharacters(): Promise<Character[]> {
  const files = await listFiles(charactersDir(), ".json");
  const chars = await Promise.all(
    files.map((f) => readJson<Character>(path.join(charactersDir(), f))),
  );
  return chars.filter((c): c is Character => c !== null);
}

export async function readCharacter(slug: string): Promise<Character | null> {
  return readJson<Character>(characterFile(slug));
}

export async function writeCharacter(character: Character): Promise<void> {
  await writeJson(characterFile(character.slug), character);
}

export async function readLocations(): Promise<Location[]> {
  return (await readJson<Location[]>(collectionFile("locations"))) ?? [];
}
export async function writeLocations(items: Location[]): Promise<void> {
  await writeJson(collectionFile("locations"), items);
}

/**
 * Timeline is append-only JSON Lines (timeline.jsonl): one line per event, no
 * full-array rewrite, so it stays linear for an indefinitely long story. A
 * legacy timeline.json array is read and merged for back-compat; events are
 * deduped by id (later wins).
 */
export async function readTimeline(): Promise<TimelineEvent[]> {
  const legacy =
    (await readJson<TimelineEvent[]>(collectionFile("timeline"))) ?? [];
  const lines = await readJsonl<TimelineEvent>(timelineFile());
  const byId = new Map<string, TimelineEvent>();
  for (const event of [...legacy, ...lines]) byId.set(event.id, event);
  return Array.from(byId.values());
}
export async function appendTimelineEvent(event: TimelineEvent): Promise<void> {
  await appendJsonl(timelineFile(), event);
}

export async function readFactions(): Promise<Faction[]> {
  return (await readJson<Faction[]>(collectionFile("factions"))) ?? [];
}
export async function writeFactions(items: Faction[]): Promise<void> {
  await writeJson(collectionFile("factions"), items);
}

export async function readLore(): Promise<LoreEntry[]> {
  return (await readJson<LoreEntry[]>(collectionFile("lore"))) ?? [];
}
export async function writeLore(items: LoreEntry[]): Promise<void> {
  await writeJson(collectionFile("lore"), items);
}

export async function readLastSynced(): Promise<number | null> {
  const data = await readJson<{ lastSyncedAddition: number }>(syncFile());
  return data?.lastSyncedAddition ?? null;
}
export async function writeLastSynced(additionNumber: number): Promise<void> {
  await writeJson(syncFile(), { lastSyncedAddition: additionNumber });
}
