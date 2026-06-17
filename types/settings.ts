import type { LLMProvider } from "@/types/llm";

/** Persisted LLM configuration (localStorage via useSettingsStore). */
export type AppSettings = {
  provider: LLMProvider;
  baseUrl: string;
  generationModel: string;
  embeddingModel: string;
};

export type ConnectionTestState = "idle" | "testing" | "success" | "error";

export type SettingsStore = AppSettings & {
  connectionState: ConnectionTestState;
  connectionError: string | null;
  setProvider: (provider: LLMProvider) => void;
  setBaseUrl: (baseUrl: string) => void;
  setGenerationModel: (model: string) => void;
  setEmbeddingModel: (model: string) => void;
  setConnectionState: (
    state: ConnectionTestState,
    error?: string | null,
  ) => void;
};
