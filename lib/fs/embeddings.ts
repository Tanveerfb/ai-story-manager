/**
 * Embedding index read/write (plan §10). SERVER-ONLY.
 *
 * Stored as append-only JSON Lines (index.jsonl): each embed appends one line
 * (O(1)) instead of rewriting the whole array (which was O(n) per write, O(n²)
 * over a story). Reads dedup by chunkRef, last write winning, so re-embedding a
 * chunk supersedes its earlier line without an in-place rewrite. A legacy
 * single-array index.json is still read and merged for back-compat.
 */

import "server-only";
import path from "node:path";
import type { EmbeddingEntry } from "@/types/embeddings";
import {
  appendJsonl,
  readJson,
  readJsonl,
  storyRoot,
} from "@/lib/fs/paths";

const indexFile = () => path.join(storyRoot(), "embeddings", "index.jsonl");
const legacyIndexFile = () =>
  path.join(storyRoot(), "embeddings", "index.json");

/** Last entry per chunkRef wins (newer re-embeds supersede older lines). */
function dedupByChunkRef(entries: EmbeddingEntry[]): EmbeddingEntry[] {
  const byRef = new Map<string, EmbeddingEntry>();
  for (const entry of entries) byRef.set(entry.chunkRef, entry);
  return Array.from(byRef.values());
}

export async function readIndex(): Promise<EmbeddingEntry[]> {
  const legacy = (await readJson<EmbeddingEntry[]>(legacyIndexFile())) ?? [];
  const lines = await readJsonl<EmbeddingEntry>(indexFile());
  // Legacy first so appended lines (newer) win on duplicate chunkRefs.
  return dedupByChunkRef([...legacy, ...lines]);
}

/** Append a new entry. Supersession of an existing chunkRef is handled on read. */
export async function appendEntry(entry: EmbeddingEntry): Promise<void> {
  await appendJsonl(indexFile(), entry);
}
