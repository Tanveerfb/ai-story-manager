"use client";

import { useProcessingQueue } from "@/hooks/useProcessingQueue";

/** Headless component that drives the background queue. Mount once in layout. */
export function QueueProcessor() {
  useProcessingQueue();
  return null;
}
