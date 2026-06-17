"use client";

import { useState } from "react";
import Link from "next/link";
import { useEditorStore } from "@/store/useEditorStore";
import { useStoryStore } from "@/store/useStoryStore";
import { useAdjustmentLoop } from "@/hooks/useAdjustmentLoop";
import { RawInput } from "@/components/editor/RawInput";
import { ProseOutput } from "@/components/editor/ProseOutput";
import { DiffSummary } from "@/components/editor/DiffSummary";
import { AdjustmentToolbar } from "@/components/editor/AdjustmentToolbar";
import { ApprovalBar } from "@/components/editor/ApprovalBar";

/** Full-screen prose editor loop (plan §11/§13). */
export function EditorShell() {
  const approvalStatus = useEditorStore((s) => s.approvalStatus);
  const phase = useEditorStore((s) => s.phase);
  const error = useEditorStore((s) => s.error);
  const currentDraft = useEditorStore((s) => s.currentDraft);
  const adjustmentCount = useEditorStore((s) => s.adjustmentCount);

  const currentPart = useStoryStore((s) => s.currentPart);
  const currentChapter = useStoryStore((s) => s.currentChapter);

  const { format, adjust, approve, discard } = useAdjustmentLoop();
  const [adjusting, setAdjusting] = useState(false);
  const busy = phase === "formatting";

  if (!currentPart || !currentChapter) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
        <p>Select a chapter to write in.</p>
        <Link
          href="/story"
          className="text-primary underline underline-offset-4"
        >
          Go to Story
        </Link>
      </div>
    );
  }

  const reviewing = approvalStatus === "reviewing";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {currentPart} · {currentChapter}
        </span>
        <Link
          href="/story"
          className="text-xs text-primary underline-offset-4 hover:underline"
        >
          Story
        </Link>
      </header>

      {error ? (
        <div className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {reviewing ? (
        <>
          <ProseOutput prose={currentDraft} />
          <DiffSummary />
          <ApprovalBar
            onApprove={() => approve()}
            onAdjustToggle={() => setAdjusting((v) => !v)}
            onDiscard={() => {
              discard();
              setAdjusting(false);
            }}
            adjusting={adjusting}
            busy={busy}
          />
          {adjusting ? (
            <AdjustmentToolbar
              onAdjust={(instruction) => adjust(instruction)}
              disabled={busy}
              count={adjustmentCount}
            />
          ) : null}
        </>
      ) : (
        <RawInput onFormat={() => format()} busy={busy} />
      )}
    </div>
  );
}
