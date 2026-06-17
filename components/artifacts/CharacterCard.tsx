"use client";

import { useState } from "react";
import { Lock, Pencil } from "lucide-react";
import { ArtifactEditor } from "@/components/artifacts/ArtifactEditor";
import type { Character } from "@/types/artifacts";

export function CharacterCard({
  character,
  onSave,
}: {
  character: Character;
  onSave: (next: Character) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{character.name}</h3>
          {character.authorOverride ? (
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent">
              <Lock className="size-3" /> Author-set
            </span>
          ) : null}
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Pencil className="size-3.5" /> Edit
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="mt-2 flex flex-col gap-2 text-sm">
          {character.traits.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {character.traits.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {character.relationships.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {character.relationships
                .map((r) => `${r.kind}: ${r.target}`)
                .join(" · ")}
            </p>
          ) : null}
          {character.notes ? (
            <p className="text-sm text-muted-foreground">{character.notes}</p>
          ) : null}
        </div>
      ) : (
        <ArtifactEditor
          character={character}
          onSave={async (next) => {
            await onSave(next);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
