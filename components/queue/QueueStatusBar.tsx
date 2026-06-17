"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useQueueStore } from "@/store/useQueueStore";

/**
 * Subtle persistent background-processing indicator (plan §12). Hidden when
 * idle; shows a spinner while syncing and an amber, manually-retriable warning
 * for jobs that failed after auto-retry.
 */
export function QueueStatusBar() {
  const jobs = useQueueStore((s) => s.jobs);
  const retry = useQueueStore((s) => s.retry);

  const active = jobs.filter(
    (j) => j.status === "pending" || j.status === "running",
  ).length;
  const failed = jobs.filter((j) => j.status === "failed_final");

  if (active === 0 && failed.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {active > 0 ? (
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Syncing… {active}
        </div>
      ) : null}

      {failed.length > 0 ? (
        <div className="flex items-center gap-2 rounded-full border border-warning/40 bg-card px-3 py-1.5 text-xs text-warning shadow-sm">
          <AlertTriangle className="size-3.5" aria-hidden />
          {failed.length} failed
          <button
            onClick={() => failed.forEach((j) => retry(j.id))}
            className="ml-1 font-medium underline underline-offset-2 hover:opacity-80"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
