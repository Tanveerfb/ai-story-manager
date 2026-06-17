import { NextResponse } from "next/server";
import { z } from "zod";
import { createEmbedding } from "@/lib/llm/gateway";
import { readIndex } from "@/lib/fs/embeddings";
import { topK } from "@/lib/embeddings/search";
import { SEARCH_TOP_K } from "@/lib/constants";

/**
 * Semantic search: embed the query, score against the index, return the top-K
 * addition references (never raw vectors) — Batch 3, plan §10.
 */

const bodySchema = z.object({
  baseUrl: z.string().url(),
  model: z.string().min(1),
  query: z.string().min(1),
  topK: z.number().int().positive().max(50).optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const index = await readIndex();
    if (index.length === 0) {
      return NextResponse.json({ results: [] });
    }
    const { vector } = await createEmbedding(body.baseUrl, {
      input: body.query,
      model: body.model,
    });
    return NextResponse.json({
      results: topK(vector, index, body.topK ?? SEARCH_TOP_K),
    });
  } catch (error) {
    console.error("[api/llm/search]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 502 },
    );
  }
}
