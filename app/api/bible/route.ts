import { NextResponse } from "next/server";
import { z } from "zod";
import { readStoryBible } from "@/lib/fs/bible";
import { updateAnnotations } from "@/lib/bible";

/** Read the story bible, and save author annotations (plan §6, Batch 6). */
export async function GET() {
  try {
    return NextResponse.json(await readStoryBible());
  } catch (error) {
    console.error("[api/bible GET]", error);
    return NextResponse.json({ error: "Failed to read bible" }, { status: 500 });
  }
}

const bodySchema = z.object({ annotations: z.string() });

export async function PUT(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    return NextResponse.json(await updateAnnotations(body.annotations));
  } catch (error) {
    console.error("[api/bible PUT]", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
