"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, FolderPlus, PenLine, Plus } from "lucide-react";
import { Button } from "@/components/layout/Button";
import { useStoryFS } from "@/hooks/useStoryFS";
import { useStoryStore } from "@/store/useStoryStore";
import { useQueueStore } from "@/store/useQueueStore";
import type { PartNode } from "@/types/story";
import { cn } from "@/lib/utils";

/** Inline single-field creator used for new parts and chapters. */
function QuickAdd({
  label,
  placeholder,
  onAdd,
}: {
  label: string;
  placeholder: string;
  onAdd: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onAdd(value);
      setValue("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        className="h-9 w-full min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !busy) submit();
        }}
        aria-label={label}
      />
      <Button size="sm" variant="primary" loading={busy} onClick={submit} className="shrink-0">
        <Plus className="size-4" /> Add
      </Button>
    </div>
  );
}

function ChapterColumn({ part }: { part: PartNode }) {
  const { createChapter, createAddition } = useStoryFS();
  const { currentChapter, selectChapter } = useStoryStore();
  const enqueueEmbed = useQueueStore((s) => s.enqueueEmbed);
  const enqueueExtract = useQueueStore((s) => s.enqueueExtract);
  const active = part.chapters.find((c) => c.slug === currentChapter);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">
        {part.title} · Chapters
      </h2>
      {part.chapters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chapters yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {part.chapters.map((chapter) => (
            <li key={chapter.slug}>
              <button
                onClick={() => selectChapter(part.slug, chapter.slug)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  currentChapter === chapter.slug && "bg-muted font-medium",
                )}
              >
                <span>{chapter.title}</span>
                <span className="text-xs text-muted-foreground">
                  {chapter.additions.length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <QuickAdd
        label="New chapter title"
        placeholder="New chapter title (optional)"
        onAdd={async (title) => {
          await createChapter(part.slug, title || undefined);
        }}
      />

      {active ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {active.title} · Additions
            </h3>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
            >
              <PenLine className="size-3.5" /> Write here
            </Link>
          </div>
          {active.additions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No additions yet. The editor (coming in a later batch) writes here.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {active.additions.map((addition) => (
                <li
                  key={addition.number}
                  className="rounded-md border border-border bg-card p-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="size-3.5" />
                    Addition {String(addition.number).padStart(3, "0")}
                  </div>
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm">
                    {addition.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {/* Temporary author tool until the Batch 4 prose editor lands. */}
          <QuickAdd
            label="New addition text"
            placeholder="Paste approved prose to save as an addition"
            onAdd={async (content) => {
              const text = content.trim();
              if (!text) return;
              const addition = await createAddition(part.slug, active.slug, text);
              // On approval, push an embed job (plan §10). Extract follows in Batch 5.
              const chunkRef = `${part.slug}/${active.slug}/additions/${addition.ref.addition}`;
              const payload = {
                text,
                additionNumber: addition.number,
                part: part.slug,
                chapter: active.slug,
                characters: [],
                location: null,
              };
              enqueueEmbed(chunkRef, payload);
              enqueueExtract(chunkRef, payload);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function StoryNavigator() {
  const { tree, error, isLoading, createPart } = useStoryFS();
  const { currentPart, selectPart } = useStoryStore();

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" />;
  }
  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
        Could not load story data: {error.message}
      </div>
    );
  }

  const parts = tree?.parts ?? [];
  const activePart = parts.find((p) => p.slug === currentPart);

  return (
    <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Parts</h2>
        {parts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No parts yet. Create your first part to begin.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {parts.map((part) => (
              <li key={part.slug}>
                <button
                  onClick={() => selectPart(part.slug)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                    currentPart === part.slug && "bg-muted font-medium",
                  )}
                >
                  <span>{part.title}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <QuickAdd
          label="New part title"
          placeholder="New part title (optional)"
          onAdd={async (title) => {
            const part = await createPart(title || undefined);
            selectPart(part.slug);
          }}
        />
      </div>

      <div>
        {activePart ? (
          <ChapterColumn part={activePart} />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground">
            <FolderPlus className="size-6" />
            Select a part to see its chapters.
          </div>
        )}
      </div>
    </div>
  );
}
