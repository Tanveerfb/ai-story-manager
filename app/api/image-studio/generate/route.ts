import { NextRequest, NextResponse } from "next/server";
import {
  generateImageAdvanced,
  isComfyUIAvailable,
  getAvailableModels,
  uploadImageToComfyUI,
  DEFAULT_NEGATIVE_PROMPT,
} from "@/lib/comfyui";
import { supabase } from "@/lib/supabase";

// GET /api/image-studio/generate?action=status|models
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "models") {
    const models = await getAvailableModels();
    return NextResponse.json({ models });
  }

  // action=references&characterIds=id1,id2  — get reference images for chars
  if (action === "references") {
    const charIdsRaw = searchParams.get("characterIds") || "";
    const characterIds = charIdsRaw.split(",").filter(Boolean);
    if (characterIds.length === 0) {
      return NextResponse.json({ references: [] });
    }

    try {
      const references = await getCharacterReferences(characterIds);
      return NextResponse.json({ references });
    } catch (err: any) {
      console.error("Failed to fetch references:", err);
      return NextResponse.json({ references: [] });
    }
  }

  const available = await isComfyUIAvailable();
  return NextResponse.json({ available });
}

/**
 * For a list of character IDs, find the best reference image for each.
 * Priority: active official design > most recent gallery image with that character.
 * Returns an array of { characterId, characterName, imageUrl, source }.
 */
async function getCharacterReferences(characterIds: string[]): Promise<
  Array<{
    characterId: string;
    characterName: string;
    imageUrl: string;
    source: "design" | "gallery";
  }>
> {
  const results: Array<{
    characterId: string;
    characterName: string;
    imageUrl: string;
    source: "design" | "gallery";
  }> = [];

  for (const charId of characterIds) {
    // Try official active design first
    const { data: design } = await supabase
      .from("character_designs")
      .select("image_url, characters(name)")
      .eq("character_id", charId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (design?.image_url) {
      results.push({
        characterId: charId,
        characterName: (design as any).characters?.name || "Unknown",
        imageUrl: design.image_url,
        source: "design",
      });
      continue;
    }

    // Fall back to most recent gallery image linked to this character
    const { data: galleryImages } = await supabase
      .from("generated_images")
      .select("image_url")
      .contains("character_ids", [charId])
      .order("created_at", { ascending: false })
      .limit(1);

    if (galleryImages && galleryImages.length > 0) {
      // Get character name
      const { data: charData } = await supabase
        .from("characters")
        .select("name")
        .eq("id", charId)
        .single();

      results.push({
        characterId: charId,
        characterName: charData?.name || "Unknown",
        imageUrl: galleryImages[0].image_url,
        source: "gallery",
      });
    }
  }

  return results;
}

// POST /api/image-studio/generate
// Body: { prompt, negativePrompt?, width?, height?, steps?, cfg?, seed?, model?,
//         characterIds?, storyPartIds?, locationIds?, category?,
//         useReference?: boolean, denoise?: number }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      cfg,
      seed,
      model,
      characterIds,
      useReference,
      denoise,
    } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
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

    // If reference mode is enabled and characters are selected, find and upload reference
    let referenceImageFilename: string | undefined;
    let referenceUsed: string | undefined;

    if (
      useReference &&
      Array.isArray(characterIds) &&
      characterIds.length > 0
    ) {
      try {
        const refs = await getCharacterReferences(characterIds);
        if (refs.length > 0) {
          // Use the first character's reference (primary character)
          const ref = refs[0];
          referenceImageFilename = await uploadImageToComfyUI(ref.imageUrl);
          referenceUsed = `${ref.characterName} (${ref.source})`;
          console.log(
            `Using reference image for ${ref.characterName}: ${referenceImageFilename}`,
          );
        }
      } catch (refErr: any) {
        // Non-fatal — fall back to txt2img
        console.warn(
          "Failed to use reference image, falling back to txt2img:",
          refErr.message,
        );
      }
    }

    const result = await generateImageAdvanced({
      positivePrompt: prompt,
      negativePrompt: negativePrompt || DEFAULT_NEGATIVE_PROMPT,
      width: width || 832,
      height: height || 1216,
      steps: steps || 28,
      cfg: cfg || 6.0,
      seed: seed || undefined,
      model: model || undefined,
      filenamePrefix: "studio",
      referenceImageFilename,
      denoise: referenceImageFilename ? (denoise ?? 0.65) : undefined,
    });

    return NextResponse.json({
      image: result.imageDataUrl,
      seed: result.seed,
      model: result.model,
      width: result.width,
      height: result.height,
      steps: result.steps,
      cfg: result.cfg,
      referenceUsed: referenceUsed || null,
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 },
    );
  }
}
