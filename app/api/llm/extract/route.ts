import { NextResponse } from "next/server";
import { z } from "zod";
import { runExtraction } from "@/lib/llm/extract";

/**
 * Artifact extraction endpoint (Batch 5). Runs all five typed extractions for
 * one addition server-side and returns per-type counts + any failures.
 */

const bodySchema = z.object({
  baseUrl: z.string().url(),
  generationModel: z.string().min(1),
  part: z.string().min(1),
  chapter: z.string().min(1),
  additionNumber: z.number().int().nonnegative(),
  text: z.string().min(1),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const summary = await runExtraction(body);
    // A run that failed every type is treated as a job failure (queue retries).
    if (summary.failed.length === 5) {
      return NextResponse.json(
        { error: "All extractions failed", ...summary },
        { status: 502 },
      );
    }
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[api/llm/extract]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 502 },
    );
  }
}
