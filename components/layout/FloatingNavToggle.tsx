"use client";

import { Eye } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useDraggable } from "@/hooks/useDraggable";
import { cn } from "@/lib/utils";

/**
 * Shown only when the navbar is hidden: a draggable round handle that reveals
 * the navbar on click. Drag to reposition anywhere; a click (no drag) restores
 * the bar. Rendered globally alongside the navbar.
 */
export function FloatingNavToggle() {
  const navbarHidden = useUIStore((s) => s.navbarHidden);
  const togglePosition = useUIStore((s) => s.togglePosition);
  const setNavbarHidden = useUIStore((s) => s.setNavbarHidden);
  const setTogglePosition = useUIStore((s) => s.setTogglePosition);

  const { position, isDragging, handlers } = useDraggable(togglePosition, {
    onCommit: setTogglePosition,
    onClick: () => setNavbarHidden(false),
  });

  if (!navbarHidden) return null;

  return (
    <button
      {...handlers}
      // Dynamic viewport coordinates can't be expressed as Tailwind utilities.
      style={{ left: position.x, top: position.y }}
      className={cn(
        "fixed z-50 flex size-11 touch-none items-center justify-center rounded-full",
        "bg-primary text-primary-foreground shadow-lg ring-1 ring-black/10",
        "transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging ? "cursor-grabbing scale-105" : "cursor-grab",
      )}
      aria-label="Show navigation"
      title="Show navigation (drag to move)"
    >
      <Eye className="size-5" aria-hidden />
    </button>
  );
}
