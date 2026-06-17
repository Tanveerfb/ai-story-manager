"use client";

import { Button } from "@/components/layout/Button";

/** Approve / Adjust / Discard controls for a reviewed draft (plan §11). */
export function ApprovalBar({
  onApprove,
  onAdjustToggle,
  onDiscard,
  adjusting,
  busy,
}: {
  onApprove: () => void;
  onAdjustToggle: () => void;
  onDiscard: () => void;
  adjusting: boolean;
  busy: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="success" onClick={onApprove} disabled={busy}>
        Approve
      </Button>
      <Button
        variant="secondary"
        outline
        onClick={onAdjustToggle}
        disabled={busy}
      >
        {adjusting ? "Hide adjust" : "Adjust"}
      </Button>
      <Button variant="danger" outline onClick={onDiscard} disabled={busy}>
        Discard
      </Button>
    </div>
  );
}
