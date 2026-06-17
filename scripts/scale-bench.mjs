/**
 * Scaling benchmark for the embedding index. Reproduces exactly what every
 * search/format/fanboy/simulate call pays server-side: read index.jsonl ->
 * parse lines -> dedup by chunkRef -> cosine top-K over ALL vectors. The only
 * thing it omits is the constant ~0.2s query-embedding round-trip.
 *
 * Synthetic random vectors (cosine cost is value-independent), 768-dim to match
 * nomic-embed-text-v1.5. Reports parse + scan time and file size per N.
 */

import { writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";

const DIM = 768;
const SIZES = [100, 500, 1000, 2000, 5000];
const ITERS = 5;
const TMP = "E:/Projects/ai-story-manager/.scale-bench";

function randVec() {
  const v = new Array(DIM);
  for (let i = 0; i < DIM; i++) v[i] = Math.random() * 2 - 1;
  return v;
}

// Mirror of lib/embeddings/cosine.ts
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

// Mirror of readIndex() dedup + topK()
function readAndSearch(file, query) {
  const text = readFileSync(file, "utf8");
  const entries = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t) { try { entries.push(JSON.parse(t)); } catch {} }
  }
  const byRef = new Map();
  for (const e of entries) byRef.set(e.chunkRef, e);
  const deduped = Array.from(byRef.values());
  return deduped
    .map((e) => ({ chunkRef: e.chunkRef, score: cosine(query, e.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

mkdirSync(TMP, { recursive: true });
console.log(`N\tfile(MB)\tmedian per-call (ms)`);
for (const N of SIZES) {
  const file = `${TMP}/index-${N}.jsonl`;
  let out = "";
  for (let i = 0; i < N; i++) {
    out += JSON.stringify({
      id: `id-${i}`, chunkRef: `part-01/ch-01/additions/${String(i).padStart(3, "0")}`,
      additionNumber: i, vector: randVec(),
      metadata: { part: "part-01", chapter: "ch-01", characters: [], location: null },
    }) + "\n";
  }
  writeFileSync(file, out);
  const sizeMB = (Buffer.byteLength(out) / 1048576).toFixed(2);

  const q = randVec();
  readAndSearch(file, q); // warm
  const times = [];
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    readAndSearch(file, q);
    times.push(performance.now() - t);
  }
  console.log(`${N}\t${sizeMB}\t\t${median(times).toFixed(1)}`);
}
rmSync(TMP, { recursive: true, force: true });
console.log("\n(Plus a constant ~0.2s to embed the query — not included above.)");
