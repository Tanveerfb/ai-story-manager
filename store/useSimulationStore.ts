import { create } from "zustand";
import type { SimulationMessage, SimulationSession } from "@/types/simulation";

/**
 * Character simulation session state (plan §11D, §7). Session-only — not
 * persisted. Phases: setup → chat → review.
 */
type Phase = "setup" | "chat" | "review";

type StartConfig = {
  simulatedCharacters: string[];
  userCharacter: string;
  privateNotes: string;
};

type SimulationStore = {
  phase: Phase;
  session: SimulationSession | null;
  messages: SimulationMessage[];
  selectedIds: string[];
  isProcessing: boolean;

  start: (config: StartConfig) => void;
  addUserMessage: (speaker: string, content: string) => void;
  addCharacterMessage: (speaker: string, content: string) => void;
  replaceLastCharacter: (content: string) => void;
  acceptLastCharacter: () => void;
  setProcessing: (value: boolean) => void;
  endSession: () => void;
  toggleSelect: (id: string) => void;
  reset: () => void;
};

const uid = () => crypto.randomUUID();

function acceptTrailingCharacter(messages: SimulationMessage[]) {
  const last = messages[messages.length - 1];
  if (last && last.role === "character") last.accepted = true;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  phase: "setup",
  session: null,
  messages: [],
  selectedIds: [],
  isProcessing: false,

  start: (config) =>
    set({
      phase: "chat",
      session: {
        id: uid(),
        simulatedCharacters: config.simulatedCharacters,
        userCharacter: config.userCharacter,
        privateNotes: config.privateNotes,
        startedAt: new Date().toISOString(),
      },
      messages: [],
      selectedIds: [],
    }),

  // Sending a new author turn auto-approves the prior character turn (§11D).
  addUserMessage: (speaker, content) =>
    set((state) => {
      const messages = [...state.messages];
      acceptTrailingCharacter(messages);
      messages.push({ id: uid(), role: "user", speaker, content, accepted: true });
      return { messages };
    }),

  addCharacterMessage: (speaker, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: uid(), role: "character", speaker, content, accepted: false },
      ],
    })),

  replaceLastCharacter: (content) =>
    set((state) => {
      const messages = [...state.messages];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "character") {
          messages[i] = { ...messages[i], content, accepted: false };
          break;
        }
      }
      return { messages };
    }),

  acceptLastCharacter: () =>
    set((state) => {
      const messages = [...state.messages];
      acceptTrailingCharacter(messages);
      return { messages };
    }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  endSession: () =>
    set((state) => {
      const messages = [...state.messages];
      acceptTrailingCharacter(messages);
      // Default every message selected for review cherry-picking.
      return {
        phase: "review",
        messages,
        selectedIds: messages.map((m) => m.id),
      };
    }),

  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id],
    })),

  reset: () =>
    set({
      phase: "setup",
      session: null,
      messages: [],
      selectedIds: [],
      isProcessing: false,
    }),
}));
