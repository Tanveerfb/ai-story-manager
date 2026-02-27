import { NextRequest, NextResponse } from "next/server";
import { supabase, uploadImageToStorage } from "@/lib/supabase";

// GET /api/image-studio/designs?characterId=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");

  try {
    let query = supabase
      .from("character_designs")
      .select("*, characters(*)")
      .order("created_at", { ascending: false });

    if (characterId) {
      query = query.eq("character_id", characterId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ designs: data || [] });
  } catch (error: any) {
    console.error("Designs fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch designs" },
      { status: 500 },
    );
  }
}

// POST /api/image-studio/designs — set official character design
// Body: { characterId, imageUrl, imageId?, designNotes? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, imageUrl, imageId, designNotes } = body;

    if (!characterId || !imageUrl) {
      return NextResponse.json(
        { error: "characterId and imageUrl are required" },
        { status: 400 },
      );
    }

    // Upload to storage if it's a base64 data URL
    const storedUrl = await uploadImageToStorage(imageUrl, "designs");

    // Deactivate any existing active design for this character
    await supabase
      .from("character_designs")
      .update({ is_active: false })
      .eq("character_id", characterId)
      .eq("is_active", true);

    // Insert new active design
    const { data, error } = await supabase
      .from("character_designs")
      .insert({
        character_id: characterId,
        image_url: storedUrl,
        image_id: imageId || null,
        design_notes: designNotes || null,
        is_active: true,
      })
      .select("*, characters(*)")
      .single();

    if (error) throw error;

    // Also update the character's avatar_url to the official design
    await supabase
      .from("characters")
      .update({ avatar_url: storedUrl })
      .eq("id", characterId);

    return NextResponse.json({ design: data });
  } catch (error: any) {
    console.error("Design set error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set character design" },
      { status: 500 },
    );
  }
}

// DELETE /api/image-studio/designs?id=<designId>
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("character_designs")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Design delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete design" },
      { status: 500 },
    );
  }
}
