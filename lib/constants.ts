import type { LLMProvider } from "@/types/llm";

/** Per-provider defaults. Both expose OpenAI-compatible endpoints (plan §8). */
export const PROVIDER_DEFAULTS: Record<
  LLMProvider,
  { label: string; baseUrl: string }
> = {
  ollama: { label: "Ollama", baseUrl: "http://localhost:11434/v1" },
  lmstudio: { label: "LM Studio", baseUrl: "http://localhost:1234/v1" },
};

/** Root directory for all story data (server-side only, plan §6). */
export const STORY_DATA_DIR = "story-data";

/** Soft warning threshold for adjustment rounds (plan §7 useEditorStore). */
export const ADJUSTMENT_SOFT_CAP = 3;

/** Story bible token ceiling (plan §9 STORY_BIBLE_UPDATER). */
export const STORY_BIBLE_MAX_TOKENS = 500;

/** Default number of semantically relevant additions to inject (plan §10). */
export const SEARCH_TOP_K = 5;

/** Maximum simultaneously simulated characters (plan §15). */
export const MAX_SIMULATED_CHARACTERS = 2;

/** Low temperature keeps formatting/extraction faithful and deterministic. */
export const FORMATTER_TEMPERATURE = 0.2;
export const EXTRACTION_TEMPERATURE = 0;

/** Auth is optional and feature-flagged; off by default (plan §Batch9). */
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
