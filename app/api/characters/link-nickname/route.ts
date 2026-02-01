import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST - Link a nickname/alias to a canonical character
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, alias } = body;

    if (!characterId || !alias) {
      return NextResponse.json(
        { error: 'characterId and alias are required' },
        { status: 400 }
      );
    }

    // Check if character exists
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('id, name')
      .eq('id', characterId)
      .single();

    if (charError || !character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Check if alias already exists
    const { data: existingAlias, error: checkError } = await supabase
      .from('character_aliases')
      .select('id')
      .eq('character_id', characterId)
      .eq('alias', alias)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingAlias) {
      return NextResponse.json(
        { error: 'This alias is already linked to this character' },
        { status: 400 }
      );
    }

    // Insert the alias
    const { data: newAlias, error: insertError } = await supabase
      .from('character_aliases')
      .insert({
        character_id: characterId,
        alias,
        usage_count: 1,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: `Successfully linked "${alias}" to ${character.name}`,
      alias: newAlias,
    });
  } catch (error: any) {
    console.error('Error linking nickname:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link nickname' },
      { status: 500 }
    );
  }
}
