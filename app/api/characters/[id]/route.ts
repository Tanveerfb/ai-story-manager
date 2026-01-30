import { NextRequest, NextResponse } from 'next/server';
import { getCharacterById } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const character = await getCharacterById(id);
    return NextResponse.json(character);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch character' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('characters')
      .update(body)
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
