import type { TimelineEvent } from "@/types/artifacts";

export function TimelineEntry({ event }: { event: TimelineEvent }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-sm">{event.summary}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {event.ref.part} · {event.ref.chapter} · #{event.ref.addition}
        {event.location ? ` · ${event.location}` : ""}
      </p>
    </div>
  );
}
