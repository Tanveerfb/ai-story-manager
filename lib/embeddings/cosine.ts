/**
 * Cosine similarity for semantic search over the local embedding index.
 * No external vector DB is needed for a single-story v1 (plan §10).
 */

/** Dot product of two equal-length vectors. */
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

/**
 * Cosine similarity in [-1, 1]. Returns 0 when either vector is zero-length or
 * the dimensions do not match (defensive — never throws during search).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}
