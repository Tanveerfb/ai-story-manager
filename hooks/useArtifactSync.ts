"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useQueueStore } from "@/store/useQueueStore";
import type { ArtifactBundle, Character } from "@/types/artifacts";

/**
 * Artifact dashboard data + manual character edits (Batch 5). Server data is
 * owned by SWR (consistent with useStoryFS); the bundle revalidates whenever
 * the background queue drains, so freshly-extracted artifacts appear on their own.
 */
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useArtifactSync() {
  const { data, error, isLoading, mutate } = useSWR<ArtifactBundle>(
    "/api/artifacts",
    getJson,
  );

  const activeJobs = useQueueStore(
    (s) =>
      s.jobs.filter((j) => j.status === "pending" || j.status === "running")
        .length,
  );

  // When the queue goes idle, pull the latest artifacts.
  useEffect(() => {
    if (activeJobs === 0) void mutate();
  }, [activeJobs, mutate]);

  async function saveCharacter(character: Character): Promise<void> {
    const res = await fetch("/api/artifacts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(character),
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    await mutate();
  }

  return {
    bundle: data,
    error: error as Error | undefined,
    isLoading,
    refresh: () => mutate(),
    saveCharacter,
  };
}
