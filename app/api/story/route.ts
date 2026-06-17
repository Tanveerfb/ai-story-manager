import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAddition,
  createChapter,
  createPart,
  getStoryTree,
} from "@/lib/fs/story";

/**
 * Story CRUD endpoint (Batch 2). The filesystem is encapsulated server-side in
 * lib/fs/* — the client only ever talks to these typed actions, never raw paths.
 */

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("createPart"),
    title: z.string().optional(),
    timeGapNote: z.string().nullish(),
  }),
  z.object({
    action: z.literal("createChapter"),
    part: z.string().min(1),
    title: z.string().optional(),
  }),
  z.object({
    action: z.literal("createAddition"),
    part: z.string().min(1),
    chapter: z.string().min(1),
    content: z.string().min(1),
  }),
]);

export async function GET() {
  try {
    return NextResponse.json(await getStoryTree());
  } catch (error) {
    console.error("[api/story GET]", error);
    return NextResponse.json(
      { error: "Failed to read story data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: z.infer<typeof actionSchema>;
  try {
    body = actionSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "createPart":
        return NextResponse.json(
          await createPart(body.title, body.timeGapNote),
          { status: 201 },
        );
      case "createChapter":
        return NextResponse.json(
          await createChapter(body.part, body.title),
          { status: 201 },
        );
      case "createAddition":
        return NextResponse.json(
          await createAddition(body.part, body.chapter, body.content),
          { status: 201 },
        );
    }
  } catch (error) {
    console.error("[api/story POST]", error);
    return NextResponse.json(
      { error: "Story operation failed" },
      { status: 500 },
    );
  }
}
