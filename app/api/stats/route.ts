import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get("world_id");

    // Fetch all story parts
    let storyQuery = supabase
      .from("story_parts")
      .select(
        "id, title, content, part_number, chapter_number, word_count, created_at",
      )
      .order("part_number", { ascending: true })
      .order("chapter_number", { ascending: true });
    if (worldId) storyQuery = storyQuery.eq("world_id", worldId);
    const { data: storyParts, error: storyError } = await storyQuery;
    if (storyError) throw storyError;

    // Fetch characters
    let charQuery = supabase
      .from("characters")
      .select("id, name, role, description, created_at")
      .order("name", { ascending: true });
    if (worldId) charQuery = charQuery.eq("world_id", worldId);
    const { data: characters, error: charError } = await charQuery;
    if (charError) throw charError;

    // Fetch locations
    let locQuery = supabase
      .from("locations")
      .select("id, name, created_at")
      .order("name", { ascending: true });
    if (worldId) locQuery = locQuery.eq("world_id", worldId);
    const { data: locations, error: locError } = await locQuery;
    if (locError) throw locError;

    // Calculate statistics
    const parts = storyParts || [];
    const chars = characters || [];
    const locs = locations || [];

    const totalWords = parts.reduce((sum, p) => sum + (p.word_count || 0), 0);
    const totalChapters = parts.length;
    const uniqueParts = [...new Set(parts.map((p) => p.part_number))];
    const totalParts = uniqueParts.length;
    const avgWordsPerChapter =
      totalChapters > 0 ? Math.round(totalWords / totalChapters) : 0;

    // Words per part
    const wordsPerPart: Record<number, number> = {};
    const chaptersPerPart: Record<number, number> = {};
    for (const p of parts) {
      wordsPerPart[p.part_number] =
        (wordsPerPart[p.part_number] || 0) + (p.word_count || 0);
      chaptersPerPart[p.part_number] =
        (chaptersPerPart[p.part_number] || 0) + 1;
    }

    // Writing timeline (words per day)
    const wordsByDate: Record<string, number> = {};
    for (const p of parts) {
      if (p.created_at) {
        const date = new Date(p.created_at).toISOString().split("T")[0];
        wordsByDate[date] = (wordsByDate[date] || 0) + (p.word_count || 0);
      }
    }
    const timeline = Object.entries(wordsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, words]) => ({ date, words }));

    // Character mentions in story content
    const characterMentions: { name: string; role: string; count: number }[] =
      [];
    for (const c of chars) {
      let count = 0;
      const nameRegex = new RegExp(
        c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );
      for (const p of parts) {
        if (p.content) {
          const matches = p.content.match(nameRegex);
          if (matches) count += matches.length;
        }
      }
      characterMentions.push({
        name: c.name,
        role: c.role || "unknown",
        count,
      });
    }
    characterMentions.sort((a, b) => b.count - a.count);

    // Role distribution
    const roleDistribution: Record<string, number> = {};
    for (const c of chars) {
      const role = c.role || "unassigned";
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    }

    // Longest / shortest chapters
    const sortedByLength = [...parts].sort(
      (a, b) => (b.word_count || 0) - (a.word_count || 0),
    );
    const longestChapter = sortedByLength[0] || null;
    const shortestChapter = sortedByLength[sortedByLength.length - 1] || null;

    return NextResponse.json({
      overview: {
        totalWords,
        totalChapters,
        totalParts,
        totalCharacters: chars.length,
        totalLocations: locs.length,
        avgWordsPerChapter,
      },
      wordsPerPart: Object.entries(wordsPerPart).map(([part, words]) => ({
        part: Number(part),
        words,
        chapters: chaptersPerPart[Number(part)] || 0,
      })),
      timeline,
      characterMentions: characterMentions.slice(0, 20),
      roleDistribution: Object.entries(roleDistribution).map(
        ([role, count]) => ({ role, count }),
      ),
      longestChapter: longestChapter
        ? {
            title: longestChapter.title,
            part: longestChapter.part_number,
            chapter: longestChapter.chapter_number,
            words: longestChapter.word_count,
          }
        : null,
      shortestChapter: shortestChapter
        ? {
            title: shortestChapter.title,
            part: shortestChapter.part_number,
            chapter: shortestChapter.chapter_number,
            words: shortestChapter.word_count,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to calculate statistics" },
      { status: 500 },
    );
  }
}
