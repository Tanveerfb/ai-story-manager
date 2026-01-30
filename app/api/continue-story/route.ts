import { NextRequest, NextResponse } from 'next/server';
import { continueStory } from '@/lib/ollama';
import { getStoryParts, getCharacters, insertStoryPart } from '@/lib/supabase';
import { buildStoryContext } from '@/lib/contextBuilder';
import { countWords } from '@/lib/parsers';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userPrompt, characterFocus, saveAsNewPart } = await request.json();

    if (!userPrompt) {
      return NextResponse.json(
        { error: 'User prompt is required' },
        { status: 400 }
      );
    }

    // Fetch recent story parts (last 3)
    const allParts = await getStoryParts();
    const recentParts = allParts.slice(-3);

    // Fetch all characters
    const characters = await getCharacters();

    // Fetch relationships
    const { data: relationships } = await supabase
      .from('relationships')
      .select('*');

    // Build context
    const context = buildStoryContext(
      recentParts,
      characters,
      relationships || []
    );

    // Generate continuation
    const continuation = await continueStory(context, userPrompt);

    // Optionally save as new part
    let savedPart = null;
    if (saveAsNewPart) {
      const nextPartNumber = allParts.length > 0 
        ? Math.max(...allParts.map((p: any) => p.part_number)) + 1 
        : 1;

      savedPart = await insertStoryPart({
        part_number: nextPartNumber,
        content: continuation,
        word_count: countWords(continuation),
      });
    }

    return NextResponse.json({
      continuation,
      savedPart,
    });
  } catch (error: any) {
    console.error('Story continuation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to continue story' },
      { status: 500 }
    );
  }
}
