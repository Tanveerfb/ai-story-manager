"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useArtifactSync } from "@/hooks/useArtifactSync";
import { SyncStatusBadge } from "@/components/artifacts/SyncStatusBadge";
import { CharacterCard } from "@/components/artifacts/CharacterCard";
import { LocationCard } from "@/components/artifacts/LocationCard";
import { FactionCard } from "@/components/artifacts/FactionCard";
import { LoreEntry } from "@/components/artifacts/LoreEntry";
import { TimelineEntry } from "@/components/artifacts/TimelineEntry";

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">
        {title} ({count})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ArtifactDashboard() {
  const { bundle, error, isLoading, saveCharacter } = useArtifactSync();
  const [notice, setNotice] = useState(false);
  const lastSeen = useRef<number | null>(null);

  // Non-blocking "artifacts updated — review?" nudge when a sync advances.
  useEffect(() => {
    const synced = bundle?.lastSyncedAddition ?? null;
    if (synced !== null && lastSeen.current !== null && synced > lastSeen.current) {
      setNotice(true);
    }
    if (synced !== null) lastSeen.current = synced;
  }, [bundle?.lastSyncedAddition]);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" />;
  }
  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
        Could not load artifacts: {error.message}
      </div>
    );
  }

  const b = bundle;
  const total =
    (b?.characters.length ?? 0) +
    (b?.locations.length ?? 0) +
    (b?.timeline.length ?? 0) +
    (b?.factions.length ?? 0) +
    (b?.lore.length ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SyncStatusBadge lastSyncedAddition={b?.lastSyncedAddition ?? null} />
      </div>

      {notice ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-info/40 bg-card px-3 py-2 text-sm text-info">
          <span>Artifacts updated — review below.</span>
          <button onClick={() => setNotice(false)} aria-label="Dismiss">
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          No artifacts yet. They are extracted automatically as you approve
          additions in the editor.
        </p>
      ) : null}

      <Section title="Characters" count={b?.characters.length ?? 0}>
        {b?.characters.map((c) => (
          <CharacterCard key={c.slug} character={c} onSave={saveCharacter} />
        ))}
      </Section>

      <Section title="Locations" count={b?.locations.length ?? 0}>
        {b?.locations.map((l) => <LocationCard key={l.slug} location={l} />)}
      </Section>

      <Section title="Factions" count={b?.factions.length ?? 0}>
        {b?.factions.map((f) => <FactionCard key={f.slug} faction={f} />)}
      </Section>

      <Section title="Lore" count={b?.lore.length ?? 0}>
        {b?.lore.map((e) => <LoreEntry key={e.slug} entry={e} />)}
      </Section>

      <Section title="Timeline" count={b?.timeline.length ?? 0}>
        {b?.timeline.map((e) => <TimelineEntry key={e.id} event={e} />)}
      </Section>
    </div>
  );
}
