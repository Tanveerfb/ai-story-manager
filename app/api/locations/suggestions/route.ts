import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { groupBySimilarity } from '@/lib/fuzzyMatch';

/**
 * GET - Get fuzzy match suggestions for locations that might be duplicates
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all locations
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;

    if (!locations || locations.length === 0) {
      return NextResponse.json([]);
    }

    // Group locations by similarity (threshold 0.85 for likely duplicates)
    const groups = groupBySimilarity(locations, (loc) => loc.name, 0.85);

    // Filter to only groups with more than 1 location (potential duplicates)
    const duplicateGroups = groups
      .filter((group) => group.length > 1)
      .map((group) => {
        // Calculate average similarity within the group
        let totalSimilarity = 0;
        let comparisons = 0;

        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const { calculateSimilarity } = require('@/lib/fuzzyMatch');
            totalSimilarity += calculateSimilarity(group[i].name, group[j].name);
            comparisons++;
          }
        }

        const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;

        return {
          locations: group,
          similarityScore: avgSimilarity,
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return NextResponse.json(duplicateGroups);
  } catch (error: any) {
    console.error('Error getting location suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
