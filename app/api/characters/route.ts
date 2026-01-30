import { NextRequest, NextResponse } from 'next/server';
import { getCharacters, insertCharacter, getCharacterById } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const id = searchParams.get('id');

    if (id) {
      const character = await getCharacterById(id);
      return NextResponse.json(character);
    }

    const characters = await getCharacters(role || undefined);
    return NextResponse.json(characters);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const character = await insertCharacter(body);
    return NextResponse.json(character);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create character' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update character' },
      { status: 500 }
    );
  }
}
