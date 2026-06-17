import { NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion } from "@/lib/llm/gateway";
import { buildFormatterContext } from "@/lib/llm/context";
import { summarizeChanges } from "@/lib/diff";
import { PROSE_FORMATTER } from "@/lib/llm/prompts";
import { FORMATTER_TEMPERATURE } from "@/lib/constants";
import type { ChatMessage } from "@/types/llm";

/**
 * Prose formatter endpoint (Batch 4, plan §11). Builds the context window,
 * runs PROSE_FORMATTER, and returns the draft plus a plain-language change
 * summary. Adjustment turns are replayed so the loop keeps full history.
 */

const bodySchema = z.object({
  baseUrl: z.string().url(),
  generationModel: z.string().min(1),
  embeddingModel: z.string().nullish(),
  part: z.string().min(1),
  chapter: z.string().min(1),
  rawInput: z.string().min(1),
  adjustments: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const context = await buildFormatterContext({
      baseUrl: body.baseUrl,
      embeddingModel: body.embeddingModel,
      part: body.part,
      chapter: body.chapter,
      rawInput: body.rawInput,
    });

    const messages: ChatMessage[] = [
      { role: "system", content: PROSE_FORMATTER },
      {
        role: "user",
        content: context
          ? `${context}\n\n# Author's raw input\n${body.rawInput}`
          : `# Author's raw input\n${body.rawInput}`,
      },
      ...body.adjustments,
    ];

    const { content } = await chatCompletion(body.baseUrl, {
      messages,
      model: body.generationModel,
      temperature: FORMATTER_TEMPERATURE,
    });
    const prose = content.trim();

    return NextResponse.json({
      prose,
      summary: summarizeChanges(body.rawInput, prose),
    });
  } catch (error) {
    console.error("[api/llm/format]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Formatting failed" },
      { status: 502 },
    );
  }
}
