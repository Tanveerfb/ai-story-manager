/**
 * Provider-agnostic LLM gateway (plan §8).
 *
 * Ollama and LM Studio both expose an OpenAI-compatible REST API, so one client
 * covers both. This module is SERVER-ONLY — the client never calls the local
 * LLM directly; all access goes through Next.js Route Handlers (plan §8, CLAUDE.md).
 */

import "server-only";
import type {
  ChatCompletionRequest,
  ChatCompletionResult,
  EmbeddingRequest,
  EmbeddingResult,
  HealthCheckResult,
  LLMProvider,
} from "@/types/llm";

/** Normalise a configured base URL into an absolute endpoint. */
function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return `${res.status} ${res.statusText}: ${body.slice(0, 500)}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

type ChatApiResponse = {
  choices?: { message?: { content?: string } }[];
  model?: string;
};

/** Run a chat completion against the configured OpenAI-compatible provider. */
export async function chatCompletion(
  baseUrl: string,
  req: ChatCompletionRequest,
): Promise<ChatCompletionResult> {
  const res = await fetch(endpoint(baseUrl, "/chat/completions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.2,
      stream: false,
      ...(req.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: req.signal,
  });

  if (!res.ok) throw new Error(await readError(res));

  const data = (await res.json()) as ChatApiResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM response missing message content");
  }
  return { content, model: data.model ?? req.model };
}

type EmbeddingApiResponse = {
  data?: { embedding?: number[] }[];
  model?: string;
};

/** Embed a single text chunk into a vector. */
export async function createEmbedding(
  baseUrl: string,
  req: EmbeddingRequest,
): Promise<EmbeddingResult> {
  const res = await fetch(endpoint(baseUrl, "/embeddings"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: req.model, input: req.input }),
    signal: req.signal,
  });

  if (!res.ok) throw new Error(await readError(res));

  const data = (await res.json()) as EmbeddingApiResponse;
  const vector = data.data?.[0]?.embedding;
  if (!Array.isArray(vector)) {
    throw new Error("Embedding response missing vector");
  }
  return { vector, model: data.model ?? req.model };
}

type ModelsApiResponse = { data?: { id?: string }[] };

/** Ping the provider's /models endpoint to confirm reachability. */
export async function healthCheck(
  provider: LLMProvider,
  baseUrl: string,
): Promise<HealthCheckResult> {
  try {
    const res = await fetch(endpoint(baseUrl, "/models"), {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, provider, baseUrl, error: await readError(res) };
    }
    const data = (await res.json()) as ModelsApiResponse;
    const models = (data.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string");
    return { ok: true, provider, baseUrl, models };
  } catch (error) {
    return {
      ok: false,
      provider,
      baseUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
