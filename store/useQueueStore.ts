import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EmbedJobPayload, Job, JobStatus } from "@/types/queue";

/**
 * Background processing queue (plan §12). Persisted so jobs survive a refresh
 * and are never silently dropped. Failure policy: auto-retry once (back to
 * pending), then flag as failed_final for manual retry.
 */
type QueueStore = {
  jobs: Job[];
  enqueueEmbed: (additionRef: string, payload: EmbedJobPayload) => void;
  enqueueExtract: (additionRef: string, payload: EmbedJobPayload) => void;
  setStatus: (id: string, status: JobStatus, error?: string | null) => void;
  markFailed: (id: string, error: string) => void;
  retry: (id: string) => void;
  clearFinished: () => void;
};

function uid(): string {
  return crypto.randomUUID();
}

export const useQueueStore = create<QueueStore>()(
  persist(
    (set) => ({
      jobs: [],

      enqueueEmbed: (additionRef, payload) =>
        set((state) => ({
          jobs: [
            ...state.jobs,
            {
              id: uid(),
              type: "embed",
              status: "pending",
              additionRef,
              attempts: 0,
              error: null,
              payload,
            },
          ],
        })),

      // Enqueued after embed so embed runs first for the same addition (§12).
      enqueueExtract: (additionRef, payload) =>
        set((state) => ({
          jobs: [
            ...state.jobs,
            {
              id: uid(),
              type: "extract",
              status: "pending",
              additionRef,
              attempts: 0,
              error: null,
              payload,
            },
          ],
        })),

      setStatus: (id, status, error = null) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, status, error } : job,
          ),
        })),

      markFailed: (id, error) =>
        set((state) => ({
          jobs: state.jobs.map((job) => {
            if (job.id !== id) return job;
            const attempts = job.attempts + 1;
            // First failure: auto-retry (back to pending). Second: give up.
            return {
              ...job,
              attempts,
              error,
              status: attempts >= 2 ? "failed_final" : "pending",
            };
          }),
        })),

      retry: (id) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id
              ? { ...job, status: "pending", attempts: 0, error: null }
              : job,
          ),
        })),

      clearFinished: () =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.status !== "done"),
        })),
    }),
    { name: "asm-queue" },
  ),
);
