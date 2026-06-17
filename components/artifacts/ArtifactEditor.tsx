"use client";

import { useState } from "react";
import { Button } from "@/components/layout/Button";
import type { Character } from "@/types/artifacts";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const linesToList = (value: string) =>
  value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * Manual character edit (plan §11C). Saving marks the profile authorOverride so
 * background extraction will not overwrite it. Relationships and story refs are
 * preserved as-is; the author edits traits, known locations, and notes.
 */
export function ArtifactEditor({
  character,
  onSave,
  onCancel,
}: {
  character: Character;
  onSave: (next: Character) => Promise<void>;
  onCancel: () => void;
}) {
  const [traits, setTraits] = useState(character.traits.join("\n"));
  const [knownLocations, setKnownLocations] = useState(
    character.knownLocations.join("\n"),
  );
  const [notes, setNotes] = useState(character.notes);
  const [overrideNote, setOverrideNote] = useState(
    character.authorOverrideNote ?? "",
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await onSave({
        ...character,
        traits: linesToList(traits),
        knownLocations: linesToList(knownLocations),
        notes,
        authorOverride: true,
        authorOverrideNote: overrideNote.trim() || "Edited by the author",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Traits (one per line)
        <textarea
          className={fieldClass}
          rows={3}
          value={traits}
          onChange={(e) => setTraits(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Known locations (one per line)
        <textarea
          className={fieldClass}
          rows={2}
          value={knownLocations}
          onChange={(e) => setKnownLocations(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Notes
        <textarea
          className={fieldClass}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Override note (why this is author-set)
        <input
          className={fieldClass}
          value={overrideNote}
          onChange={(e) => setOverrideNote(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" variant="success" loading={busy} onClick={save}>
          Save
        </Button>
        <Button size="sm" variant="secondary" outline onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
