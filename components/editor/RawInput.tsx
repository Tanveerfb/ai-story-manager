"use client";

import { Button } from "@/components/layout/Button";
import { useEditorStore } from "@/store/useEditorStore";

/** Author's raw prompt input — the only thing the author writes (plan §11). */
export function RawInput({
  onFormat,
  busy,
}: {
  onFormat: () => void;
  busy: boolean;
}) {
  const rawInput = useEditorStore((s) => s.rawInput);
  const setRawInput = useEditorStore((s) => s.setRawInput);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <textarea
        className="flex-1 resize-none rounded-md border border-input bg-card p-4 text-base leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="Write what happens, in your own words. The assistant only formats it into prose — it never adds anything."
        aria-label="Raw prompt"
      />
      <Button
        variant="primary"
        loading={busy}
        disabled={!rawInput.trim()}
        onClick={onFormat}
        className="sm:w-fit"
      >
        Format
      </Button>
    </div>
  );
}
