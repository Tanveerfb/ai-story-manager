"use client";

import { useState } from "react";
import { Button } from "@/components/layout/Button";
import { useSimulationStore } from "@/store/useSimulationStore";
import {
  useSimulationSession,
  type PreparedScene,
} from "@/hooks/useSimulationSession";
import { useStoryFS } from "@/hooks/useStoryFS";

/** End-of-session review: cherry-pick exchanges, format a scene, insert it. */
export function SessionReview() {
  const messages = useSimulationStore((s) => s.messages);
  const selectedIds = useSimulationStore((s) => s.selectedIds);
  const toggleSelect = useSimulationStore((s) => s.toggleSelect);
  const reset = useSimulationStore((s) => s.reset);
  const { prepareScene, saveScene } = useSimulationSession();
  const { tree } = useStoryFS();

  const [prepared, setPrepared] = useState<PreparedScene | null>(null);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chapterOptions = (tree?.parts ?? []).flatMap((p) =>
    p.chapters.map((c) => ({
      value: `${p.slug}|${c.slug}`,
      label: `${p.title} › ${c.title}`,
    })),
  );

  async function prepare() {
    setBusy(true);
    setError(null);
    try {
      const result = await prepareScene();
      setPrepared(result);
      setTarget(`${result.part}|${result.chapter}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to prepare scene");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!prepared || !target) return;
    const [part, chapter] = target.split("|");
    setBusy(true);
    try {
      await saveScene(part, chapter, prepared.prose);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Review — pick the exchanges to keep
        </h2>
        <Button size="sm" variant="danger" outline onClick={reset}>
          Discard
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {messages.map((m) => (
          <label
            key={m.id}
            className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-card p-2 text-sm"
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={selectedIds.includes(m.id)}
              onChange={() => toggleSelect(m.id)}
            />
            <span>
              <span className="text-xs text-muted-foreground">{m.speaker}: </span>
              {m.content}
            </span>
          </label>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {!prepared ? (
        <Button
          variant="primary"
          loading={busy}
          disabled={selectedIds.length === 0}
          onClick={prepare}
          className="sm:w-fit"
        >
          Prepare scene
        </Button>
      ) : (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {prepared.reasoning ? (
            <p className="text-xs text-muted-foreground">
              Suggested placement: {prepared.reasoning}
            </p>
          ) : null}
          <article className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-card p-4 text-sm leading-relaxed">
            {prepared.prose}
          </article>
          <label className="flex flex-col gap-1 text-sm">
            Insert into
            <select
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              {chapterOptions.length === 0 ? (
                <option value="">No chapters — create one first</option>
              ) : (
                chapterOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="flex gap-2">
            <Button
              variant="success"
              loading={busy}
              disabled={!target}
              onClick={save}
            >
              Save to story
            </Button>
            <Button
              variant="secondary"
              outline
              onClick={() => setPrepared(null)}
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
