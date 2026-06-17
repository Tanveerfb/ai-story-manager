import { NextResponse } from "next/server";
import { z } from "zod";
import { healthCheck } from "@/lib/llm/gateway";

/**
 * Connection test for the configured LLM provider (Batch 1).
 * Pings the provider's /models endpoint and returns reachability + model ids.
 */

const bodySchema = z.object({
  provider: z.enum(["ollama", "lmstudio"]),
  baseUrl: z.string().url(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const result = await healthCheck(parsed.provider, parsed.baseUrl);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
