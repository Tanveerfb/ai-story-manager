import { NextRequest, NextResponse } from "next/server";
import {
  generateImageAdvanced,
  isComfyUIAvailable,
  getAvailableModels,
  DEFAULT_NEGATIVE_PROMPT,
} from "@/lib/comfyui";

// GET /api/image-studio/generate?action=status|models
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "models") {
    const models = await getAvailableModels();
    return NextResponse.json({ models });
  }

  const available = await isComfyUIAvailable();
  return NextResponse.json({ available });
}

// POST /api/image-studio/generate
// Body: { prompt, negativePrompt?, width?, height?, steps?, cfg?, seed?, model?,
//         characterIds?, storyPartIds?, locationIds?, category? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, negativePrompt, width, height, steps, cfg, seed, model } =
      body;

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
    });

    return NextResponse.json({
      image: result.imageDataUrl,
      seed: result.seed,
      model: result.model,
      width: result.width,
      height: result.height,
      steps: result.steps,
      cfg: result.cfg,
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 },
    );
  }
}
