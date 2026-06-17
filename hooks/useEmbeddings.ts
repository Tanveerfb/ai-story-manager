"use client";

import { useSettingsStore } from "@/store/useSettingsStore";
import type { SearchResult } from "@/types/embeddings";

/**
 * Client helper for semantic search (plan §10). Embedding writes go through the
 * background queue (useProcessingQueue); this hook covers read-time search used
 * when building context for the prose editor (Batch 4).
 */
export function useEmbeddings() {
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const model = useSettingsStore((s) => s.embeddingModel);

  async function search(query: string, topK?: number): Promise<SearchResult[]> {
    if (!model) throw new Error("No embedding model configured in settings");
    const res = await fetch("/api/llm/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl, model, query, topK }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.error ?? `Search failed: ${res.status}`);
    }
    const data = (await res.json()) as { results: SearchResult[] };
    return data.results;
  }

  return { search };
}
