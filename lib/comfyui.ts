const COMFYUI_HOST =
  process.env.STABLE_DIFFUSION_HOST ||
  process.env.COMFYUI_HOST ||
  "http://127.0.0.1:8188";

const SD_MODEL = process.env.SD_MODEL || "v1-5-pruned-emaonly.safetensors";

// Build a text-to-image workflow JSON for ComfyUI
function buildWorkflow(
  positivePrompt: string,
  negativePrompt: string,
  width = 512,
  height = 768,
  steps = 25,
  cfg = 7.0,
  seed = Math.floor(Math.random() * 9999999999),
) {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: SD_MODEL },
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
      inputs: { filename_prefix: "portrait", images: ["6", 0] },
    },
  };
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

    // Find the output image
    const outputs = job.outputs;
    for (const nodeId of Object.keys(outputs)) {
      const node = outputs[nodeId];
      if (node.images && node.images.length > 0) {
        const img = node.images[0];
        // Fetch the actual image bytes
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
