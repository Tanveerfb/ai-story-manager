"use client";

import { useFanboyStore } from "@/store/useFanboyStore";
import { useSettingsStore } from "@/store/useSettingsStore";

/** Sends a fanboy message with session personality + conversation history. */
export function useFanboy() {
  const addMessage = useFanboyStore((s) => s.addMessage);
  const setPersonality = useFanboyStore((s) => s.setPersonality);
  const setProcessing = useFanboyStore((s) => s.setProcessing);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const { baseUrl, generationModel, embeddingModel } =
      useSettingsStore.getState();
    if (!generationModel) {
      addMessage({
        role: "assistant",
        content: "Set a generation model in Settings first.",
      });
      return;
    }

    addMessage({ role: "user", content: trimmed });
    setProcessing(true);
    try {
      const { messages, personality } = useFanboyStore.getState();
      const res = await fetch("/api/llm/fanboy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          generationModel,
          embeddingModel: embeddingModel || null,
          personality,
          messages,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error ?? `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as {
        reply: string;
        personality: string;
      };
      if (data.personality) setPersonality(data.personality);
      addMessage({ role: "assistant", content: data.reply });
    } catch (error) {
      addMessage({
        role: "assistant",
        content: `(error: ${error instanceof Error ? error.message : "failed"})`,
      });
    } finally {
      setProcessing(false);
    }
  }

  return { send };
}
