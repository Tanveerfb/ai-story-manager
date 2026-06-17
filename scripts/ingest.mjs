/**
 * Ingest a markdown chronicle into the running app as a real story: one Part,
 * one chapter per "### " heading, one addition per prose paragraph. Embeds every
 * addition, and runs artifact extraction on the first paragraph of each chapter
 * (extraction is the slow stage — a sample keeps it minutes, not an hour).
 *
 * Usage: node scripts/ingest.mjs <file.md>   (dev server must be running)
 */

import http from "node:http";
import { readFileSync } from "node:fs";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const LLM = process.env.AUDIT_LLM ?? "http://localhost:1234/v1";
const GEN = process.env.AUDIT_GEN ?? "gemma-4-e4b-uncensored-hauhaucs-aggressive";
const EMBED = process.env.AUDIT_EMBED ?? "text-embedding-nomic-embed-text-v1.5";
const FILE = process.argv[2];

function api(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = http.request(
      `${BASE}${path}`,
      { method, headers: { "Content-Type": "application/json", ...(data ? { "Content-Length": data.length } : {}) } },
      (res) => {
        let buf = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          let json; try { json = JSON.parse(buf); } catch { json = null; }
          resolve({ status: res.statusCode, json });
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

/** Parse markdown into [{ title, paragraphs[] }] — skip code fences, rules, sub-headings. */
function parseChapters(md) {
  const lines = md.split(/\r?\n/);
  const chapters = [];
  let cur = null;
  let para = [];
  let inFence = false;
  const flushPara = () => {
    if (para.length && cur) cur.paragraphs.push(para.join(" ").trim());
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("```")) { flushPara(); inFence = !inFence; continue; }
    if (inFence) continue;
    if (line.startsWith("### ")) {
      flushPara();
      const heading = line.slice(4).trim();
      const title = heading.includes(": ") ? heading.split(": ").slice(1).join(": ") : heading;
      cur = { title, paragraphs: [] };
      chapters.push(cur);
      continue;
    }
    if (line.startsWith("#")) { flushPara(); continue; }      // H1/H2 — ignore
    if (line === "---" || line === "") { flushPara(); continue; }
    // strip blockquote / emphasis markers, keep the prose
    const clean = line.replace(/^>\s?/, "").replace(/^\*|\*$/g, "").trim();
    if (clean) para.push(clean);
  }
  flushPara();
  return chapters.filter((c) => c.paragraphs.length > 0);
}

async function main() {
  if (!FILE) { console.error("usage: node scripts/ingest.mjs <file.md>"); process.exit(2); }
  const chapters = parseChapters(readFileSync(FILE, "utf8"));
  const totalParas = chapters.reduce((n, c) => n + c.paragraphs.length, 0);
  console.log(`Parsed ${chapters.length} chapters, ${totalParas} paragraphs.`);

  const part = (await api("/api/story", "POST", { action: "createPart", title: "Android & Cell Saga" })).json;
  console.log(`Part: ${part.slug}`);

  let embedded = 0, extracted = 0, extractFails = 0;
  const t0 = Date.now();

  for (const ch of chapters) {
    const chap = (await api("/api/story", "POST", { action: "createChapter", part: part.slug, title: ch.title })).json;
    process.stdout.write(`\n[${chap.slug}] ${ch.title}: `);
    let first = true;
    for (const text of ch.paragraphs) {
      const add = (await api("/api/story", "POST", { action: "createAddition", part: part.slug, chapter: chap.slug, content: text })).json;
      const chunkRef = `${part.slug}/${chap.slug}/additions/${add.ref.addition}`;
      const emb = await api("/api/llm/embed", "POST", {
        baseUrl: LLM, model: EMBED, text, chunkRef, additionNumber: add.number,
        metadata: { part: part.slug, chapter: chap.slug, characters: [], location: null },
      });
      if (emb.status === 201) { embedded++; process.stdout.write("e"); } else process.stdout.write("E");

      if (first) {
        // Sample extraction: first paragraph of each chapter.
        const ext = await api("/api/llm/extract", "POST", {
          baseUrl: LLM, generationModel: GEN, part: part.slug, chapter: chap.slug,
          additionNumber: add.number, text,
        });
        if (ext.status === 200) { extracted++; process.stdout.write("x"); } else { extractFails++; process.stdout.write("X"); }
        first = false;
      }
    }
  }

  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n\nDONE in ${mins} min — embedded ${embedded}/${totalParas}, extracted ${extracted} chapters (${extractFails} fail).`);

  const arts = (await api("/api/artifacts", "GET")).json;
  console.log("Characters:", (arts.characters ?? []).map((c) => c.name).join(", "));
  console.log("Locations: ", (arts.locations ?? []).map((l) => l.name).join(", "));
  console.log("Timeline events:", arts.timeline?.length, " Lore:", (arts.lore ?? []).map((l) => l.term).join(", "));
}

main().catch((e) => { console.error("\nINGEST CRASHED:", e); process.exit(1); });
