import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get("world_id");
    const format = searchParams.get("format") || "markdown"; // markdown | text | json

    // Fetch story parts
    let query = supabase
      .from("story_parts")
      .select("*")
      .order("part_number", { ascending: true })
      .order("chapter_number", { ascending: true });
    if (worldId) query = query.eq("world_id", worldId);
    const { data: parts, error } = await query;
    if (error) throw error;

    // Optional: fetch world name
    let worldName = "Story";
    if (worldId) {
      const { data: world } = await supabase
        .from("story_worlds")
        .select("name")
        .eq("id", worldId)
        .single();
      if (world?.name) worldName = world.name;
    }

    if (!parts || parts.length === 0) {
      return NextResponse.json(
        { error: "No story parts to export" },
        { status: 400 },
      );
    }

    // Group by part
    const grouped: Record<number, typeof parts> = {};
    for (const p of parts) {
      const pn = p.part_number || 1;
      if (!grouped[pn]) grouped[pn] = [];
      grouped[pn].push(p);
    }

    if (format === "json") {
      return NextResponse.json({
        title: worldName,
        exported_at: new Date().toISOString(),
        total_words: parts.reduce((s, p) => s + (p.word_count || 0), 0),
        parts: Object.entries(grouped).map(([partNum, chapters]) => ({
          part_number: Number(partNum),
          chapters: chapters.map((c) => ({
            chapter_number: c.chapter_number,
            title: c.title,
            content: c.content,
            word_count: c.word_count,
          })),
        })),
      });
    }

    // Build Markdown or plain text
    const lines: string[] = [];
    const isMarkdown = format === "markdown";
    const divider = isMarkdown ? "\n---\n" : "\n" + "=".repeat(60) + "\n";

    // Title
    if (isMarkdown) {
      lines.push(`# ${worldName}\n`);
    } else {
      lines.push(worldName.toUpperCase());
      lines.push("=".repeat(worldName.length));
      lines.push("");
    }

    const totalWords = parts.reduce((s, p) => s + (p.word_count || 0), 0);
    lines.push(`Total words: ${totalWords.toLocaleString()}\n`);

    for (const [partNum, chapters] of Object.entries(grouped)) {
      // Part heading
      if (isMarkdown) {
        lines.push(`${divider}\n## Part ${partNum}\n`);
      } else {
        lines.push(`${divider}\nPART ${partNum}\n`);
      }

      for (const ch of chapters) {
        const chTitle = ch.title || `Chapter ${ch.chapter_number}`;
        if (isMarkdown) {
          lines.push(`### ${chTitle}\n`);
        } else {
          lines.push(`--- ${chTitle} ---\n`);
        }
        lines.push(ch.content || "");
        lines.push("");
      }
    }

    const content = lines.join("\n");
    const ext = isMarkdown ? "md" : "txt";
    const contentType = isMarkdown ? "text/markdown" : "text/plain";
    const filename = `${worldName.replace(/[^a-zA-Z0-9]/g, "_")}_export.${ext}`;

    return new Response(content, {
      headers: {
        "Content-Type": `${contentType}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Export failed" },
      { status: 500 },
    );
  }
}
