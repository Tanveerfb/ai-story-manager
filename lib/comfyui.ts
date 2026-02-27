const COMFYUI_HOST =
  process.env.STABLE_DIFFUSION_HOST ||
  process.env.COMFYUI_HOST ||
  "http://127.0.0.1:8188";

const SD_MODEL = process.env.SD_MODEL || "animagineXLV31_v31.safetensors";

export interface ImageGenerationOptions {
  positivePrompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  model?: string;
  filenamePrefix?: string;
  /** Filename already uploaded to ComfyUI input/ folder */
  referenceImageFilename?: string;
  /** 0.0 = exact copy, 1.0 = ignore reference. Default 0.65 */
  denoise?: number;
}

export interface ImageGenerationResult {
  imageDataUrl: string;
  seed: number;
  model: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
}

// Build a text-to-image workflow JSON for ComfyUI
function buildWorkflow(
  positivePrompt: string,
  negativePrompt: string,
  width = 832,
  height = 1216,
  steps = 28,
  cfg = 6.0,
  seed = Math.floor(Math.random() * 9999999999),
  model?: string,
  filenamePrefix = "studio",
) {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: model || SD_MODEL },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: positivePrompt, clip: ["1", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt, clip: ["1", 1] },
    },
    "4": {
      class_type: "EmptyLatentImage",
      inputs: { width, height, batch_size: 1 },
    },
    "5": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: "euler_ancestral",
        scheduler: "karras",
        denoise: 1.0,
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["4", 0],
      },
    },
    "6": {
      class_type: "VAEDecode",
      inputs: { samples: ["5", 0], vae: ["1", 2] },
    },
    "7": {
      class_type: "SaveImage",
      inputs: { filename_prefix: filenamePrefix, images: ["6", 0] },
    },
  };
}

// Build an img2img workflow — uses a reference image as the starting latent
function buildImg2ImgWorkflow(
  positivePrompt: string,
  negativePrompt: string,
  referenceFilename: string,
  width = 832,
  height = 1216,
  steps = 28,
  cfg = 6.0,
  denoise = 0.65,
  seed = Math.floor(Math.random() * 9999999999),
  model?: string,
  filenamePrefix = "studio",
) {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: model || SD_MODEL },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: positivePrompt, clip: ["1", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt, clip: ["1", 1] },
    },
    // Load the reference image instead of empty latent
    "8": {
      class_type: "LoadImage",
      inputs: { image: referenceFilename },
    },
    // Resize to target dimensions
    "9": {
      class_type: "ImageScale",
      inputs: {
        image: ["8", 0],
        upscale_method: "lanczos",
        width,
        height,
        crop: "center",
      },
    },
    // Encode the reference into latent space
    "10": {
      class_type: "VAEEncode",
      inputs: { pixels: ["9", 0], vae: ["1", 2] },
    },
    "5": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: "euler_ancestral",
        scheduler: "karras",
        denoise,
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["10", 0],
      },
    },
    "6": {
      class_type: "VAEDecode",
      inputs: { samples: ["5", 0], vae: ["1", 2] },
    },
    "7": {
      class_type: "SaveImage",
      inputs: { filename_prefix: filenamePrefix, images: ["6", 0] },
    },
  };
}

/**
 * Upload an image (from URL or base64 data-URL) to ComfyUI's input/ folder.
 * Returns the filename as ComfyUI knows it.
 */
export async function uploadImageToComfyUI(
  imageSource: string,
): Promise<string> {
  let buffer: Buffer;
  let ext = "png";

  if (imageSource.startsWith("data:image/")) {
    // base64 data URL
    const m = imageSource.match(/^data:image\/(\w+);base64,(.+)$/s);
    if (!m) throw new Error("Invalid base64 data URL for reference image");
    ext = m[1] === "jpeg" ? "jpg" : m[1];
    buffer = Buffer.from(m[2], "base64");
  } else {
    // HTTP URL — download
    const res = await fetch(imageSource);
    if (!res.ok)
      throw new Error(`Failed to download reference image: ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("jpeg") || contentType.includes("jpg"))
      ext = "jpg";
    else if (contentType.includes("webp")) ext = "webp";
    const ab = await res.arrayBuffer();
    buffer = Buffer.from(ab);
  }

  const filename = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

  // ComfyUI /upload/image endpoint expects multipart/form-data
  const form = new FormData();
  form.append("image", new Blob([buffer], { type: `image/${ext}` }), filename);
  form.append("overwrite", "true");

  const uploadRes = await fetch(`${COMFYUI_HOST}/upload/image`, {
    method: "POST",
    body: form as any,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`ComfyUI image upload failed: ${err}`);
  }

  const data = await uploadRes.json();
  return data.name || filename;
}

// Build a character-appropriate SD prompt from character fields
export function buildCharacterPrompt(character: {
  name: string;
  description?: string;
  physical_traits?: any;
  personality?: any;
  role?: string;
}): { positive: string; negative: string } {
  const parts: string[] = [
    "manga art style",
    "anime character portrait",
    "detailed face",
    "upper body",
    "clean linework",
    "professional illustration",
  ];

  // Add physical description
  if (character.description) {
    parts.push(character.description);
  }

  // Add physical traits if they exist
  if (character.physical_traits) {
    const traits =
      typeof character.physical_traits === "string"
        ? character.physical_traits
        : JSON.stringify(character.physical_traits);
    parts.push(traits);
  }

  // Add personality hints to the visual style
  if (character.personality) {
    const p =
      typeof character.personality === "string"
        ? character.personality.toLowerCase()
        : "";
    if (p.includes("serious") || p.includes("cold"))
      parts.push("serious expression");
    if (p.includes("cheerful") || p.includes("bright"))
      parts.push("warm smile");
    if (p.includes("mature")) parts.push("mature elegant look");
    if (p.includes("bratty") || p.includes("playful")) parts.push("smug smirk");
  }

  const positive = parts.join(", ");

  const negative = [
    "lowres",
    "bad anatomy",
    "bad hands",
    "text",
    "error",
    "missing fingers",
    "extra digit",
    "fewer digits",
    "cropped",
    "worst quality",
    "low quality",
    "normal quality",
    "jpeg artifacts",
    "signature",
    "watermark",
    "username",
    "blurry",
    "deformed",
    "ugly",
    "disfigured",
    "extra limbs",
    "3d render",
    "photograph",
    "realistic",
  ].join(", ");

  return { positive, negative };
}

// Queue a prompt and wait for the result, returning a base64 data URL
export async function generateImage(
  positivePrompt: string,
  negativePrompt: string,
  width = 512,
  height = 768,
): Promise<string> {
  const workflow = buildWorkflow(positivePrompt, negativePrompt, width, height);

  // Queue the prompt
  const queueRes = await fetch(`${COMFYUI_HOST}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!queueRes.ok) {
    const err = await queueRes.text();
    throw new Error(`ComfyUI queue error: ${err}`);
  }

  const { prompt_id } = await queueRes.json();

  // Poll history until done (max 3 minutes)
  const imageData = await pollForResult(prompt_id, 180);
  return imageData;
}

// Default negative prompt — optimised for Animagine XL 3.1
export const DEFAULT_NEGATIVE_PROMPT = [
  "lowres",
  "(bad)",
  "text",
  "error",
  "fewer",
  "extra",
  "missing",
  "worst quality",
  "jpeg artifacts",
  "low quality",
  "watermark",
  "unfinished",
  "displeasing",
  "oldest",
  "early",
  "chromatic aberration",
  "signature",
  "extra digits",
  "artistic error",
  "username",
  "scan",
  "[abstract]",
].join(", ");

// Advanced generation with full options and metadata return
export async function generateImageAdvanced(
  opts: ImageGenerationOptions,
): Promise<ImageGenerationResult> {
  const seed = opts.seed ?? Math.floor(Math.random() * 9999999999);
  const width = opts.width ?? 832;
  const height = opts.height ?? 1216;
  const steps = opts.steps ?? 28;
  const cfg = opts.cfg ?? 6.0;
  const negativePrompt = opts.negativePrompt || DEFAULT_NEGATIVE_PROMPT;
  const model = opts.model || SD_MODEL;

  // Choose txt2img or img2img workflow based on reference image
  const workflow = opts.referenceImageFilename
    ? buildImg2ImgWorkflow(
        opts.positivePrompt,
        negativePrompt,
        opts.referenceImageFilename,
        width,
        height,
        steps,
        cfg,
        opts.denoise ?? 0.65,
        seed,
        model,
        opts.filenamePrefix || "studio",
      )
    : buildWorkflow(
        opts.positivePrompt,
        negativePrompt,
        width,
        height,
        steps,
        cfg,
        seed,
        model,
        opts.filenamePrefix || "studio",
      );

  const queueRes = await fetch(`${COMFYUI_HOST}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!queueRes.ok) {
    const err = await queueRes.text();
    throw new Error(`ComfyUI queue error: ${err}`);
  }

  const { prompt_id } = await queueRes.json();
  const imageDataUrl = await pollForResult(prompt_id, 300);

  return {
    imageDataUrl,
    seed,
    model,
    width,
    height,
    steps,
    cfg,
  };
}

async function pollForResult(
  promptId: string,
  timeoutSeconds: number,
): Promise<string> {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));

    const histRes = await fetch(`${COMFYUI_HOST}/history/${promptId}`);
    if (!histRes.ok) continue;

    const history = await histRes.json();
    const job = history[promptId];

    if (!job) continue; // not done yet

    // Find the output image — prefer SaveImage node ("7"), fall back to any node
    const outputs = job.outputs;
    // First check our known SaveImage node
    if (outputs["7"]?.images?.length > 0) {
      const img = outputs["7"].images[0];
      const imgRes = await fetch(
        `${COMFYUI_HOST}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || "")}&type=${img.type || "output"}`,
      );
      if (!imgRes.ok) throw new Error("Failed to fetch generated image");
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return `data:image/png;base64,${base64}`;
    }
    // Fallback: find any node with output type "output" images
    for (const nodeId of Object.keys(outputs)) {
      const node = outputs[nodeId];
      if (node.images && node.images.length > 0) {
        const img = node.images[0];
        if (img.type && img.type !== "output") continue; // skip input/temp images
        const imgRes = await fetch(
          `${COMFYUI_HOST}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || "")}&type=${img.type || "output"}`,
        );
        if (!imgRes.ok) throw new Error("Failed to fetch generated image");

        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return `data:image/png;base64,${base64}`;
      }
    }
  }

  throw new Error("ComfyUI generation timed out after 3 minutes");
}

// Check if ComfyUI is reachable
export async function isComfyUIAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${COMFYUI_HOST}/system_stats`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Get list of available checkpoint models from ComfyUI
export async function getAvailableModels(): Promise<string[]> {
  try {
    const res = await fetch(
      `${COMFYUI_HOST}/object_info/CheckpointLoaderSimple`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
  } catch {
    return [];
  }
}
