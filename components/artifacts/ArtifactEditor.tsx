"use client";

import { useState } from "react";
import { Button } from "@/components/layout/Button";
import { useArtifactSync } from "@/hooks/useArtifactSync";
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
  const { bundle } = useArtifactSync();
  const [traits, setTraits] = useState(character.traits.join("\n"));
  const [knownLocations, setKnownLocations] = useState<string[]>(
    character.knownLocations,
  );
  const [notes, setNotes] = useState(character.notes);
  const [overrideNote, setOverrideNote] = useState(
    character.authorOverrideNote ?? "",
  );
  const [busy, setBusy] = useState(false);

  // Locations are canon-only: choose from the bible, plus any already on this
  // profile (so older data isn't silently dropped). No free-text entry.
  const canonLocations = (bundle?.locations ?? []).map((l) => l.name);
  const locationOptions = Array.from(
    new Set([...canonLocations, ...character.knownLocations]),
  );

  function toggleLocation(name: string) {
    setKnownLocations((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name],
    );
  }

  async function save() {
    setBusy(true);
    try {
      await onSave({
        ...character,
        traits: linesToList(traits),
        knownLocations,
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
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        Known locations (canon only)
        {locationOptions.length === 0 ? (
          <span className="rounded-md border border-input bg-background px-3 py-2">
            No locations in the bible yet.
          </span>
        ) : (
          <div className="flex flex-col gap-1 rounded-md border border-input bg-background px-3 py-2">
            {locationOptions.map((name) => (
              <label key={name} className="flex items-center gap-2 text-foreground">
                <input
                  type="checkbox"
                  checked={knownLocations.includes(name)}
                  onChange={() => toggleLocation(name)}
                />
                {name}
              </label>
            ))}
          </div>
        )}
      </div>
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
