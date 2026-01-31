// Extracted entities interface
export interface ExtractedEntities {
  characters?: Array<{
    name: string;
    role?: string;
    description?: string;
    personality?: any;
    physical_traits?: any;
  }>;
  locations?: Array<{
    name: string;
    description?: string;
    type?: string;
  }>;
  events?: Array<{
    event_type?: string;
    description?: string;
    content?: string;
  }>;
  relationships?: Array<{
    character_1: string;
    character_2: string;
    relationship_type?: string;
    description?: string;
  }>;
  summary?: string;
}

// Merge and deduplicate entities from multiple extraction chunks
export function mergeEntities(entitiesArray: ExtractedEntities[]): ExtractedEntities {
  const merged: ExtractedEntities = {
    characters: [],
    locations: [],
    events: [],
    relationships: [],
    summary: '',
  };

  const characterMap = new Map<string, any>();
  const locationMap = new Map<string, any>();
  const relationshipSet = new Set<string>();

  for (const entities of entitiesArray) {
    // Merge characters (deduplicate by name)
    if (entities.characters) {
      for (const char of entities.characters) {
        const key = char.name.toLowerCase().trim();
        if (!characterMap.has(key)) {
          characterMap.set(key, char);
        } else {
          // Merge descriptions if richer
          const existing = characterMap.get(key);
          if (char.description && char.description.length > (existing.description?.length || 0)) {
            existing.description = char.description;
          }
          if (char.personality) {
            existing.personality = { ...existing.personality, ...char.personality };
          }
          if (char.physical_traits) {
            existing.physical_traits = { ...existing.physical_traits, ...char.physical_traits };
          }
        }
      }
    }

    // Merge locations (deduplicate by name)
    if (entities.locations) {
      for (const loc of entities.locations) {
        const key = loc.name.toLowerCase().trim();
        if (!locationMap.has(key)) {
          locationMap.set(key, loc);
        } else {
          // Merge descriptions if richer
          const existing = locationMap.get(key);
          if (loc.description && loc.description.length > (existing.description?.length || 0)) {
            existing.description = loc.description;
          }
        }
      }
    }

    // Merge events (keep all, they're unique)
    if (entities.events) {
      merged.events!.push(...entities.events);
    }

    // Merge relationships (deduplicate by character pair)
    if (entities.relationships) {
      for (const rel of entities.relationships) {
        const key = [rel.character_1, rel.character_2].sort().join('|').toLowerCase();
        if (!relationshipSet.has(key)) {
          relationshipSet.add(key);
          merged.relationships!.push(rel);
        }
      }
    }

    // Combine summaries
    if (entities.summary) {
      merged.summary += (merged.summary ? ' ' : '') + entities.summary;
    }
  }

  merged.characters = Array.from(characterMap.values());
  merged.locations = Array.from(locationMap.values());

  return merged;
}

// Parse conversation format from ChatGPT exports
export function parseConversation(text: string): Array<{ speaker: string; message: string }> {
  const lines = text.split('\n');
  const conversation: Array<{ speaker: string; message: string }> = [];
  let currentSpeaker = '';
  let currentMessage = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for speaker indicators
    const speakerMatch = trimmed.match(/^(You|User|ChatGPT|Assistant):\s*/i);
    
    if (speakerMatch) {
      // Save previous message if exists
      if (currentSpeaker && currentMessage) {
        conversation.push({
          speaker: currentSpeaker,
          message: currentMessage.trim(),
        });
      }
      
      // Start new message
      currentSpeaker = speakerMatch[1];
      currentMessage = trimmed.substring(speakerMatch[0].length);
    } else if (trimmed) {
      // Continue current message
      currentMessage += '\n' + trimmed;
    }
  }

  // Add last message
  if (currentSpeaker && currentMessage) {
    conversation.push({
      speaker: currentSpeaker,
      message: currentMessage.trim(),
    });
  }

  return conversation;
}

// Extract speaker from line
export function extractSpeaker(line: string): string | null {
  const match = line.match(/^(You|User|ChatGPT|Assistant):\s*/i);
  return match ? match[1] : null;
}

// Chunk text for AI processing based on word count
export function chunkText(text: string, maxWords: number = 6000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);
    
    if (currentWordCount + paragraphWords > maxWords && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
      currentWordCount = paragraphWords;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentWordCount += paragraphWords;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  // If no chunks created (e.g., single giant paragraph), force split
  if (chunks.length === 0 && text.length > 0) {
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }
  }

  return chunks;
}

// Count words in text
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

// Clean extra whitespace
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
