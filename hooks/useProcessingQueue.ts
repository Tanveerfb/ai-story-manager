"use client";

import { useEffect, useRef } from "react";
import { useQueueStore } from "@/store/useQueueStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { Job } from "@/types/queue";

/**
 * Background queue processor (plan §12). Runs one job at a time, in order, so
 * embeds never overlap. Failures are handed to the store's auto-retry-once
 * policy. Mount this once (see QueueProcessor in the root layout).
 */
async function runEmbed(job: Job): Promise<void> {
  const { baseUrl, embeddingModel } = useSettingsStore.getState();
  if (!embeddingModel) throw new Error("No embedding model configured");
  if (!job.payload) throw new Error("Embed job missing payload");

  const res = await fetch("/api/llm/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseUrl,
      model: embeddingModel,
      text: job.payload.text,
      chunkRef: job.additionRef,
      additionNumber: job.payload.additionNumber,
      metadata: {
        part: job.payload.part,
        chapter: job.payload.chapter,
        characters: job.payload.characters,
        location: job.payload.location,
      },
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Embed failed: ${res.status}`);
  }
}

async function runExtract(job: Job): Promise<void> {
  const { baseUrl, generationModel } = useSettingsStore.getState();
  if (!generationModel) throw new Error("No generation model configured");
  if (!job.payload) throw new Error("Extract job missing payload");

  const res = await fetch("/api/llm/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseUrl,
      generationModel,
      part: job.payload.part,
      chapter: job.payload.chapter,
      additionNumber: job.payload.additionNumber,
      text: job.payload.text,
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Extract failed: ${res.status}`);
  }
}

export function useProcessingQueue() {
  const jobs = useQueueStore((s) => s.jobs);
  const busy = useRef(false);

  useEffect(() => {
    if (busy.current) return;
    // First pending job in order — embed is enqueued before extract (§12).
    const next = jobs.find((j) => j.status === "pending");
    if (!next) return;

    busy.current = true;
    const { setStatus, markFailed } = useQueueStore.getState();
    setStatus(next.id, "running");

    const run = next.type === "embed" ? runEmbed : runExtract;
    run(next)
      .then(() => setStatus(next.id, "done"))
      .catch((error: unknown) =>
        markFailed(
          next.id,
          error instanceof Error ? error.message : String(error),
        ),
      )
      .finally(() => {
        busy.current = false;
      });
  }, [jobs]);
}
