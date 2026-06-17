/**
 * Top-K semantic search over the embedding index (plan §10).
 * Pure function — returns addition references and scores, never raw vectors.
 */

import type { EmbeddingEntry, SearchResult } from "@/types/embeddings";
import { cosineSimilarity } from "@/lib/embeddings/cosine";

export function topK(
  query: number[],
  entries: EmbeddingEntry[],
  k: number,
): SearchResult[] {
  return entries
    .map((entry) => ({
      chunkRef: entry.chunkRef,
      additionNumber: entry.additionNumber,
      score: cosineSimilarity(query, entry.vector),
      metadata: entry.metadata,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, k));
}
