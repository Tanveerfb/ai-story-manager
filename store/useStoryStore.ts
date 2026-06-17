import { create } from "zustand";

/**
 * Story navigation selection (plan §7). Server data (the parts/chapters tree)
 * is owned by useStoryFS via SWR; this store holds only the author's current
 * place in the story so it survives navigation between pages.
 */
type StoryStore = {
  currentPart: string | null;
  currentChapter: string | null;
  selectPart: (part: string | null) => void;
  selectChapter: (part: string, chapter: string) => void;
};

export const useStoryStore = create<StoryStore>((set) => ({
  currentPart: null,
  currentChapter: null,
  selectPart: (currentPart) => set({ currentPart, currentChapter: null }),
  selectChapter: (currentPart, currentChapter) =>
    set({ currentPart, currentChapter }),
}));
