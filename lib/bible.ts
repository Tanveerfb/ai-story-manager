/**
 * Story bible generation (plan §6/§9, Batch 6). SERVER-ONLY.
 *
 * Built deterministically from story metadata + artifacts + timeline rather
 * than via an LLM. The bible must be "factual only — no interpretation" and
 * bounded (~500 tokens); assembling it from data we already trust guarantees
 * both and cannot hallucinate. Author annotations are stored separately and
 * preserved across regeneration.
 */

import "server-only";
import { ensureStory, listChapters, listParts } from "@/lib/fs/story";
import { readCharacters, readTimeline } from "@/lib/fs/artifacts";
import { readStoryBible, writeStoryBible } from "@/lib/fs/bible";
import type { StoryBible } from "@/types/story";

const MAX_ACTIVE_CHARACTERS = 6;
const MAX_RECENT_EVENTS = 3;

export async function generateStoryBible(): Promise<StoryBible> {
  const meta = await ensureStory();

  const parts = await listParts();
  const part = parts.find((p) => p.slug === meta.currentPart);
  let chapterTitle = meta.currentChapter;
  if (meta.currentPart && meta.currentChapter) {
    const chapters = await listChapters(meta.currentPart);
    chapterTitle =
      chapters.find((c) => c.slug === meta.currentChapter)?.title ??
      meta.currentChapter;
  }

  const characters = await readCharacters();
  const timeline = await readTimeline();

  const active = [...characters]
    .sort(
      (a, b) =>
        (b.lastUpdatedByAddition ?? 0) - (a.lastUpdatedByAddition ?? 0),
    )
    .slice(0, MAX_ACTIVE_CHARACTERS)
    .map((c) => {
      const descriptor = c.traits[0] ?? c.notes.slice(0, 60);
      return descriptor ? `- ${c.name} — ${descriptor}` : `- ${c.name}`;
    });

  const recent = timeline.slice(-MAX_RECENT_EVENTS).map((e) => `- ${e.summary}`);
  const location =
    [...timeline].reverse().find((e) => e.location)?.location ?? "unknown";

  const lines: string[] = [`# Story: ${meta.title}`];
  if (part) lines.push(`Current: ${part.title} › ${chapterTitle}`);
  lines.push(`Current location: ${location}`);
  if (active.length) lines.push(`Active characters:\n${active.join("\n")}`);
  if (recent.length) lines.push(`Recent events:\n${recent.join("\n")}`);

  const existing = await readStoryBible();
  const bible: StoryBible = {
    content: lines.join("\n"),
    annotations: existing?.annotations ?? "",
    updatedAt: new Date().toISOString(),
  };
  await writeStoryBible(bible);
  return bible;
}

/** Update only the author annotations; preserves generated content (plan §6). */
export async function updateAnnotations(
  annotations: string,
): Promise<StoryBible> {
  const existing = await readStoryBible();
  const bible: StoryBible = {
    content: existing?.content ?? "",
    annotations,
    updatedAt: new Date().toISOString(),
  };
  await writeStoryBible(bible);
  return bible;
}
