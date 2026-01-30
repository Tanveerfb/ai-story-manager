import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      storyPartId: searchParams.get('story_part_id') || undefined,
      characterId: searchParams.get('character_id') || undefined,
      locationId: searchParams.get('location_id') || undefined,
    };

    const events = await getEvents(filters);
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
