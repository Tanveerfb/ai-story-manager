import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const worldId = searchParams.get("world_id");
    const type = searchParams.get("type") || "all"; // all, story, characters, locations

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const pattern = `%${q}%`;
    const results: any[] = [];

    // Search story parts
    if (type === "all" || type === "story") {
      let storyQuery = supabase
        .from("story_parts")
        .select("id, title, content, part_number, chapter_number, word_count")
        .or(`title.ilike.${pattern},content.ilike.${pattern}`)
        .order("part_number", { ascending: true })
        .order("chapter_number", { ascending: true })
        .limit(20);

      if (worldId) storyQuery = storyQuery.eq("world_id", worldId);

      const { data: storyData, error: storyError } = await storyQuery;
      if (storyError) throw storyError;

      for (const item of storyData || []) {
        // Find matching snippet
        const snippet = findSnippet(item.content, q);
        results.push({
          type: "story",
          id: item.id,
          title:
            item.title ||
            `Part ${item.part_number}, Chapter ${item.chapter_number}`,
          snippet,
          meta: {
            part_number: item.part_number,
            chapter_number: item.chapter_number,
            word_count: item.word_count,
          },
        });
      }
    }

    // Search characters
    if (type === "all" || type === "characters") {
      let charQuery = supabase
        .from("characters")
        .select("id, name, description, background, personality, role")
        .or(
          `name.ilike.${pattern},description.ilike.${pattern},background.ilike.${pattern},personality.ilike.${pattern}`,
        )
        .order("name", { ascending: true })
        .limit(20);

      if (worldId) charQuery = charQuery.eq("world_id", worldId);

      const { data: charData, error: charError } = await charQuery;
      if (charError) throw charError;

      for (const item of charData || []) {
        const searchableText = [
          item.description,
          item.background,
          item.personality,
        ]
          .filter(Boolean)
          .join(" ");
        const snippet =
          findSnippet(searchableText, q) ||
          item.description?.slice(0, 150) ||
          "";
        results.push({
          type: "character",
          id: item.id,
          title: item.name,
          snippet,
          meta: { role: item.role },
        });
      }
    }

    // Search locations
    if (type === "all" || type === "locations") {
      let locQuery = supabase
        .from("locations")
        .select("id, name, description, significance")
        .or(
          `name.ilike.${pattern},description.ilike.${pattern},significance.ilike.${pattern}`,
        )
        .order("name", { ascending: true })
        .limit(20);

      if (worldId) locQuery = locQuery.eq("world_id", worldId);

      const { data: locData, error: locError } = await locQuery;
      if (locError) throw locError;

      for (const item of locData || []) {
        const searchableText = [item.description, item.significance]
          .filter(Boolean)
          .join(" ");
        const snippet =
          findSnippet(searchableText, q) ||
          item.description?.slice(0, 150) ||
          "";
        results.push({
          type: "location",
          id: item.id,
          title: item.name,
          snippet,
          meta: {},
        });
      }
    }

    return NextResponse.json({ results, query: q });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 },
    );
  }
}

function findSnippet(
  text: string | null,
  query: string,
  contextChars = 100,
): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 200);

  const start = Math.max(0, idx - contextChars);
  const end = Math.min(text.length, idx + query.length + contextChars);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}
