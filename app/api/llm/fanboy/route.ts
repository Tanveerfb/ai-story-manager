import { NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion } from "@/lib/llm/gateway";
import { buildSearchContext } from "@/lib/llm/context";
import { FANBOY } from "@/lib/llm/prompts";
import type { ChatMessage } from "@/types/llm";

/**
 * Fanboy Q&A (plan §11E, Batch 7). On the first message of a session a one-line
 * personality is inferred from the story and returned to the client, which
 * passes it back so the persona stays consistent. Context = story bible +
 * semantic search; the fan never predicts, spoils, or adds to the story.
 */
const bodySchema = z.object({
  baseUrl: z.string().url(),
  generationModel: z.string().min(1),
  embeddingModel: z.string().nullish(),
  personality: z.string().nullish(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const latest = body.messages[body.messages.length - 1].content;

  try {
    const context = await buildSearchContext({
      baseUrl: body.baseUrl,
      embeddingModel: body.embeddingModel,
      query: latest,
    });

    // Infer the fan's persona once per session.
    let personality = body.personality ?? null;
    if (!personality) {
      const { content } = await chatCompletion(body.baseUrl, {
        messages: [
          {
            role: "user",
            content: `Based on this story context, describe in ONE sentence the voice and personality of an enthusiastic fan of it. Output only that sentence.\n\n${context || "(no story content yet)"}`,
          },
        ],
        model: body.generationModel,
        temperature: 0.7,
      });
      personality = content.trim();
    }

    const system = `${FANBOY}\n\nYour persona for this session: ${personality}\n\n${context ? `Story context:\n${context}` : "The story has no content yet."}`;
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      ...body.messages,
    ];

    const { content } = await chatCompletion(body.baseUrl, {
      messages,
      model: body.generationModel,
      temperature: 0.8,
    });

    return NextResponse.json({ reply: content.trim(), personality });
  } catch (error) {
    console.error("[api/llm/fanboy]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fanboy failed" },
      { status: 502 },
    );
  }
}
