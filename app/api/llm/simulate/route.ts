import { NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion } from "@/lib/llm/gateway";
import { buildSearchContext } from "@/lib/llm/context";
import { extractJson } from "@/lib/llm/parser";
import { CHARACTER_SIMULATOR } from "@/lib/llm/prompts";
import { ensureStory, getStoryTree } from "@/lib/fs/story";
import { MAX_SIMULATED_CHARACTERS } from "@/lib/constants";
import type { ChatMessage } from "@/types/llm";

/**
 * Character simulation (plan §11D, Batch 8). Two actions:
 *  - reply:  the simulated character(s) respond in-character.
 *  - suggest: recommend an insertion point for a finalized scene, with reasoning.
 */
const replySchema = z.object({
  action: z.literal("reply"),
  baseUrl: z.string().url(),
  generationModel: z.string().min(1),
  embeddingModel: z.string().nullish(),
  simulatedCharacters: z.array(z.string()).min(1).max(MAX_SIMULATED_CHARACTERS),
  userCharacter: z.string().min(1),
  privateNotes: z.string().default(""),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "character"]),
        content: z.string(),
      }),
    )
    .min(1),
});

const suggestSchema = z.object({
  action: z.literal("suggest"),
  baseUrl: z.string().url(),
  generationModel: z.string().min(1),
  sceneText: z.string().min(1),
});

const bodySchema = z.discriminatedUnion("action", [replySchema, suggestSchema]);

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    if (body.action === "reply") return await handleReply(body);
    return await handleSuggest(body);
  } catch (error) {
    console.error("[api/llm/simulate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 502 },
    );
  }
}

async function handleReply(body: z.infer<typeof replySchema>) {
  const latest = body.messages[body.messages.length - 1].content;
  const context = await buildSearchContext({
    baseUrl: body.baseUrl,
    embeddingModel: body.embeddingModel,
    query: latest,
  });

  const privateBlock = body.privateNotes.trim()
    ? `\n\nPrivate session knowledge (known to you, not yet in the story):\n${body.privateNotes}`
    : "";
  const system = `${CHARACTER_SIMULATOR}\n\nYou play: ${body.simulatedCharacters.join(
    " and ",
  )}. The author plays: ${body.userCharacter}.${privateBlock}\n\n${
    context ? `Story context:\n${context}` : "The story has no content yet."
  }`;

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...body.messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
  ];

  const { content } = await chatCompletion(body.baseUrl, {
    messages,
    model: body.generationModel,
    temperature: 0.85,
  });
  return NextResponse.json({ reply: content.trim() });
}

async function handleSuggest(body: z.infer<typeof suggestSchema>) {
  const meta = await ensureStory();
  const { parts } = await getStoryTree();
  const options = parts.flatMap((p) =>
    p.chapters.map((c) => `${p.slug}/${c.slug} — ${p.title} › ${c.title}`),
  );

  const fallback = {
    part: meta.currentPart,
    chapter: meta.currentChapter,
    reasoning: "Defaulted to the current chapter.",
  };
  if (options.length === 0) return NextResponse.json(fallback);

  const { content } = await chatCompletion(body.baseUrl, {
    messages: [
      {
        role: "user",
        content: `Given this scene and the list of chapters, pick the best chapter to insert the scene into. Respond ONLY as JSON: {"part":"part-XX","chapter":"ch-XX","reasoning":"..."}.\n\nChapters:\n${options.join(
          "\n",
        )}\n\nScene:\n${body.sceneText}`,
      },
    ],
    model: body.generationModel,
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(extractJson(content)) as {
      part?: string;
      chapter?: string;
      reasoning?: string;
    };
    const valid = parts.some(
      (p) => p.slug === parsed.part && p.chapters.some((c) => c.slug === parsed.chapter),
    );
    if (valid && parsed.part && parsed.chapter) {
      return NextResponse.json({
        part: parsed.part,
        chapter: parsed.chapter,
        reasoning: parsed.reasoning ?? "",
      });
    }
  } catch {
    // fall through to fallback
  }
  return NextResponse.json(fallback);
}
