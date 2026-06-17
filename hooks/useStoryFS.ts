"use client";

import useSWR from "swr";
import type { Addition, ChapterMeta, PartMeta, StoryTree } from "@/types/story";

/**
 * Client access to the story filesystem via SWR (Batch 2). All mutations POST
 * to /api/story and then revalidate the cached tree so the navigator stays in
 * sync. Errors are thrown to the caller to surface in the UI (rules §10/§16).
 */

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useStoryFS() {
  const { data, error, isLoading, mutate } = useSWR<StoryTree>(
    "/api/story",
    getJson,
  );

  return {
    tree: data,
    error: error as Error | undefined,
    isLoading,
    refresh: () => mutate(),
    createPart: async (title?: string, timeGapNote?: string | null) => {
      const part = await postJson<PartMeta>("/api/story", {
        action: "createPart",
        title,
        timeGapNote,
      });
      await mutate();
      return part;
    },
    createChapter: async (part: string, title?: string) => {
      const chapter = await postJson<ChapterMeta>("/api/story", {
        action: "createChapter",
        part,
        title,
      });
      await mutate();
      return chapter;
    },
    createAddition: async (part: string, chapter: string, content: string) => {
      const addition = await postJson<Addition>("/api/story", {
        action: "createAddition",
        part,
        chapter,
        content,
      });
      await mutate();
      return addition;
    },
  };
}
