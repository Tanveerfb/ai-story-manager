/** Location of a single approved prose addition within the story tree. */
export type StoryRef = {
  part: string;
  chapter: string;
  addition: string;
};

/** Top-level story metadata — story-data/story.json. */
export type StoryMeta = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  currentPart: string;
  currentChapter: string;
  totalAdditions: number;
  storyBibleUpdatedAt: string | null;
};

export type PartMeta = {
  slug: string;
  title: string;
  /** Optional note describing an in-story time gap before this part. */
  timeGapNote: string | null;
};

export type ChapterMeta = {
  slug: string;
  title: string;
  summary: string;
};

/** A single approved prose chunk, stored as additions/NNN.md. */
export type Addition = {
  number: number;
  ref: StoryRef;
  content: string;
  createdAt: string;
};

/** Hierarchical view used by the story navigator. */
export type ChapterNode = ChapterMeta & {
  additions: Addition[];
};

export type PartNode = PartMeta & {
  chapters: ChapterNode[];
};

/** Full server-side view returned by GET /api/story. */
export type StoryTree = {
  meta: StoryMeta;
  parts: PartNode[];
};

/** Compact, always-injected context block (plan §6/§9). Generated in Batch 6. */
export type StoryBible = {
  content: string;
  /** Author annotations that survive regeneration (plan §6 Batch 6). */
  annotations: string;
  updatedAt: string;
};
