import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST - Merge duplicate locations into a primary location
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primaryLocationId, duplicateLocationIds } = body;

    if (!primaryLocationId || !Array.isArray(duplicateLocationIds)) {
      return NextResponse.json(
        {
          error: 'Invalid request. primaryLocationId and duplicateLocationIds array required',
        },
        { status: 400 }
      );
    }

    if (duplicateLocationIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one duplicate location ID is required' },
        { status: 400 }
      );
    }

    if (duplicateLocationIds.includes(primaryLocationId)) {
      return NextResponse.json(
        { error: 'Primary location cannot be in the duplicates list' },
        { status: 400 }
      );
    }

    // Fetch primary location
    const { data: primaryLocation, error: primaryError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', primaryLocationId)
      .single();

    if (primaryError || !primaryLocation) {
      return NextResponse.json(
        { error: 'Primary location not found' },
        { status: 404 }
      );
    }

    // Fetch duplicate locations
    const { data: duplicateLocations, error: duplicatesError } = await supabase
      .from('locations')
      .select('*')
      .in('id', duplicateLocationIds);

    if (duplicatesError || !duplicateLocations || duplicateLocations.length === 0) {
      return NextResponse.json(
        { error: 'Duplicate locations not found' },
        { status: 404 }
      );
    }

    // Merge location data
    const mergedData: any = { ...primaryLocation };

    for (const duplicate of duplicateLocations) {
      // Take longest description
      if (
        duplicate.description &&
        (!mergedData.description ||
          duplicate.description.length > mergedData.description.length)
      ) {
        mergedData.description = duplicate.description;
      }
    }

    // Update primary location
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        description: mergedData.description,
      })
      .eq('id', primaryLocationId);

    if (updateError) {
      console.error('Failed to update primary location:', updateError);
      return NextResponse.json(
        { error: 'Failed to update primary location' },
        { status: 500 }
      );
    }

    // Update events to point to primary location
    const { error: eventsError } = await supabase
      .from('events')
      .update({ location_id: primaryLocationId })
      .in('location_id', duplicateLocationIds);

    if (eventsError) {
      console.error('Failed to update events:', eventsError);
    }

    // Create aliases for duplicate location names
    for (const duplicate of duplicateLocations) {
      if (duplicate.name !== primaryLocation.name) {
        await supabase.from('location_aliases').insert({
          location_id: primaryLocationId,
          alias: duplicate.name,
        });
      }
    }

    // Record merge in history
    await supabase.from('merge_history').insert({
      entity_type: 'location',
      primary_entity_id: primaryLocationId,
      primary_entity_name: primaryLocation.name,
      merged_entity_ids: duplicateLocationIds,
      merged_entity_names: duplicateLocations.map((l) => l.name),
    });

    // Delete duplicate locations
    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .in('id', duplicateLocationIds);

    if (deleteError) {
      console.error('Failed to delete duplicate locations:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete duplicate locations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${duplicateLocations.length} location(s) into ${primaryLocation.name}`,
      primaryLocationId,
      mergedCount: duplicateLocations.length,
    });
  } catch (error: any) {
    console.error('Location merge error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge locations' },
      { status: 500 }
    );
  }
}
