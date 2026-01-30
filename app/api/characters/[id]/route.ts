import { NextRequest, NextResponse } from 'next/server';
import { getCharacterById } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const character = await getCharacterById(params.id);
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('characters')
      .update(body)
      .eq('id', params.id)
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
