import { NextRequest, NextResponse } from "next/server";
import { supabase, uploadImageToStorage } from "@/lib/supabase";

// GET /api/image-studio/gallery?worldId=&category=&characterId=&limit=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const worldId = searchParams.get("worldId");
  const category = searchParams.get("category");
  const characterId = searchParams.get("characterId");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    let query = supabase
      .from("generated_images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (worldId) query = query.eq("world_id", worldId);
    if (category) query = query.eq("category", category);
    if (characterId) query = query.contains("character_ids", [characterId]);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ images: data || [] });
  } catch (error: any) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch gallery" },
      { status: 500 },
    );
  }
}

// POST /api/image-studio/gallery — save an image
// Body: { imageUrl, prompt, negativePrompt?, title?, category?, characterIds?,
//         storyPartIds?, locationIds?, modelUsed?, seed?, steps?, cfgScale?,
//         width?, height?, tags?, notes?, worldId? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageUrl,
      prompt,
      negativePrompt,
      title,
      category,
      characterIds,
      storyPartIds,
      locationIds,
      modelUsed,
      seed,
      steps,
      cfgScale,
      width,
      height,
      tags,
      notes,
      worldId,
    } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "imageUrl and prompt are required" },
        { status: 400 },
      );
    }

    // Upload base64 to Supabase Storage, get back a real URL
    const storedUrl = await uploadImageToStorage(imageUrl, "gallery");

    const { data, error } = await supabase
      .from("generated_images")
      .insert({
        image_url: storedUrl,
        prompt,
        negative_prompt: negativePrompt || null,
        title: title || null,
        category: category || "custom",
        character_ids: characterIds || [],
        story_part_ids: storyPartIds || [],
        location_ids: locationIds || [],
        model_used: modelUsed || null,
        seed: seed || null,
        steps: steps || null,
        cfg_scale: cfgScale || null,
        width: width || 512,
        height: height || 768,
        tags: tags || [],
        notes: notes || null,
        world_id: worldId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ image: data });
  } catch (error: any) {
    console.error("Gallery save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save image" },
      { status: 500 },
    );
  }
}

// DELETE /api/image-studio/gallery?id=<imageId>
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("generated_images")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Gallery delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete image" },
      { status: 500 },
    );
  }
}
