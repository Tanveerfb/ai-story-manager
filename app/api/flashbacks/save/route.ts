import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET - Fetch all saved flashbacks
 */
export async function GET(request: NextRequest) {
  try {
    const { data: flashbacks, error } = await supabase
      .from('flashbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(flashbacks || []);
  } catch (error: any) {
    console.error('Error fetching flashbacks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch flashbacks' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save a new flashback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, keywords, description } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const { data: flashback, error } = await supabase
      .from('flashbacks')
      .insert({
        title,
        content,
        keywords: keywords || [],
        description,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Flashback saved successfully',
      flashback,
    });
  } catch (error: any) {
    console.error('Error saving flashback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save flashback' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a flashback
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Flashback ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('flashbacks').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Flashback deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting flashback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete flashback' },
      { status: 500 }
    );
  }
}
