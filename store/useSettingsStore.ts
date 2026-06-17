import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SettingsStore } from "@/types/settings";
import { PROVIDER_DEFAULTS } from "@/lib/constants";

/**
 * LLM configuration, persisted to localStorage (plan §7 useSettingsStore).
 * Switching provider clears model fields and resets the base URL to that
 * provider's default to prevent mismatches (Batch 1 acceptance criteria).
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      provider: "ollama",
      baseUrl: PROVIDER_DEFAULTS.ollama.baseUrl,
      generationModel: "",
      embeddingModel: "",
      connectionState: "idle",
      connectionError: null,
      availableModels: [],

      setProvider: (provider) =>
        set({
          provider,
          baseUrl: PROVIDER_DEFAULTS[provider].baseUrl,
          generationModel: "",
          embeddingModel: "",
          connectionState: "idle",
          connectionError: null,
          availableModels: [],
        }),
      setBaseUrl: (baseUrl) =>
        set({ baseUrl, connectionState: "idle", availableModels: [] }),
      setGenerationModel: (generationModel) => set({ generationModel }),
      setEmbeddingModel: (embeddingModel) => set({ embeddingModel }),
      setAvailableModels: (availableModels) => set({ availableModels }),
      setConnectionState: (connectionState, connectionError = null) =>
        set({ connectionState, connectionError }),
    }),
    {
      name: "asm-settings",
      // Persist only the configuration, never transient connection state.
      partialize: (state) => ({
        provider: state.provider,
        baseUrl: state.baseUrl,
        generationModel: state.generationModel,
        embeddingModel: state.embeddingModel,
      }),
    },
  ),
);
