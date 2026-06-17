import type { LoreEntry as LoreEntryType } from "@/types/artifacts";

export function LoreEntry({ entry }: { entry: LoreEntryType }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="font-medium">{entry.term}</h3>
      {entry.definition ? (
        <p className="mt-1 text-sm text-muted-foreground">{entry.definition}</p>
      ) : null}
    </div>
  );
}
