/**
 * Embedding index read/write (plan §10). SERVER-ONLY.
 * Single JSON file is sufficient for a single-story v1 — no vector DB (plan §15).
 */

import "server-only";
import path from "node:path";
import type { EmbeddingEntry } from "@/types/embeddings";
import { readJson, storyRoot, writeJson } from "@/lib/fs/paths";

const indexFile = () =>
  path.join(storyRoot(), "embeddings", "index.json");

export async function readIndex(): Promise<EmbeddingEntry[]> {
  return (await readJson<EmbeddingEntry[]>(indexFile())) ?? [];
}

/** Append a new entry, replacing any existing entry for the same chunkRef. */
export async function appendEntry(entry: EmbeddingEntry): Promise<void> {
  const index = await readIndex();
  const next = index.filter((e) => e.chunkRef !== entry.chunkRef);
  next.push(entry);
  await writeJson(indexFile(), next);
}
