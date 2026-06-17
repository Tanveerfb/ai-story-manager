"use client";

import { useState } from "react";
import { Button } from "@/components/layout/Button";
import { useSimulationStore } from "@/store/useSimulationStore";
import { MAX_SIMULATED_CHARACTERS } from "@/lib/constants";

const fieldClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Pre-session setup (plan §11D): who the LLM plays, who the author plays. */
export function SimulationSetup() {
  const start = useSimulationStore((s) => s.start);
  const [char1, setChar1] = useState("");
  const [char2, setChar2] = useState("");
  const [userCharacter, setUserCharacter] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");

  const simulated = [char1, char2].map((c) => c.trim()).filter(Boolean);
  const canStart = simulated.length > 0 && userCharacter.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Choose up to {MAX_SIMULATED_CHARACTERS} characters for the assistant to
        play, and who you&apos;ll play.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Character the assistant plays
        <input
          className={fieldClass}
          value={char1}
          onChange={(e) => setChar1(e.target.value)}
          placeholder="e.g. Elara Voss"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Second character (optional)
        <input
          className={fieldClass}
          value={char2}
          onChange={(e) => setChar2(e.target.value)}
          placeholder="optional"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Who you play
        <input
          className={fieldClass}
          value={userCharacter}
          onChange={(e) => setUserCharacter(e.target.value)}
          placeholder="a character name, or 'interviewer'"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Private session knowledge (optional)
        <textarea
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          rows={2}
          value={privateNotes}
          onChange={(e) => setPrivateNotes(e.target.value)}
          placeholder="Facts the character knows that aren't in the story yet"
        />
      </label>
      <Button
        variant="primary"
        disabled={!canStart}
        onClick={() =>
          start({
            simulatedCharacters: simulated.slice(0, MAX_SIMULATED_CHARACTERS),
            userCharacter: userCharacter.trim(),
            privateNotes,
          })
        }
        className="sm:w-fit"
      >
        Start session
      </Button>
    </div>
  );
}
