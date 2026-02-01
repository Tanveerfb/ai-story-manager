import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET - Get unused or rarely used locations
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all locations
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (locError) throw locError;

    if (!locations || locations.length === 0) {
      return NextResponse.json([]);
    }

    // For each location, count how many events reference it
    const locationsWithUsage = await Promise.all(
      locations.map(async (location) => {
        const { count, error: countError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', location.id);

        return {
          ...location,
          usageCount: count || 0,
        };
      })
    );

    // Filter to locations used 0 or 1 times
    const unusedOrRareLocations = locationsWithUsage
      .filter((loc) => loc.usageCount <= 1)
      .sort((a, b) => a.usageCount - b.usageCount);

    return NextResponse.json(unusedOrRareLocations);
  } catch (error: any) {
    console.error('Error getting unused locations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get unused locations' },
      { status: 500 }
    );
  }
}
