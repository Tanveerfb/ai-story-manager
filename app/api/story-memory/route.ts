import { NextRequest, NextResponse } from "next/server";
import { supabase, getStoryParts } from "@/lib/supabase";
import { generateStoryMemory } from "@/lib/ollama";

// GET /api/story-memory — fetch current stored memory
export async function GET() {
  const { data, error } = await supabase
    .from("story_memory")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found (normal if no memory yet)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memory: data || null });
}

// POST /api/story-memory — generate new condensed memory from all story parts
export async function POST(request: NextRequest) {
  try {
    const { model } = await request.json().catch(() => ({ model: undefined }));

    // Fetch all story parts
    const parts = await getStoryParts();

    if (!parts || parts.length === 0) {
      return NextResponse.json(
        { error: "No story parts to summarize" },
        { status: 400 },
      );
    }

    // Build full story text
    const storyText = parts
      .map(
        (p: any) =>
          `Part ${p.part_number}${p.title ? ": " + p.title : ""}\n${p.content}`,
      )
      .join("\n\n---\n\n");

    // Generate condensed memory using AI
    const memoryContent = await generateStoryMemory(storyText, model);

    // Clear old memory and insert new
    await supabase
      .from("story_memory")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

    const { data: saved, error: saveError } = await supabase
      .from("story_memory")
      .insert({
        content: memoryContent,
        part_count: parts.length,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json(
        { error: `Failed to save memory: ${saveError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ memory: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate memory" },
      { status: 500 },
    );
  }
}

// DELETE /api/story-memory — clear stored memory
export async function DELETE() {
  const { error } = await supabase
    .from("story_memory")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
