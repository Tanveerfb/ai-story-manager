"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/layout/Button";
import type { StoryBible } from "@/types/story";

/**
 * Always-injected story bible, shown for author reference with an editable
 * annotations field (plan §6). Annotations are injected into every format call
 * and survive bible regeneration.
 */
async function getJson(url: string): Promise<StoryBible | null> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<StoryBible | null>;
}

export function StoryBiblePanel() {
  const { data, mutate } = useSWR<StoryBible | null>("/api/bible", getJson);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const annotationsRef = useRef<HTMLTextAreaElement>(null);

  async function save() {
    setBusy(true);
    try {
      await fetch("/api/bible", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotations: annotationsRef.current?.value ?? "" }),
      });
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-md border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <BookOpen className="size-4 text-accent" /> Story bible
        </span>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-border p-4">
          {data?.content ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
              {data.content}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generated automatically after you approve additions.
            </p>
          )}
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Your annotations (always given to the assistant)
            <textarea
              key={data?.updatedAt ?? "init"}
              ref={annotationsRef}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              defaultValue={data?.annotations ?? ""}
            />
          </label>
          <Button
            size="sm"
            variant="primary"
            loading={busy}
            onClick={save}
            className="sm:w-fit"
          >
            Save annotations
          </Button>
        </div>
      ) : null}
    </div>
  );
}
