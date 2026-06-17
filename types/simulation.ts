export type SimulationMessageRole = "user" | "character";

export type SimulationMessage = {
  id: string;
  role: SimulationMessageRole;
  /** Slug of the speaking character, or "author" for the user's turn. */
  speaker: string;
  content: string;
  /** Character turns are explicitly or implicitly accepted before insertion. */
  accepted: boolean;
};

export type SimulationSession = {
  id: string;
  /** Slugs of characters the LLM simulates (max 2, plan §15). */
  simulatedCharacters: string[];
  /** Slug the author plays, or "author" for interviewer mode. */
  userCharacter: string;
  /** Private knowledge defined for this session only — never persisted to story. */
  privateNotes: string;
  startedAt: string;
};
