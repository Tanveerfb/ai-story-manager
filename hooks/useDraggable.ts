"use client";

import { useCallback, useRef, useState } from "react";
import type { FloatingPosition } from "@/types/ui";

const DRAG_THRESHOLD = 4; // px of movement before a press counts as a drag, not a click
const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

type Options = {
  /** Committed once per drag (on release) — keep store writes off the move path. */
  onCommit: (position: FloatingPosition) => void;
  /** Fired on a press that did not move past the threshold. */
  onClick: () => void;
  /** Element size, used to keep the handle inside the viewport. */
  size?: number;
};

/**
 * Pointer-drag for a fixed-position floating handle. Tracks live position
 * locally during the drag and distinguishes a click from a drag by movement
 * threshold, so the same control can be moved or tapped-to-activate.
 */
export function useDraggable(
  initial: FloatingPosition,
  { onCommit, onClick, size = 44 }: Options,
) {
  const [pos, setPos] = useState<FloatingPosition>(initial);
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const moved = useRef(false);
  const origin = useRef({ px: 0, py: 0, x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      moved.current = false;
      origin.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
    },
    [pos.x, pos.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - origin.current.px;
    const dy = e.clientY - origin.current.py;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      moved.current = true;
    }
    setPos({
      x: clamp(origin.current.x + dx, 0, window.innerWidth - size),
      y: clamp(origin.current.y + dy, 0, window.innerHeight - size),
    });
  }, [size]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      setIsDragging(false);
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      if (moved.current) onCommit(pos);
      else onClick();
    },
    [pos, onCommit, onClick],
  );

  return {
    position: pos,
    isDragging,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}
