"use client";

import { X } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";

/**
 * Plain-language "what changed" line (plan §11). Non-blocking and dismissible;
 * a single line on mobile — never a side-by-side diff.
 */
export function DiffSummary() {
  const summary = useEditorStore((s) => s.diffSummary);
  const dismiss = useEditorStore((s) => s.dismissDiff);
  if (!summary) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
      <span>{summary}</span>
      <button onClick={dismiss} aria-label="Dismiss summary" className="shrink-0">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
