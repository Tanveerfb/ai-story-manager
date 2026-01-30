import { NextRequest, NextResponse } from 'next/server';
import { extractEntities } from '@/lib/ollama';
import { chunkText } from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Chunk text if too large
    const chunks = chunkText(text, 6000);
    const allResults: {
      characters: any[];
      locations: any[];
      events: any[];
      relationships: any[];
      summary: string;
    } = {
      characters: [],
      locations: [],
      events: [],
      relationships: [],
      summary: '',
    };

    // Process each chunk
    for (const chunk of chunks) {
      const result = await extractEntities(chunk);
      
      if (result.characters) {
        allResults.characters.push(...result.characters);
      }
      if (result.locations) {
        allResults.locations.push(...result.locations);
      }
      if (result.events) {
        allResults.events.push(...result.events);
      }
      if (result.relationships) {
        allResults.relationships.push(...result.relationships);
      }
      if (result.summary && !allResults.summary) {
        allResults.summary = result.summary;
      }
    }

    // Deduplicate characters and locations by name
    const uniqueChars = Array.from(
      new Map(allResults.characters.map((c: any) => [c.name, c])).values()
    );
    const uniqueLocs = Array.from(
      new Map(allResults.locations.map((l: any) => [l.name, l])).values()
    );

    return NextResponse.json({
      characters: uniqueChars,
      locations: uniqueLocs,
      events: allResults.events,
      relationships: allResults.relationships,
      summary: allResults.summary,
    });
  } catch (error: any) {
    console.error('Entity extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract entities' },
      { status: 500 }
    );
  }
}
