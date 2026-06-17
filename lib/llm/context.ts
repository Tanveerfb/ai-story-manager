/**
 * CONTEXT_BUILDER (plan §9). Assembles the context window for a prose-format
 * call, in order: story bible → top-K semantically relevant past additions →
 * last 2 additions verbatim. The author's raw input is added by the caller.
 * SERVER-ONLY. Semantic search is best-effort — it never blocks formatting.
 */

import "server-only";
import { createEmbedding } from "@/lib/llm/gateway";
import { readIndex } from "@/lib/fs/embeddings";
import { topK } from "@/lib/embeddings/search";
import { listAdditions, readAdditionByRef } from "@/lib/fs/story";
import { readStoryBible } from "@/lib/fs/bible";
import { SEARCH_TOP_K } from "@/lib/constants";

type ContextOptions = {
  baseUrl: string;
  embeddingModel?: string | null;
  part: string;
  chapter: string;
  rawInput: string;
};

export async function buildFormatterContext(
  opts: ContextOptions,
): Promise<string> {
  const sections: string[] = [];

  const bible = await readStoryBible();
  if (bible?.content) {
    const notes = bible.annotations
      ? `\n\nAuthor notes:\n${bible.annotations}`
      : "";
    sections.push(`# Story bible\n${bible.content}${notes}`);
  }

  if (opts.embeddingModel) {
    try {
      const index = await readIndex();
      if (index.length > 0) {
        const { vector } = await createEmbedding(opts.baseUrl, {
          input: opts.rawInput,
          model: opts.embeddingModel,
        });
        const results = topK(vector, index, SEARCH_TOP_K);
        const texts = await Promise.all(
          results.map((r) => readAdditionByRef(r.chunkRef)),
        );
        const relevant = texts.filter((t): t is string => Boolean(t?.trim()));
        if (relevant.length > 0) {
          sections.push(
            `# Relevant past passages\n${relevant.join("\n\n---\n\n")}`,
          );
        }
      }
    } catch (error) {
      console.error("[context: semantic search skipped]", error);
    }
  }

  const recent = (await listAdditions(opts.part, opts.chapter)).slice(-2);
  if (recent.length > 0) {
    sections.push(
      `# Most recent passages (verbatim)\n${recent
        .map((a) => a.content)
        .join("\n\n")}`,
    );
  }

  return sections.join("\n\n");
}

/**
 * Read-time context for Q&A modes (fanboy, simulation): story bible plus the
 * top-K semantically relevant past passages for a query. No recency anchor.
 */
export async function buildSearchContext(opts: {
  baseUrl: string;
  embeddingModel?: string | null;
  query: string;
}): Promise<string> {
  const sections: string[] = [];

  const bible = await readStoryBible();
  if (bible?.content) {
    const notes = bible.annotations
      ? `\n\nAuthor notes:\n${bible.annotations}`
      : "";
    sections.push(`# Story bible\n${bible.content}${notes}`);
  }

  if (opts.embeddingModel) {
    try {
      const index = await readIndex();
      if (index.length > 0) {
        const { vector } = await createEmbedding(opts.baseUrl, {
          input: opts.query,
          model: opts.embeddingModel,
        });
        const results = topK(vector, index, SEARCH_TOP_K);
        const texts = await Promise.all(
          results.map((r) => readAdditionByRef(r.chunkRef)),
        );
        const relevant = texts.filter((t): t is string => Boolean(t?.trim()));
        if (relevant.length > 0) {
          sections.push(
            `# Relevant passages\n${relevant.join("\n\n---\n\n")}`,
          );
        }
      }
    } catch (error) {
      console.error("[search context skipped]", error);
    }
  }

  return sections.join("\n\n");
}
