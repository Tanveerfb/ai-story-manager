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
  listFiles,
  readJson,
  storyRoot,
  writeJson,
} from "@/lib/fs/paths";

const artifactsDir = () => path.join(storyRoot(), "artifacts");
const charactersDir = () => path.join(artifactsDir(), "characters");
const characterFile = (slug: string) =>
  path.join(charactersDir(), `${slug}.json`);
const collectionFile = (name: string) =>
  path.join(artifactsDir(), `${name}.json`);
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

export async function readTimeline(): Promise<TimelineEvent[]> {
  return (await readJson<TimelineEvent[]>(collectionFile("timeline"))) ?? [];
}
export async function writeTimeline(items: TimelineEvent[]): Promise<void> {
  await writeJson(collectionFile("timeline"), items);
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
