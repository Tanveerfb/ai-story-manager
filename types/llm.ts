/**
 * LLM provider configuration and request/response contracts.
 * Both Ollama and LM Studio expose an OpenAI-compatible REST API, so a single
 * set of types covers both providers (plan §8).
 */

export type LLMProvider = "ollama" | "lmstudio";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatCompletionRequest = {
  messages: ChatMessage[];
  model: string;
  /** Defaults to a low temperature for deterministic formatting/extraction. */
  temperature?: number;
  /** Force a JSON object response where the provider supports it. */
  jsonMode?: boolean;
  signal?: AbortSignal;
};

export type ChatCompletionResult = {
  content: string;
  model: string;
};

export type EmbeddingRequest = {
  input: string;
  model: string;
  signal?: AbortSignal;
};

export type EmbeddingResult = {
  vector: number[];
  model: string;
};

/** Resolved provider + base URL used by the gateway for a single call. */
export type ProviderConnection = {
  provider: LLMProvider;
  baseUrl: string;
};

export type HealthCheckResult = {
  ok: boolean;
  provider: LLMProvider;
  baseUrl: string;
  /** Model ids reported by the provider, when reachable. */
  models?: string[];
  error?: string;
};
