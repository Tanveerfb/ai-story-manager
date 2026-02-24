import { NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  buildCharacterPrompt,
  isComfyUIAvailable,
  getAvailableModels,
} from "@/lib/comfyui";
import { supabase } from "@/lib/supabase";

// GET /api/generate-portrait?action=status  — check if ComfyUI is running
// GET /api/generate-portrait?action=models  — list available SD models
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "models") {
    const models = await getAvailableModels();
    return NextResponse.json({ models });
  }

  // Default: status check
  const available = await isComfyUIAvailable();
  return NextResponse.json({ available });
}

// POST /api/generate-portrait
// Body: { characterId, customPrompt? }
export async function POST(request: NextRequest) {
  try {
    const { characterId, customPrompt } = await request.json();

    if (!characterId) {
      return NextResponse.json(
        { error: "characterId is required" },
        { status: 400 },
      );
    }

    // Check ComfyUI is running
    const available = await isComfyUIAvailable();
    if (!available) {
      return NextResponse.json(
        {
          error:
            "ComfyUI is not running. Start it with: python main.py --listen 0.0.0.0",
        },
        { status: 503 },
      );
    }

    // Fetch character
    const { data: character, error: charError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (charError || !character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    // Build prompt from character fields (or use custom)
    const { positive, negative } = buildCharacterPrompt(character);
    const finalPositive = customPrompt
      ? `manga art style, anime character portrait, ${customPrompt}`
      : positive;

    // Generate image (this can take 30-90s)
    const portraitDataUrl = await generateImage(finalPositive, negative);

    // Save the portrait as avatar_url in the character record
    const { error: updateError } = await supabase
      .from("characters")
      .update({ avatar_url: portraitDataUrl })
      .eq("id", characterId);

    if (updateError) {
      console.error("Failed to save portrait:", updateError);
      // Still return the image even if save failed
      return NextResponse.json({
        portrait: portraitDataUrl,
        saved: false,
        warning: "Generated but failed to save to database",
      });
    }

    return NextResponse.json({
      portrait: portraitDataUrl,
      saved: true,
    });
  } catch (error: any) {
    console.error("Portrait generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate portrait" },
      { status: 500 },
    );
  }
}
