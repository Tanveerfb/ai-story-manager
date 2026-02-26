import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get("world_id");
    const characterId = searchParams.get("character_id");

    // Fetch characters
    let charQuery = supabase
      .from("characters")
      .select("id, name, role, arc_notes, goals, fears, motivations")
      .order("name", { ascending: true });
    if (worldId) charQuery = charQuery.eq("world_id", worldId);
    if (characterId) charQuery = charQuery.eq("id", characterId);
    const { data: characters, error: charError } = await charQuery;
    if (charError) throw charError;

    // Fetch story parts
    let storyQuery = supabase
      .from("story_parts")
      .select("id, title, content, part_number, chapter_number")
      .order("part_number", { ascending: true })
      .order("chapter_number", { ascending: true });
    if (worldId) storyQuery = storyQuery.eq("world_id", worldId);
    const { data: parts, error: storyError } = await storyQuery;
    if (storyError) throw storyError;

    if (!characters || !parts) {
      return NextResponse.json({ arcs: [] });
    }

    // Build arc data: for each character, find which chapters they appear in
    const arcs = characters.map((char) => {
      const nameRegex = new RegExp(
        char.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );

      const appearances = parts
        .map((p) => {
          if (!p.content) return null;
          const matches = p.content.match(nameRegex);
          if (!matches || matches.length === 0) return null;

          // Try to detect emotional context around mentions
          const snippets: string[] = [];
          let idx = 0;
          const lower = p.content.toLowerCase();
          const nameLower = char.name.toLowerCase();
          while ((idx = lower.indexOf(nameLower, idx)) !== -1) {
            const start = Math.max(0, idx - 50);
            const end = Math.min(p.content.length, idx + char.name.length + 50);
            snippets.push(
              p.content.slice(start, end).replace(/\n/g, " ").trim(),
            );
            idx += char.name.length;
            if (snippets.length >= 3) break;
          }

          return {
            part_number: p.part_number,
            chapter_number: p.chapter_number,
            title: p.title || `Part ${p.part_number}, Ch. ${p.chapter_number}`,
            mention_count: matches.length,
            snippets,
          };
        })
        .filter(Boolean);

      return {
        character: {
          id: char.id,
          name: char.name,
          role: char.role,
          arc_notes: char.arc_notes,
          goals: char.goals,
          fears: char.fears,
          motivations: char.motivations,
        },
        appearances,
        total_mentions: appearances.reduce(
          (s, a: any) => s + a.mention_count,
          0,
        ),
        chapters_present: appearances.length,
        chapters_total: parts.length,
      };
    });

    // Sort by total mentions descending
    arcs.sort((a, b) => b.total_mentions - a.total_mentions);

    return NextResponse.json({ arcs, total_chapters: parts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
