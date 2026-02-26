interface Character {
  id: string;
  name: string;
  role: string;
  description?: string;
  personality?: any;
  physical_traits?: any;
  background?: string;
  behavior_notes?: string;
  speech_patterns?: string;
  fears?: string;
  motivations?: string;
  arc_notes?: string;
}

interface Relationship {
  character_1_id: string;
  character_2_id: string;
  relationship_type: string;
  status?: string;
  description?: string;
}

interface StoryPart {
  part_number: number;
  chapter_number?: number;
  title?: string;
  content: string;
  summary?: string;
}

export function buildStoryContext(
  recentParts: StoryPart[],
  characters: Character[],
  relationships: Relationship[],
): string {
  let context = "";

  // Add recent story parts — labelled as background knowledge only
  if (recentParts.length > 0) {
    context +=
      "=== STORY SO FAR (background knowledge — do NOT recap, summarize, or reference these events in your output) ===\n\n";
    for (const part of recentParts) {
      const chLabel = part.chapter_number ? ` Ch.${part.chapter_number}` : "";
      context += `--- Part ${part.part_number}${chLabel} ---\n`;
      context += `${part.content}\n\n`;
    }
  }

  // Add characters
  if (characters.length > 0) {
    context += "=== CHARACTERS ===\n\n";
    context += formatCharactersForPrompt(characters);
    context += "\n";
  }

  // Add relationships
  if (relationships.length > 0) {
    context += "=== RELATIONSHIPS ===\n\n";
    context += formatRelationshipsForPrompt(relationships, characters);
    context += "\n";
  }

  return context;
}

export function formatCharactersForPrompt(characters: Character[]): string {
  return characters
    .map((char) => {
      let charStr = `${char.name} (${char.role}):\n`;
      if (char.description) {
        charStr += `  Description: ${char.description}\n`;
      }
      if (char.personality) {
        const personality =
          typeof char.personality === "string"
            ? char.personality
            : JSON.stringify(char.personality);
        charStr += `  Personality: ${personality}\n`;
      }
      if (char.physical_traits) {
        const physical =
          typeof char.physical_traits === "string"
            ? char.physical_traits
            : JSON.stringify(char.physical_traits);
        charStr += `  Physical: ${physical}\n`;
      }
      if (char.background) {
        charStr += `  Background: ${char.background}\n`;
      }
      if (char.behavior_notes) {
        charStr += `  Behavior/Reactions: ${char.behavior_notes}\n`;
      }
      if (char.speech_patterns) {
        charStr += `  Speech Style: ${char.speech_patterns}\n`;
      }
      if (char.fears) {
        charStr += `  Fears: ${char.fears}\n`;
      }
      if (char.motivations) {
        charStr += `  Motivations: ${char.motivations}\n`;
      }
      if (char.arc_notes) {
        charStr += `  Story Arc: ${char.arc_notes}\n`;
      }
      return charStr;
    })
    .join("\n");
}

export function formatRelationshipsForPrompt(
  relationships: Relationship[],
  characters: Character[],
): string {
  const charMap = new Map(characters.map((c) => [c.id, c.name]));

  return relationships
    .map((rel) => {
      const char1Name = charMap.get(rel.character_1_id) || "Unknown";
      const char2Name = charMap.get(rel.character_2_id) || "Unknown";
      let relStr = `${char1Name} <-> ${char2Name}: ${rel.relationship_type}`;
      if (rel.description) {
        relStr += `\n  ${rel.description}`;
      }
      return relStr;
    })
    .join("\n\n");
}

export function buildContinuationPrompt(
  userPrompt: string,
  context: string,
  focusCharacter?: string,
): string {
  let prompt = context + "\n";

  if (focusCharacter) {
    prompt += `=== FOCUS CHARACTER ===\n${focusCharacter}\n\n`;
  }

  prompt += `=== USER REQUEST ===\n${userPrompt}\n\n`;
  prompt += `Continue the story naturally, maintaining character consistency and respecting the established context:`;

  return prompt;
}
