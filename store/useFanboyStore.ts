import { create } from "zustand";
import type { ChatMessage } from "@/types/llm";

/**
 * Fanboy session state (plan §11E). Session-only — NOT persisted; the inferred
 * personality and conversation live until the page is reloaded, surviving panel
 * open/close.
 */
type FanboyStore = {
  messages: ChatMessage[];
  personality: string | null;
  isProcessing: boolean;
  addMessage: (message: ChatMessage) => void;
  setPersonality: (personality: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  reset: () => void;
};

export const useFanboyStore = create<FanboyStore>((set) => ({
  messages: [],
  personality: null,
  isProcessing: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setPersonality: (personality) => set({ personality }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  reset: () => set({ messages: [], personality: null, isProcessing: false }),
}));
