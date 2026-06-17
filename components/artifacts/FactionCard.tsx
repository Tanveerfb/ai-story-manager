import type { Faction } from "@/types/artifacts";

export function FactionCard({ faction }: { faction: Faction }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="font-medium">{faction.name}</h3>
      {faction.description ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {faction.description}
        </p>
      ) : null}
      {faction.members.length > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Members: {faction.members.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
