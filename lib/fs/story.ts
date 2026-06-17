/**
 * Story structure CRUD over the local filesystem (plan §6, Batch 2).
 * SERVER-ONLY. Layout:
 *   story-data/story.json
 *   story-data/parts/part-NN/meta.json
 *   story-data/parts/part-NN/chapters/ch-NN/meta.json
 *   story-data/parts/part-NN/chapters/ch-NN/additions/NNN.md
 */

import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Addition,
  ChapterMeta,
  ChapterNode,
  PartMeta,
  PartNode,
  StoryMeta,
} from "@/types/story";
import {
  ensureDir,
  listDirs,
  listFiles,
  readJson,
  readText,
  storyRoot,
  writeJson,
  writeText,
} from "@/lib/fs/paths";

const pad = (n: number, width: number) => String(n).padStart(width, "0");

const partsDir = () => path.join(storyRoot(), "parts");
const partDir = (part: string) => path.join(partsDir(), part);
const chaptersDir = (part: string) => path.join(partDir(part), "chapters");
const chapterDir = (part: string, chapter: string) =>
  path.join(chaptersDir(part), chapter);
const additionsDir = (part: string, chapter: string) =>
  path.join(chapterDir(part, chapter), "additions");
const storyMetaFile = () => path.join(storyRoot(), "story.json");

function nextIndex(slugs: string[], prefix: string): number {
  const max = slugs.reduce((acc, slug) => {
    const n = Number.parseInt(slug.replace(`${prefix}-`, ""), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return max + 1;
}

/** Read story.json, creating it (and the data dir) on first launch. */
export async function ensureStory(): Promise<StoryMeta> {
  const existing = await readJson<StoryMeta>(storyMetaFile());
  if (existing) return existing;

  const now = new Date().toISOString();
  const meta: StoryMeta = {
    id: randomUUID(),
    title: "Untitled Story",
    createdAt: now,
    updatedAt: now,
    currentPart: "",
    currentChapter: "",
    totalAdditions: 0,
    storyBibleUpdatedAt: null,
  };
  await writeJson(storyMetaFile(), meta);
  await ensureDir(partsDir());
  return meta;
}

async function patchStory(patch: Partial<StoryMeta>): Promise<StoryMeta> {
  const meta = await ensureStory();
  const next = { ...meta, ...patch, updatedAt: new Date().toISOString() };
  await writeJson(storyMetaFile(), next);
  return next;
}

export async function listParts(): Promise<PartMeta[]> {
  const slugs = await listDirs(partsDir());
  const parts = await Promise.all(
    slugs.map((slug) => readJson<PartMeta>(path.join(partDir(slug), "meta.json"))),
  );
  return parts.filter((p): p is PartMeta => p !== null);
}

export async function createPart(
  title?: string,
  timeGapNote?: string | null,
): Promise<PartMeta> {
  const slugs = await listDirs(partsDir());
  const slug = `part-${pad(nextIndex(slugs, "part"), 2)}`;
  const meta: PartMeta = {
    slug,
    title: title?.trim() || `Part ${slug.replace("part-", "")}`,
    timeGapNote: timeGapNote?.trim() || null,
  };
  await writeJson(path.join(partDir(slug), "meta.json"), meta);
  await ensureDir(chaptersDir(slug));
  await patchStory({ currentPart: slug });
  return meta;
}

export async function listChapters(part: string): Promise<ChapterMeta[]> {
  const slugs = await listDirs(chaptersDir(part));
  const chapters = await Promise.all(
    slugs.map((slug) =>
      readJson<ChapterMeta>(path.join(chapterDir(part, slug), "meta.json")),
    ),
  );
  return chapters.filter((c): c is ChapterMeta => c !== null);
}

export async function createChapter(
  part: string,
  title?: string,
): Promise<ChapterMeta> {
  const slugs = await listDirs(chaptersDir(part));
  const slug = `ch-${pad(nextIndex(slugs, "ch"), 2)}`;
  const meta: ChapterMeta = {
    slug,
    title: title?.trim() || `Chapter ${slug.replace("ch-", "")}`,
    summary: "",
  };
  await writeJson(path.join(chapterDir(part, slug), "meta.json"), meta);
  await ensureDir(additionsDir(part, slug));
  await patchStory({ currentPart: part, currentChapter: slug });
  return meta;
}

export async function listAdditions(
  part: string,
  chapter: string,
): Promise<Addition[]> {
  const dir = additionsDir(part, chapter);
  const files = await listFiles(dir, ".md");
  const additions = await Promise.all(
    files.map(async (file) => {
      const number = Number.parseInt(file.replace(".md", ""), 10);
      const content = (await readText(path.join(dir, file))) ?? "";
      const addition: Addition = {
        number,
        ref: { part, chapter, addition: file.replace(".md", "") },
        content,
        createdAt: "",
      };
      return addition;
    }),
  );
  return additions.sort((a, b) => a.number - b.number);
}

/** Persist an approved prose chunk as the next sequential addition. */
export async function createAddition(
  part: string,
  chapter: string,
  content: string,
): Promise<Addition> {
  const dir = additionsDir(part, chapter);
  const files = await listFiles(dir, ".md");
  const nums = files.map((f) => Number.parseInt(f.replace(".md", ""), 10));
  const number = (nums.length ? Math.max(...nums) : 0) + 1;
  const name = pad(number, 3);
  await writeText(path.join(dir, `${name}.md`), content);

  const meta = await ensureStory();
  await patchStory({
    currentPart: part,
    currentChapter: chapter,
    totalAdditions: meta.totalAdditions + 1,
  });

  return {
    number,
    ref: { part, chapter, addition: name },
    content,
    createdAt: new Date().toISOString(),
  };
}

/** Read a single addition's prose by its path-style chunk reference. */
export async function readAdditionByRef(
  chunkRef: string,
): Promise<string | null> {
  const match = chunkRef.match(/^(.+)\/(.+)\/additions\/(.+)$/);
  if (!match) return null;
  const [, part, chapter, name] = match;
  return readText(path.join(additionsDir(part, chapter), `${name}.md`));
}

/** Full parts → chapters → additions tree for the story navigator. */
export async function getStoryTree(): Promise<{
  meta: StoryMeta;
  parts: PartNode[];
}> {
  const meta = await ensureStory();
  const parts = await listParts();
  const nodes = await Promise.all(
    parts.map(async (part) => {
      const chapters = await listChapters(part.slug);
      const chapterNodes: ChapterNode[] = await Promise.all(
        chapters.map(async (chapter) => ({
          ...chapter,
          additions: await listAdditions(part.slug, chapter.slug),
        })),
      );
      return { ...part, chapters: chapterNodes };
    }),
  );
  return { meta, parts: nodes };
}
