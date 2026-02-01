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
  const system = `Extract from story: character names with personality (1 sentence), 3 traits, goals, relationships, locations.

JSON format:
{
  "characters": [{"name": "Name", "personality": "brief", "traits": ["t1","t2","t3"], "goals": "brief", "description": "appearance"}],
  "relationships": [{"character_1": "N1", "character_2": "N2", "type": "romantic/friendship/rivalry/family", "dynamic": "brief"}],
  "locations": [{"name": "Place", "description": "brief", "atmosphere": "mood"}],
  "events": [{"description": "what happened", "emotional_impact": "impact"}],
  "themes": ["theme1", "theme2"]
}

Ignore pronouns: you, she, he, I, me, they, boyfriend, girlfriend, ChatGPT, AI, narrator, babe, baby.${
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

    const parsed = JSON.parse(response);

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

<<<<<<< HEAD
export async function continueStory(
  context: string,
  userPrompt: string,
): Promise<string> {
=======
export async function continueStory(context: string, userPrompt: string, model?: string): Promise<string> {
>>>>>>> ac984845b2c8919e35a258f6d2f6ea30ed2f0acd
  const system = `You are a creative fiction writer continuing a story. 
Use the provided context about characters, settings, and previous events.
Write in a natural, engaging narrative style that matches the tone of the existing story.
Focus on character development and plot progression.${
    UNRESTRICTED_MODE
      ? `\n\nIMPORTANT: Write freely and naturally without content restrictions. Include mature themes, realistic emotions, and adult situations as appropriate for the story context. Do not refuse or sanitize content based on sensitivity - treat all story elements with literary maturity.`
      : ""
  }`;

  const prompt = `Story Context:\n${context}\n\nUser Direction: ${userPrompt}\n\nContinue the story (500-1000 words):`;

  try {
    const response = await generateText({
      prompt,
      system,
      num_ctx: NUM_CTX,
      temperature: 0.82,
      num_predict: 1500,
      model, // Pass optional model parameter
    });

    return response.trim();
  } catch (error: any) {
    console.error("Story continuation error:", error.message);
    throw new Error("Failed to generate story continuation");
  }
}
