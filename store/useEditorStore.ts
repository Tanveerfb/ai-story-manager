import { create } from "zustand";
import type { ChatMessage } from "@/types/llm";

/**
 * Prose editor + adjustment-loop state (plan §7 useEditorStore). The history
 * accumulates the full assistant/author exchange so each adjustment round has
 * complete context; it is cleared on approve or discard.
 */
type ApprovalStatus = "idle" | "reviewing" | "approved" | "discarded";
type EditorPhase = "idle" | "formatting";

type EditorStore = {
  rawInput: string;
  currentDraft: string;
  diffSummary: string | null;
  adjustmentHistory: ChatMessage[];
  adjustmentCount: number;
  approvalStatus: ApprovalStatus;
  phase: EditorPhase;
  error: string | null;

  setRawInput: (value: string) => void;
  startFormatting: () => void;
  setDraft: (prose: string, summary: string, history: ChatMessage[]) => void;
  beginAdjust: (history: ChatMessage[]) => void;
  setError: (error: string) => void;
  dismissDiff: () => void;
  reset: () => void;
};

const initial = {
  rawInput: "",
  currentDraft: "",
  diffSummary: null as string | null,
  adjustmentHistory: [] as ChatMessage[],
  adjustmentCount: 0,
  approvalStatus: "idle" as ApprovalStatus,
  phase: "idle" as EditorPhase,
  error: null as string | null,
};

export const useEditorStore = create<EditorStore>((set) => ({
  ...initial,

  setRawInput: (rawInput) => set({ rawInput }),
  startFormatting: () => set({ phase: "formatting", error: null }),
  setDraft: (currentDraft, diffSummary, adjustmentHistory) =>
    set({
      currentDraft,
      diffSummary,
      adjustmentHistory,
      approvalStatus: "reviewing",
      phase: "idle",
      error: null,
    }),
  beginAdjust: (adjustmentHistory) =>
    set((state) => ({
      adjustmentHistory,
      adjustmentCount: state.adjustmentCount + 1,
      phase: "formatting",
      error: null,
    })),
  setError: (error) => set({ error, phase: "idle" }),
  dismissDiff: () => set({ diffSummary: null }),
  reset: () => set({ ...initial }),
}));
