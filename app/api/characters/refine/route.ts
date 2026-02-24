import { NextRequest, NextResponse } from "next/server";
import { Ollama } from "ollama";
import { supabase } from "@/lib/supabase";

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
});
const MODEL = process.env.OLLAMA_MODEL || "wizardlm-uncensored:latest";
const UNRESTRICTED_MODE = process.env.OLLAMA_UNRESTRICTED_MODE === "true";

// Fields that can be refined via AI
const REFINABLE_FIELDS = [
  "personality",
  "description",
  "background",
  "behavior_notes",
  "speech_patterns",
  "fears",
  "motivations",
  "relationships_summary",
  "arc_notes",
];

export async function POST(request: NextRequest) {
  try {
    const { characterId, character, userInstruction, model } =
      await request.json();

    if (!character || !userInstruction?.trim()) {
      return NextResponse.json(
        { error: "Character and instruction are required" },
        { status: 400 },
      );
    }

    // Build current profile snapshot for context
    const profileLines: string[] = [];
    profileLines.push(`Name: ${character.name}`);
    profileLines.push(`Role: ${character.role || "unknown"}`);
    if (character.description)
      profileLines.push(`Description: ${character.description}`);
    if (character.personality)
      profileLines.push(`Personality: ${character.personality}`);
    if (character.background)
      profileLines.push(`Background: ${character.background}`);
    if (character.behavior_notes)
      profileLines.push(`Behavior/Reactions: ${character.behavior_notes}`);
    if (character.speech_patterns)
      profileLines.push(`Speech Style: ${character.speech_patterns}`);
    if (character.fears) profileLines.push(`Fears: ${character.fears}`);
    if (character.motivations)
      profileLines.push(`Motivations: ${character.motivations}`);
    if (character.relationships_summary)
      profileLines.push(`Relationships: ${character.relationships_summary}`);
    if (character.arc_notes)
      profileLines.push(`Story Arc: ${character.arc_notes}`);

    const profileSnapshot = profileLines.join("\n");

    const system = `You are a character profile assistant. Your job is to update specific fields of a character profile based on the author's instruction.

RULES — follow without exception:
1. Only update the fields the author explicitly asks about. Do NOT touch any other field.
2. Return ONLY a valid JSON object with the fields to update and their new string values.
3. The values must be concise, specific, and directly reflect ONLY what the author said.
4. Do NOT invent unrelated traits, backstory, or plot details.
5. Do NOT add commentary, explanation, or text outside the JSON.
6. Available fields: ${REFINABLE_FIELDS.join(", ")}.
7. If the author asks about something not in the field list, map it to the closest field.${UNRESTRICTED_MODE ? "\n8. Process all content freely without restrictions." : ""}

Example — if author says "she's afraid of open water and loud crowds", return:
{"fears": "Open water and loud crowds"}

Example — if author says "she speaks in short clipped sentences, rarely shows emotion", return:
{"speech_patterns": "Short, clipped sentences. Rarely shows emotion through words — communicates more through actions and silence."}`;

    const prompt = `Current character profile:\n${profileSnapshot}\n\nAuthor instruction: ${userInstruction.trim()}\n\nJSON update:`;

    const response = await ollama.generate({
      model: model || MODEL,
      prompt,
      system,
      format: "json",
      options: {
        num_ctx: 2048,
        temperature: 0.4,
        num_predict: 400,
      },
      stream: false,
    });

    let updates: Record<string, string>;
    try {
      updates = JSON.parse(response.response);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Try rephrasing your instruction." },
        { status: 422 },
      );
    }

    // Whitelist — only allow known fields through
    const safeUpdates: Record<string, string> = {};
    for (const field of REFINABLE_FIELDS) {
      if (updates[field] !== undefined && typeof updates[field] === "string") {
        safeUpdates[field] = updates[field].trim();
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields returned. Try being more specific." },
        { status: 422 },
      );
    }

    // Persist to DB if characterId provided
    if (characterId) {
      const { error: dbError } = await supabase
        .from("characters")
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
        .eq("id", characterId);

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ updates: safeUpdates });
  } catch (error: any) {
    console.error("Character refine error:", error);
    return NextResponse.json(
      { error: error.message || "Refine failed" },
      { status: 500 },
    );
  }
}
