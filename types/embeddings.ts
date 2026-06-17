/** One vector entry in story-data/embeddings/index.json. */
export type EmbeddingEntry = {
  id: string;
  /** Path-style reference, e.g. "part-01/ch-03/additions/007". */
  chunkRef: string;
  additionNumber: number;
  vector: number[];
  metadata: {
    part: string;
    chapter: string;
    characters: string[];
    location: string | null;
  };
};

/** Result of a top-K semantic search — references, never raw vectors. */
export type SearchResult = {
  chunkRef: string;
  additionNumber: number;
  score: number;
  metadata: EmbeddingEntry["metadata"];
};
