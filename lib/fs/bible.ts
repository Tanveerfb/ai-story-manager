/**
 * Story bible read/write (plan §6/§9). SERVER-ONLY.
 * Generated and maintained in Batch 6; the formatter context reads it if present.
 */

import "server-only";
import path from "node:path";
import type { StoryBible } from "@/types/story";
import { readJson, storyRoot, writeJson } from "@/lib/fs/paths";

const bibleFile = () => path.join(storyRoot(), "story-bible.json");

export async function readStoryBible(): Promise<StoryBible | null> {
  return readJson<StoryBible>(bibleFile());
}

export async function writeStoryBible(bible: StoryBible): Promise<void> {
  await writeJson(bibleFile(), bible);
}
