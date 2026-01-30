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

// Chunk text for AI processing
export function chunkText(text: string, maxChunkSize: number = 8000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  const paragraphs = text.split('\n\n');

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
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
