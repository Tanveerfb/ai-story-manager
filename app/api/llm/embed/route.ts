import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createEmbedding } from "@/lib/llm/gateway";
import { appendEntry } from "@/lib/fs/embeddings";
import type { EmbeddingEntry } from "@/types/embeddings";

/** Embed a text chunk and append it to the index (Batch 3, plan §10). */

const bodySchema = z.object({
  baseUrl: z.string().url(),
  model: z.string().min(1),
  text: z.string().min(1),
  chunkRef: z.string().min(1),
  additionNumber: z.number().int().nonnegative(),
  metadata: z.object({
    part: z.string(),
    chapter: z.string(),
    characters: z.array(z.string()).default([]),
    location: z.string().nullable().default(null),
  }),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { vector } = await createEmbedding(body.baseUrl, {
      input: body.text,
      model: body.model,
    });
    const entry: EmbeddingEntry = {
      id: randomUUID(),
      chunkRef: body.chunkRef,
      additionNumber: body.additionNumber,
      vector,
      metadata: body.metadata,
    };
    await appendEntry(entry);
    return NextResponse.json({ id: entry.id }, { status: 201 });
  } catch (error) {
    console.error("[api/llm/embed]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Embedding failed" },
      { status: 502 },
    );
  }
}
