"use client";

import { useSimulationStore } from "@/store/useSimulationStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useStoryFS } from "@/hooks/useStoryFS";
import { useQueueStore } from "@/store/useQueueStore";
import type { SimulationMessage } from "@/types/simulation";

type Suggestion = { part: string; chapter: string; reasoning: string };
export type PreparedScene = Suggestion & { prose: string };

/** Drives a character simulation session (plan §11D, Batch 8). */
export function useSimulationSession() {
  const { createAddition } = useStoryFS();
  const enqueueEmbed = useQueueStore((s) => s.enqueueEmbed);
  const enqueueExtract = useQueueStore((s) => s.enqueueExtract);

  function config() {
    const { baseUrl, generationModel, embeddingModel } =
      useSettingsStore.getState();
    return { baseUrl, generationModel, embeddingModel: embeddingModel || null };
  }

  async function callReply(history: SimulationMessage[]): Promise<string> {
    const { session } = useSimulationStore.getState();
    if (!session) throw new Error("No session");
    const cfg = config();
    if (!cfg.generationModel) throw new Error("No generation model in Settings");

    const res = await fetch("/api/llm/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reply",
        ...cfg,
        simulatedCharacters: session.simulatedCharacters,
        userCharacter: session.userCharacter,
        privateNotes: session.privateNotes,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.error ?? `Request failed: ${res.status}`);
    }
    const data = (await res.json()) as { reply: string };
    return data.reply;
  }

  async function send(text: string) {
    const store = useSimulationStore.getState();
    const session = store.session;
    if (!session || !text.trim()) return;

    store.addUserMessage(session.userCharacter, text.trim());
    store.setProcessing(true);
    try {
      const reply = await callReply(useSimulationStore.getState().messages);
      useSimulationStore
        .getState()
        .addCharacterMessage(session.simulatedCharacters.join(" / "), reply);
    } catch (error) {
      useSimulationStore
        .getState()
        .addCharacterMessage(
          "system",
          `(error: ${error instanceof Error ? error.message : "failed"})`,
        );
    } finally {
      useSimulationStore.getState().setProcessing(false);
    }
  }

  async function regenerate() {
    const store = useSimulationStore.getState();
    if (!store.session) return;
    // Replay up to the last author turn so the model produces a fresh reply.
    const trimmed = [...store.messages];
    while (trimmed.length && trimmed[trimmed.length - 1].role === "character") {
      trimmed.pop();
    }
    if (trimmed.length === 0) return;

    store.setProcessing(true);
    try {
      const reply = await callReply(trimmed);
      useSimulationStore.getState().replaceLastCharacter(reply);
    } finally {
      useSimulationStore.getState().setProcessing(false);
    }
  }

  /** Build a scene from the selected exchanges, format it, suggest a target. */
  async function prepareScene(): Promise<PreparedScene> {
    const { messages, selectedIds } = useSimulationStore.getState();
    const selected = messages.filter((m) => selectedIds.includes(m.id));
    const sceneText = selected
      .map((m) => `${m.speaker}: ${m.content}`)
      .join("\n");
    if (!sceneText.trim()) throw new Error("Select at least one exchange");

    const cfg = config();
    if (!cfg.generationModel) throw new Error("No generation model in Settings");

    const sug = (await postJson("/api/llm/simulate", {
      action: "suggest",
      baseUrl: cfg.baseUrl,
      generationModel: cfg.generationModel,
      sceneText,
    })) as Suggestion;

    const fmt = (await postJson("/api/llm/format", {
      baseUrl: cfg.baseUrl,
      generationModel: cfg.generationModel,
      embeddingModel: cfg.embeddingModel,
      part: sug.part,
      chapter: sug.chapter,
      rawInput: sceneText,
    })) as { prose: string };

    return { ...sug, prose: fmt.prose };
  }

  async function saveScene(part: string, chapter: string, prose: string) {
    const addition = await createAddition(part, chapter, prose);
    const chunkRef = `${part}/${chapter}/additions/${addition.ref.addition}`;
    const payload = {
      text: prose,
      additionNumber: addition.number,
      part,
      chapter,
      characters: [],
      location: null,
    };
    enqueueEmbed(chunkRef, payload);
    enqueueExtract(chunkRef, payload);
    useSimulationStore.getState().reset();
  }

  return { send, regenerate, prepareScene, saveScene };
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
