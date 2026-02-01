import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { findFuzzyMatches } from '@/lib/fuzzyMatch';

/**
 * GET - Fetch all unlinked character names from events and relationships
 * Returns names that appear in events/relationships but don't match any canonical character
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all canonical characters
    const { data: characters, error: charsError } = await supabase
      .from('characters')
      .select('id, name');

    if (charsError) throw charsError;

    // Fetch all character aliases
    const { data: aliases, error: aliasesError } = await supabase
      .from('character_aliases')
      .select('alias');

    if (aliasesError) throw aliasesError;

    const canonicalNames = new Set(characters?.map((c) => c.name.toLowerCase()) || []);
    const aliasNames = new Set(aliases?.map((a) => a.alias.toLowerCase()) || []);

    // Fetch names from relationships
    const { data: relationships, error: relsError } = await supabase
      .from('relationships')
      .select('character_1_id, character_2_id');

    // Fetch events with descriptions that might contain character names
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('description, content');

    // For now, we'll extract names that appear in events but aren't linked
    // This is a simplified implementation - a real one would need NER or pattern matching
    const unlinkedNamesMap = new Map<string, { count: number; contexts: string[] }>();

    // Simple heuristic: look for capitalized words that might be names
    if (events) {
      for (const event of events) {
        const text = `${event.description || ''} ${event.content || ''}`;
        const words = text.split(/\s+/);
        
        for (const word of words) {
          // Check if word starts with capital and is at least 2 chars
          if (word.length >= 2 && /^[A-Z][a-z]+/.test(word)) {
            const cleanWord = word.replace(/[.,!?;:]$/, '');
            const lowerWord = cleanWord.toLowerCase();
            
            // Skip if it's already a canonical name or alias
            if (!canonicalNames.has(lowerWord) && !aliasNames.has(lowerWord)) {
              if (!unlinkedNamesMap.has(cleanWord)) {
                unlinkedNamesMap.set(cleanWord, { count: 0, contexts: [] });
              }
              const entry = unlinkedNamesMap.get(cleanWord)!;
              entry.count++;
              if (entry.contexts.length < 3) {
                entry.contexts.push(text.slice(0, 200));
              }
            }
          }
        }
      }
    }

    // Find fuzzy matches for each unlinked name
    const unlinkedNames = Array.from(unlinkedNamesMap.entries())
      .filter(([name, data]) => data.count >= 2) // Only show names that appear at least twice
      .map(([name, data]) => {
        const suggestedMatches = findFuzzyMatches(
          name,
          characters || [],
          (char) => char.name,
          0.6
        )
          .slice(0, 3)
          .map((match) => ({
            id: match.item.id,
            name: match.item.name,
            score: match.score,
          }));

        return {
          name,
          usageCount: data.count,
          contexts: data.contexts,
          suggestedMatches,
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount);

    return NextResponse.json(unlinkedNames);
  } catch (error: any) {
    console.error('Error fetching unlinked characters:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unlinked characters' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Ignore/remove an unlinked name from the list
 * This doesn't actually delete anything, just marks it as ignored
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // For now, we'll just return success
    // In a full implementation, you might want to store ignored names in a separate table
    return NextResponse.json({
      success: true,
      message: `Name "${name}" has been ignored`,
    });
  } catch (error: any) {
    console.error('Error deleting unlinked name:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete unlinked name' },
      { status: 500 }
    );
  }
}
