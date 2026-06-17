"use client";

import { useState } from "react";
import { Button } from "@/components/layout/Button";
import { ADJUSTMENT_SOFT_CAP } from "@/lib/constants";

/**
 * Quick adjustment chips + custom instruction (plan §11/§13). Every instruction
 * is phrased so the formatter still adds nothing — it only restyles existing text.
 */
const QUICK_ACTIONS: { label: string; instruction: string }[] = [
  {
    label: "Shorter",
    instruction:
      "Make it more concise. Do not remove any event or detail the author included.",
  },
  {
    label: "Longer",
    instruction:
      "Use fuller sentences and smoother phrasing where the text was terse. Add no new information.",
  },
  {
    label: "Less flowery",
    instruction: "Use plainer, less ornate language. Do not add or remove content.",
  },
  {
    label: "More formal",
    instruction:
      "Use a more formal register. Do not change the meaning or add content.",
  },
  {
    label: "Fix punctuation only",
    instruction: "Only fix punctuation. Make no other changes.",
  },
];

export function AdjustmentToolbar({
  onAdjust,
  disabled,
  count,
}: {
  onAdjust: (instruction: string) => void;
  disabled: boolean;
  count: number;
}) {
  const [custom, setCustom] = useState("");

  function sendCustom() {
    if (!custom.trim()) return;
    onAdjust(custom);
    setCustom("");
  }

  return (
    <div className="flex flex-col gap-2">
      {count >= ADJUSTMENT_SOFT_CAP ? (
        <p className="text-xs text-warning">
          You&apos;ve adjusted {count} times — consider approving or discarding.
        </p>
      ) : null}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant="secondary"
            outline
            disabled={disabled}
            onClick={() => onAdjust(action.instruction)}
            className="shrink-0"
          >
            {action.label}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="h-9 flex-1 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={custom}
          placeholder="Or describe a specific change…"
          disabled={disabled}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled) sendCustom();
          }}
          aria-label="Custom adjustment"
        />
        <Button
          size="sm"
          variant="primary"
          disabled={disabled || !custom.trim()}
          onClick={sendCustom}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
