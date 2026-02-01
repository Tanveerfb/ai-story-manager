import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET - Search for events and story parts by content, characters, or locations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const characterName = searchParams.get('character');
    const locationName = searchParams.get('location');

    const results: any[] = [];

    // Search in events
    let eventsQuery = supabase.from('events').select(`
      id,
      description,
      content,
      event_type,
      story_part_id,
      character_id,
      location_id
    `);

    if (query) {
      eventsQuery = eventsQuery.or(
        `description.ilike.%${query}%,content.ilike.%${query}%`
      );
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) throw eventsError;

    // Filter events by character/location if specified
    if (events) {
      for (const event of events) {
        let include = true;

        // Check character filter
        if (characterName && event.character_id) {
          const { data: char } = await supabase
            .from('characters')
            .select('name')
            .eq('id', event.character_id)
            .single();

          if (!char || char.name !== characterName) {
            include = false;
          }
        } else if (characterName) {
          include = false;
        }

        // Check location filter
        if (locationName && event.location_id) {
          const { data: loc } = await supabase
            .from('locations')
            .select('name')
            .eq('id', event.location_id)
            .single();

          if (!loc || loc.name !== locationName) {
            include = false;
          }
        } else if (locationName) {
          include = false;
        }

        if (include) {
          results.push({
            id: event.id,
            type: 'event',
            content: event.content || event.description || '',
            description: event.description,
            eventType: event.event_type,
          });
        }
      }
    }

    // Search in story parts
    if (query && !characterName && !locationName) {
      const { data: storyParts, error: partsError } = await supabase
        .from('story_parts')
        .select('id, part_number, title, content, summary')
        .ilike('content', `%${query}%`);

      if (partsError) throw partsError;

      if (storyParts) {
        for (const part of storyParts) {
          // Find the matching excerpt
          const content = part.content || '';
          const queryLower = query.toLowerCase();
          const contentLower = content.toLowerCase();
          const index = contentLower.indexOf(queryLower);

          let excerpt = content;
          if (index !== -1) {
            const start = Math.max(0, index - 200);
            const end = Math.min(content.length, index + query.length + 200);
            excerpt = content.slice(start, end);
            if (start > 0) excerpt = '...' + excerpt;
            if (end < content.length) excerpt = excerpt + '...';
          } else {
            excerpt = content.slice(0, 500);
          }

          results.push({
            id: part.id,
            type: 'story_part',
            content: excerpt,
            description: part.summary || part.title,
            storyPartNumber: part.part_number,
          });
        }
      }
    }

    // Sort by relevance (for now, just return as is)
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error searching flashbacks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search flashbacks' },
      { status: 500 }
    );
  }
}
