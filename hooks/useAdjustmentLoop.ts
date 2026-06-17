"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useStoryStore } from "@/store/useStoryStore";
import { useStoryFS } from "@/hooks/useStoryFS";
import { useQueueStore } from "@/store/useQueueStore";
import type { ChatMessage } from "@/types/llm";

type FormatResponse = { prose: string; summary: string };

/**
 * Drives the prose editor loop (plan §11): format → review → adjust* → approve.
 * Adjustment history is replayed to the formatter each round; approval saves
 * the addition and enqueues background jobs.
 */
export function useAdjustmentLoop() {
  const { createAddition } = useStoryFS();
  const enqueueEmbed = useQueueStore((s) => s.enqueueEmbed);
  const enqueueExtract = useQueueStore((s) => s.enqueueExtract);

  async function postFormat(adjustments: ChatMessage[]): Promise<FormatResponse> {
    const { baseUrl, generationModel, embeddingModel } =
      useSettingsStore.getState();
    const { currentPart, currentChapter } = useStoryStore.getState();
    const { rawInput } = useEditorStore.getState();

    if (!generationModel) throw new Error("No generation model set in Settings");
    if (!currentPart || !currentChapter) {
      throw new Error("Select a chapter in the Story view first");
    }

    const res = await fetch("/api/llm/format", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl,
        generationModel,
        embeddingModel: embeddingModel || null,
        part: currentPart,
        chapter: currentChapter,
        rawInput,
        adjustments,
      }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.error ?? `Formatting failed: ${res.status}`);
    }
    return res.json() as Promise<FormatResponse>;
  }

  async function format() {
    const store = useEditorStore.getState();
    if (!store.rawInput.trim()) return;
    store.startFormatting();
    try {
      const { prose, summary } = await postFormat([]);
      useEditorStore
        .getState()
        .setDraft(prose, summary, [{ role: "assistant", content: prose }]);
    } catch (error) {
      useEditorStore
        .getState()
        .setError(error instanceof Error ? error.message : "Formatting failed");
    }
  }

  async function adjust(instruction: string) {
    if (!instruction.trim()) return;
    const history: ChatMessage[] = [
      ...useEditorStore.getState().adjustmentHistory,
      { role: "user", content: instruction },
    ];
    useEditorStore.getState().beginAdjust(history);
    try {
      const { prose, summary } = await postFormat(history);
      useEditorStore
        .getState()
        .setDraft(prose, summary, [
          ...history,
          { role: "assistant", content: prose },
        ]);
    } catch (error) {
      useEditorStore
        .getState()
        .setError(error instanceof Error ? error.message : "Adjustment failed");
    }
  }

  async function approve() {
    const { currentDraft } = useEditorStore.getState();
    const { currentPart, currentChapter } = useStoryStore.getState();
    if (!currentDraft || !currentPart || !currentChapter) return;

    const addition = await createAddition(
      currentPart,
      currentChapter,
      currentDraft,
    );
    const chunkRef = `${currentPart}/${currentChapter}/additions/${addition.ref.addition}`;
    // Plan §10: approval pushes embed then extract (embed runs first).
    const payload = {
      text: currentDraft,
      additionNumber: addition.number,
      part: currentPart,
      chapter: currentChapter,
      characters: [],
      location: null,
    };
    enqueueEmbed(chunkRef, payload);
    enqueueExtract(chunkRef, payload);
    useEditorStore.getState().reset();
  }

  function discard() {
    useEditorStore.getState().reset();
  }

  return { format, adjust, approve, discard };
}
