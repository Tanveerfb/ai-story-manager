import { NextRequest, NextResponse } from 'next/server';
import { getStoryParts, insertStoryPart } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const parts = await getStoryParts();
    return NextResponse.json(parts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch story parts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const part = await insertStoryPart(body);
    return NextResponse.json(part);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create story part' },
      { status: 500 }
    );
  }
}
