import { NextRequest, NextResponse } from "next/server";
import { getStoryParts, insertStoryPart } from "@/lib/supabase";
import { generateStorySummary } from "@/lib/ollama";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = searchParams.get("limit");

    const parts = await getStoryParts();

    // If action is summarize, generate a summary of recent parts
    if (action === "summarize") {
      const limitNum = limit ? parseInt(limit) : 3;
      const recentParts = parts.slice(-limitNum);

      if (recentParts.length === 0) {
        return NextResponse.json({
          summary: "No story parts found yet. Start creating your story!",
        });
      }

      // Combine recent parts content for summarization
      const combinedContent = recentParts
        .map((part: any) => `Part ${part.part_number}: ${part.content}`)
        .join("\n\n");

      const summary = await generateStorySummary(combinedContent);

      return NextResponse.json({
        summary,
        partsCount: recentParts.length,
      });
    }

    return NextResponse.json(parts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch story parts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const part = await insertStoryPart(body);
    return NextResponse.json(part);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create story part" },
      { status: 500 },
    );
  }
}
