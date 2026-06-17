export type JobType = "embed" | "extract";

export type JobStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "failed_final";

/** Everything an embed job needs to run without re-reading the filesystem. */
export type EmbedJobPayload = {
  text: string;
  additionNumber: number;
  part: string;
  chapter: string;
  characters: string[];
  location: string | null;
};

/** A unit of background work tied to a single approved addition (plan §12). */
export type Job = {
  id: string;
  type: JobType;
  status: JobStatus;
  /** Path-style addition reference this job operates on. */
  additionRef: string;
  /** Number of times this job has been attempted (auto-retry once). */
  attempts: number;
  error: string | null;
  payload?: EmbedJobPayload;
};
