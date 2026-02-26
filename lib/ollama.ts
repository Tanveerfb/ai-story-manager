import { Ollama } from "ollama";

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
});

const MODEL = process.env.OLLAMA_MODEL || "llama3.1-force-gpu";
const NUM_CTX = parseInt(process.env.AI_NUM_CTX || "3072", 10);
const UNRESTRICTED_MODE = process.env.OLLAMA_UNRESTRICTED_MODE === "true";

interface GenerateOptions {
  prompt: string;
  system?: string;
  format?: "json" | "";
  num_ctx?: number;
  temperature?: number;
  num_predict?: number;
  model?: string; // Optional model override
}

async function generateText(options: GenerateOptions): Promise<string> {
  const response = await ollama.generate({
    model: options.model || MODEL, // Use provided model or default
    prompt: options.prompt,
    system: options.system || "",
    format: options.format,
    options: {
      num_ctx: options.num_ctx || NUM_CTX,
      temperature: options.temperature || 0.7,
      num_predict: options.num_predict || 1000,
    },
    stream: false,
  });

  return response.response;
}

export async function extractEntities(text: string): Promise<any> {
  const system = `Extract characters, relationships, and locations from the story text.

IMPORTANT: Return ONLY valid JSON in this EXACT format:
{
  "characters": [{"name": "Name", "personality": "brief", "traits": ["trait1","trait2","trait3"], "goals": "brief", "description": "appearance"}],
  "relationships": [{"character_1": "Name1", "character_2": "Name2", "type": "romantic/friendship/rivalry/family", "dynamic": "brief"}],
  "locations": [{"name": "Place", "description": "brief", "atmosphere": "mood"}],
  "events": [{"description": "what happened", "emotional_impact": "impact"}],
  "themes": ["theme1", "theme2"]
}

Do NOT use "character_traits" - use "characters".
Ignore generic pronouns: you, she, he, I, me, they, boyfriend, girlfriend, narrator, babe, baby.${
    UNRESTRICTED_MODE
      ? `\n\nExtract all themes, events, and character traits accurately, including mature or sensitive content without filtering or censoring.`
      : ""
  }`;

  const prompt = `Extract:\n\n${text.substring(0, 2500)}\n\nJSON:`;

  try {
    const response = await generateText({
      prompt,
      system,
      format: "json",
      num_ctx: 3072,
      temperature: 0.3,
      num_predict: 500,
    });

    console.log("🤖 Raw AI response:", response.substring(0, 500));

    const parsed = JSON.parse(response);

    // Handle case where AI returns 'character_traits' instead of 'characters'
    if (!parsed.characters && parsed.character_traits) {
      parsed.characters = parsed.character_traits;
    }

    console.log("📊 Parsed entities before filtering:", {
      characters: parsed.characters?.length || 0,
      locations: parsed.locations?.length || 0,
      relationships: parsed.relationships?.length || 0,
    });

    const EXCLUDE = [
      "you",
      "your",
      "yours",
      "i",
      "me",
      "my",
      "mine",
      "myself",
      "he",
      "him",
      "his",
      "she",
      "her",
      "hers",
      "they",
      "them",
      "their",
      "we",
      "us",
      "our",
      "chatgpt",
      "gpt",
      "ai",
      "narrator",
      "boyfriend",
      "girlfriend",
      "lover",
      "partner",
      "friend",
      "stranger",
      "babe",
      "baby",
      "darling",
      "sweetheart",
      "honey",
    ];

    const cleanedCharacters = (parsed.characters || [])
      .filter((char: any) => {
        const name = (char.name || "").toLowerCase().trim();
        return name.length > 1 && !EXCLUDE.includes(name);
      })
      .map((char: any) => ({
        name: char.name?.trim() || "Unknown",
        role: "side",
        personality: char.personality?.trim() || null,
        traits: Array.isArray(char.traits) ? char.traits.slice(0, 5) : [],
        description: char.description?.trim() || null,
        goals: char.goals?.trim() || null,
        arc: null,
        backstory: null,
      }));

    const cleanedRelationships = (parsed.relationships || [])
      .filter((rel: any) => {
        const c1 = (rel.character_1 || "").toLowerCase().trim();
        const c2 = (rel.character_2 || "").toLowerCase().trim();
        return !EXCLUDE.includes(c1) && !EXCLUDE.includes(c2);
      })
      .map((rel: any) => ({
        character_1: rel.character_1?.trim() || "",
        character_2: rel.character_2?.trim() || "",
        relationship_type: rel.type?.trim() || "unknown",
        dynamic: rel.dynamic?.trim() || null,
        development: null,
        description: rel.dynamic?.trim() || null,
      }));

    const cleanedLocations = (parsed.locations || []).map((loc: any) => ({
      name: loc.name?.trim() || "",
      type: "indoor",
      description: loc.description?.trim() || "",
      atmosphere: loc.atmosphere?.trim() || null,
      significance: null,
    }));

    const cleanedEvents = (parsed.events || []).map((evt: any) => ({
      description: evt.description?.trim() || "",
      participants: [],
      emotional_impact: evt.emotional_impact?.trim() || null,
      consequences: null,
      significance: null,
      content: evt.description?.trim() || "",
    }));

    return {
      characters: cleanedCharacters,
      locations: cleanedLocations,
      events: cleanedEvents,
      relationships: cleanedRelationships,
      themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5) : [],
      summary: parsed.summary || "",
    };
  } catch (error: any) {
    console.error("Entity extraction error:", error.message);
    return {
      characters: [],
      locations: [],
      events: [],
      relationships: [],
      themes: [],
      summary: "",
    };
  }
}

export async function generateStorySummary(text: string): Promise<string> {
  const system = `Create a 2 paragraph summary covering main characters, plot, and themes.`;

  const prompt = `Summarize:\n\n${text.substring(0, 4000)}`;

  try {
    const response = await generateText({
      prompt,
      system,
      num_ctx: 3072,
      temperature: 0.5,
      num_predict: 250,
    });

    return response.trim();
  } catch (error: any) {
    console.error("Summary generation error:", error.message);
    return "Summary generation failed.";
  }
}

// Generate a condensed AI memory of the story so far
// Used to keep old story context within token limits
export async function generateStoryMemory(
  storyPartsText: string,
  model?: string,
): Promise<string> {
  const system = `You are a story continuity assistant. Your job is to compress the story so far into a compact memory block that another AI can use as context.

Write a dense, factual summary covering:
- Key events in order (what happened, when, who was involved)
- Current character states (where each character is, what they know, how they feel)
- Any established facts, locations, or world rules introduced
- The narrative position — where the story ended (the last known moment)

Write in plain prose, no headers, ~200-300 words maximum. Prioritize facts over atmosphere.`;

  try {
    const response = await generateText({
      prompt: `Compress this story into a continuity memory:\n\n${storyPartsText}`,
      system,
      num_ctx: NUM_CTX,
      temperature: 0.3,
      num_predict: 400,
      model,
    });
    return response.trim();
  } catch (error: any) {
    console.error("Story memory generation error:", error.message);
    throw new Error("Failed to generate story memory");
  }
}

export async function continueStory(
  context: string,
  userPrompt: string,
  model?: string,
  generationStyle: "strict" | "creative" = "strict",
  maxTokens: number = 300,
  playAsCharacterProfile?: string | null,
  otherCharacterProfiles?: string | null,
): Promise<string> {
  const wordBudget = Math.round(maxTokens / 1.3);

  // In strict mode, cap the budget proportionally to what the author wrote.
  // Prose renders ~5x longer than the raw prompt (30 words → ~150 word scene).
  // Floor at 120 words so even a single-line prompt gets a complete paragraph.
  const promptWordCount = userPrompt.trim().split(/\s+/).length;
  const strictWordBudget = Math.min(
    wordBudget,
    Math.max(promptWordCount * 5, 120),
  );

  // Build the POV/character instruction block
  let povBlock = "";
  if (playAsCharacterProfile) {
    povBlock = `
=== YOU ARE PLAYING AS ===
${playAsCharacterProfile}

VOICE RULES:
- Write from this character's close third-person or first-person POV.
- Their thoughts, reactions, and observations must match the profile above exactly.
- Do NOT make them act out of character under any circumstances.
`;
  }

  let otherCharsBlock = "";
  if (otherCharacterProfiles) {
    otherCharsBlock = `
=== OTHER CHARACTERS — ACT ACCURATELY ===
${otherCharacterProfiles}
- Each character above must speak, react, and behave according to their profile.
- Do NOT give them actions, words, or traits not consistent with their description.
`;
  }

  let system: string;

  const isOpening = !context || context.trim().length === 0;
  const sceneType = isOpening ? "opening scene" : "next scene";

  if (generationStyle === "strict") {
    // STRICT = prose reword. The author's prompt is directions for the next segment.
    // The AI elaborates it into polished prose — never adds content or wraps up.
    system = `You are a prose ghostwriter for an ongoing story. The author gives you directions for what happens next. Your job is to turn those directions into polished, immersive narrative prose.

HARD RULES — no exceptions:
1. ONLY what the author wrote exists. Every character, action, and detail must come from their directions.
2. Do NOT invent plot, situations, conflicts, dialogue, or events the author did not describe.
3. Do NOT introduce any character not named in the author's directions or the story context.
4. Do NOT resolve, conclude, or wrap up anything. The story continues after your output — you are writing the MIDDLE, never an ending.
5. Do NOT recap, summarize, or reference previous story parts. The reader already read them. Start directly in the new moment.
6. Do NOT add backstory, reflection on past events, or speculation about the future.
7. Write in close third-person prose. Stay grounded in the present moment the author described.
8. Aim for approximately ${strictWordBudget} words — complete your sentences, but do not pad.
9. Your output is ONE segment of a longer narrative. End mid-flow if needed — the next prompt will pick up where you stop.${povBlock}${otherCharsBlock}${
      UNRESTRICTED_MODE
        ? `\n\nCONTENT: Write what the author directs, in full. Never fade to black, skip, soften, or imply anything the author wrote explicitly. No warnings.`
        : ""
    }`;
  } else {
    // CREATIVE = elaboration with freedom to add atmosphere and detail, but still no conclusions.
    system = `You are a ghostwriter continuing an ongoing story. The author gives you directions for the next segment. Elaborate and expand their directions into rich, immersive prose.

PROSE RULES:
- Write the next segment of a continuous narrative. This is NOT a standalone story — it has no beginning and no ending.
- Start directly in the action. Do NOT open with a recap, summary, or reference to what happened before.
- Use close third-person or first-person. The reader should be INSIDE the moment.
- Write in sensory, grounded prose: what is seen, heard, felt, said right now.
- NEVER conclude, resolve, or wrap up. Your output ends mid-narrative — the next prompt picks up where you stop.
- Do NOT add moral lessons, reflections on the journey, or any sense of finality.
- BANNED PHRASES: "as the story unfolded", "as the tale began", "would become", "in the end", "the final chapter", "her story would be", "it became clear that", "little did they know", "and so", "from that day on", "as the day came to a close". These signal endings or synopsis — forbidden.
- Aim for approximately ${wordBudget} words.${isOpening ? "\n- This is the FIRST segment. Drop the reader into the moment through action or sensation, not narrator summary." : ""}${povBlock}${otherCharsBlock}${
      UNRESTRICTED_MODE
        ? `\n\nCONTENT: Write what the author directs, in full. Never fade to black, skip, or soften a scene. No warnings.`
        : ""
    }`;
  }

  const sceneLabel =
    generationStyle === "strict"
      ? "AUTHOR'S DIRECTIONS (rewrite as prose — do not add anything, do not recap previous parts)"
      : isOpening
        ? "AUTHOR'S DIRECTIONS FOR THE OPENING (elaborate into prose — no recap, no conclusion)"
        : "AUTHOR'S DIRECTIONS FOR THE NEXT SEGMENT (elaborate into prose — no recap, no conclusion)";

  const prompt = `${context ? `${context}\n\n` : ""}${sceneLabel}:\n${userPrompt}`;

  try {
    const response = await generateText({
      prompt,
      system,
      num_ctx: NUM_CTX,
      temperature: generationStyle === "strict" ? 0.45 : 0.82,
      num_predict: maxTokens,
      model,
    });

    return response.trim();
  } catch (error: any) {
    console.error("Story continuation error:", error.message);
    throw new Error("Failed to generate story continuation");
  }
}
