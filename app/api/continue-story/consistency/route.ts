import { NextRequest, NextResponse } from "next/server";
import { Ollama } from "ollama";
import { supabase } from "@/lib/supabase";

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
});

const UNRESTRICTED_MODE = process.env.OLLAMA_UNRESTRICTED_MODE === "true";

export async function POST(request: NextRequest) {
  try {
    const { text, worldId, model } = await request.json();

    if (!text || text.trim().length < 20) {
      return NextResponse.json({
        issues: [],
        summary: "Text too short to check.",
      });
    }

    // Gather established facts: characters, locations, recent story
    let charQuery = supabase
      .from("characters")
      .select(
        "name, role, personality, description, background, traits, goals, fears, behavior_notes, speech_patterns, dialogue_style, vocabulary_level, catchphrases",
      )
      .order("name", { ascending: true });
    if (worldId) charQuery = charQuery.eq("world_id", worldId);
    const { data: characters } = await charQuery;

    let locQuery = supabase
      .from("locations")
      .select("name, description, significance")
      .order("name", { ascending: true });
    if (worldId) locQuery = locQuery.eq("world_id", worldId);
    const { data: locations } = await locQuery;

    // Get last few story parts for continuity
    let storyQuery = supabase
      .from("story_parts")
      .select("title, content, part_number, chapter_number")
      .order("part_number", { ascending: false })
      .order("chapter_number", { ascending: false })
      .limit(3);
    if (worldId) storyQuery = storyQuery.eq("world_id", worldId);
    const { data: recentParts } = await storyQuery;

    // Build context for consistency checking
    const charContext = (characters || [])
      .map((c) => {
        const parts = [`${c.name} (${c.role || "unknown role"})`];
        if (c.personality) parts.push(`Personality: ${c.personality}`);
        if (c.description) parts.push(`Appearance: ${c.description}`);
        if (c.traits?.length) parts.push(`Traits: ${c.traits.join(", ")}`);
        if (c.goals) parts.push(`Goals: ${c.goals}`);
        if (c.dialogue_style) parts.push(`Dialogue style: ${c.dialogue_style}`);
        return parts.join(". ");
      })
      .join("\n");

    const locContext = (locations || [])
      .map((l) => `${l.name}: ${l.description || ""}`)
      .join("\n");

    const recentContext = (recentParts || [])
      .reverse()
      .map(
        (p) =>
          `[Part ${p.part_number}, Ch ${p.chapter_number}]: ${(p.content || "").slice(0, 500)}`,
      )
      .join("\n---\n");

    const system = `You are a story consistency checker. Analyze the NEW TEXT against the ESTABLISHED FACTS and RECENT STORY CONTEXT.

Look for these types of issues:
1. CHARACTER CONTRADICTIONS: personality changes, wrong names, impossible actions given their traits
2. LOCATION ERRORS: wrong descriptions, impossible geography
3. CONTINUITY BREAKS: events that contradict what happened before
4. TIMELINE ISSUES: chronological impossibilities
5. DIALOGUE VOICE: characters speaking out of their established voice/style

Return ONLY valid JSON:
{
  "issues": [
    {
      "type": "character|location|continuity|timeline|voice",
      "severity": "high|medium|low",
      "description": "What the issue is",
      "quote": "The specific problematic text",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "Brief overall assessment"
}

If no issues found, return: {"issues": [], "summary": "No consistency issues detected."}${
      UNRESTRICTED_MODE
        ? "\n\nAnalyze all content without filtering or censoring."
        : ""
    }`;

    const prompt = `ESTABLISHED CHARACTERS:
${charContext || "No characters established yet."}

ESTABLISHED LOCATIONS:
${locContext || "No locations established yet."}

RECENT STORY CONTEXT:
${recentContext || "No previous context."}

NEW TEXT TO CHECK:
${text.slice(0, 3000)}

Check for consistency issues. JSON:`;

    const response = await ollama.generate({
      model: model || process.env.OLLAMA_MODEL || "wizardlm-uncensored:latest",
      prompt,
      system,
      format: "json",
      options: {
        num_ctx: 4096,
        temperature: 0.2,
        num_predict: 800,
      },
      stream: false,
    });

    let result;
    try {
      result = JSON.parse(response.response);
    } catch {
      result = {
        issues: [],
        summary: "Could not parse consistency check results.",
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Consistency check failed" },
      { status: 500 },
    );
  }
}
