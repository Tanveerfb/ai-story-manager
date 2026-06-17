/**
 * DBZ Android/Cell arc audit run. Drives the live app against the configured
 * local LLM to generate and manage a real multi-scene story, then LEAVES the
 * data in place (story-data/) so it can be inspected in the app.
 *
 * Run with the dev server up (pointed at the default story-data dir).
 */

import http from "node:http";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const LLM = process.env.AUDIT_LLM ?? "http://localhost:1234/v1";
const GEN = process.env.AUDIT_GEN ?? "qwen3.5-9b-uncensored-hauhaucs-aggressive";
const EMBED = process.env.AUDIT_EMBED ?? "text-embedding-nomic-embed-text-v1.5";

let pass = 0;
let fail = 0;
const results = [];
const ok = (n, d = "") => { pass++; const s = `PASS  ${n}${d ? ` — ${d}` : ""}`; results.push(s); console.log(s); };
const bad = (n, d = "") => { fail++; const s = `FAIL  ${n}${d ? ` — ${d}` : ""}`; results.push(s); console.log(s); };
const section = (t) => console.log(`\n=== ${t} ===`);

// Raw node:http (no undici headers-timeout) so slow local-model calls don't abort.
function api(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = http.request(
      `${BASE}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(data ? { "Content-Length": data.length } : {}),
        },
      },
      (res) => {
        let buf = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          let json;
          try { json = JSON.parse(buf); } catch { json = null; }
          resolve({ status: res.statusCode, json });
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// Terse author drafts — canon Cell-arc beats. The formatter must fix grammar/
// flow ONLY and invent nothing; extraction must pull characters/locations/etc.
const SCENES = [
  {
    chapter: "Awakening",
    raw: "dr gero activate android 17 and 18 in his lab. they dont obey. 17 kill gero. 18 wake android 16 too. they decide to go find goku for fun.",
  },
  {
    chapter: "The Hunter",
    raw: "a monster from the future appear. its name cell. he absorb a whole town of people to grow stronger. he need to absorb 17 and 18 to reach his perfect form.",
  },
  {
    chapter: "Semi-Perfect",
    raw: "piccolo fight 17 near the islands. cell arrive. piccolo warn 17 to run. cell grab 17 with his tail and absorb him. cell transform into semi perfect form.",
  },
  {
    chapter: "Perfection",
    raw: "cell corner 18 on the island. krillin try to stop cell but cant. cell absorb 18. cell become perfect. he announce a tournament called the cell games in ten days.",
  },
];

async function main() {
  section("health");
  {
    const r = await api("/api/llm/health", "POST", { provider: "lmstudio", baseUrl: LLM });
    if (r.status === 200 && r.json?.ok && (r.json.models ?? []).includes(GEN)) ok("health", `gen '${GEN}' present`);
    else { bad("health", JSON.stringify(r.json).slice(0, 200)); return; }
  }

  section("story scaffold");
  const part = (await api("/api/story", "POST", { action: "createPart", title: "The Android Saga" })).json;
  if (!part?.slug) return bad("createPart", JSON.stringify(part));
  ok("createPart", part.slug);

  let n = 0;
  for (const scene of SCENES) {
    n++;
    const chap = (await api("/api/story", "POST", { action: "createChapter", part: part.slug, title: scene.chapter })).json;
    if (!chap?.slug) { bad(`createChapter ${n}`, JSON.stringify(chap)); continue; }

    section(`scene ${n} (${scene.chapter}): format`);
    const fmt = await api("/api/llm/format", "POST", {
      baseUrl: LLM, generationModel: GEN, embeddingModel: EMBED,
      part: part.slug, chapter: chap.slug, rawInput: scene.raw, adjustments: [],
    });
    if (fmt.status !== 200 || !fmt.json?.prose) { bad(`format ${n}`, JSON.stringify(fmt.json).slice(0, 200)); continue; }
    const prose = fmt.json.prose;
    console.log("RAW  :", scene.raw);
    console.log("PROSE:", prose);
    console.log("DIFF :", fmt.json.summary);
    if (/<think|<\/think|^think[:>]/im.test(prose)) bad(`format ${n} no-think`, "reasoning leaked into prose");
    const ratio = prose.split(/\s+/).length / scene.raw.split(/\s+/).length;
    if (ratio > 2.2) bad(`format ${n} faithfulness`, `word ratio ${ratio.toFixed(2)} — inspect for invention`);
    else ok(`format ${n}`, `word ratio ${ratio.toFixed(2)}`);

    const add = await api("/api/story", "POST", { action: "createAddition", part: part.slug, chapter: chap.slug, content: prose });
    if (add.status !== 201) { bad(`createAddition ${n}`, JSON.stringify(add.json)); continue; }
    ok(`createAddition ${n}`, `addition ${add.json.number}`);

    section(`scene ${n}: embed`);
    const emb = await api("/api/llm/embed", "POST", {
      baseUrl: LLM, model: EMBED, text: prose,
      chunkRef: `${part.slug}/${chap.slug}/${add.json.number}`,
      additionNumber: add.json.number,
      metadata: { part: part.slug, chapter: chap.slug, characters: [], location: null },
    });
    if (emb.status !== 201) bad(`embed ${n}`, JSON.stringify(emb.json)); else ok(`embed ${n}`);

    section(`scene ${n}: extract`);
    const t0 = Date.now();
    const ext = await api("/api/llm/extract", "POST", {
      baseUrl: LLM, generationModel: GEN, part: part.slug, chapter: chap.slug,
      additionNumber: add.json.number, text: prose,
    });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (ext.status !== 200) bad(`extract ${n}`, `${secs}s ${JSON.stringify(ext.json).slice(0, 300)}`);
    else { console.log("EXTRACT:", JSON.stringify(ext.json)); ok(`extract ${n}`, `${secs}s failed=[${(ext.json.failed ?? []).join(",")}]`); }
  }

  section("search");
  {
    const r = await api("/api/llm/search", "POST", { baseUrl: LLM, model: EMBED, query: "Who did Cell absorb to become perfect?", topK: 5 });
    if (r.status === 200 && (r.json?.results?.length ?? 0) > 0) {
      console.log("SEARCH:", JSON.stringify(r.json.results.map((x) => ({ ref: x.chunkRef, score: x.score?.toFixed?.(3) }))));
      ok("search", `top=${r.json.results[0].chunkRef}`);
    } else bad("search", JSON.stringify(r.json).slice(0, 200));
  }

  section("artifacts");
  {
    const r = await api("/api/artifacts", "GET");
    const a = r.json;
    if (r.status === 200 && a) {
      console.log("ARTIFACTS:", JSON.stringify({
        characters: a.characters?.map((c) => c.name),
        locations: a.locations?.map((l) => l.name),
        factions: a.factions?.map((f) => f.name),
        lore: a.lore?.map((l) => l.term),
        timeline: a.timeline?.length,
      }, null, 0));
      if ((a.characters?.length ?? 0) > 0) ok("artifacts", `${a.characters.length} chars, ${a.locations?.length ?? 0} locs`);
      else bad("artifacts", "no characters");
    } else bad("artifacts", JSON.stringify(r.json).slice(0, 200));
  }

  section("bible");
  {
    const b = await api("/api/bible", "GET");
    if (b.status === 200 && b.json?.content) { console.log("BIBLE:\n" + b.json.content); ok("bible"); }
    else bad("bible", JSON.stringify(b.json).slice(0, 200));
  }

  section("fanboy");
  {
    const r = await api("/api/llm/fanboy", "POST", {
      baseUrl: LLM, generationModel: GEN, embeddingModel: EMBED,
      messages: [{ role: "user", content: "What did you think of Cell absorbing 17?" }],
    });
    if (r.status === 200 && r.json?.reply) { console.log("FAN persona:", r.json.personality); console.log("FAN reply:", r.json.reply); ok("fanboy"); }
    else bad("fanboy", JSON.stringify(r.json).slice(0, 200));
  }

  section("simulation: reply");
  {
    const r = await api("/api/llm/simulate", "POST", {
      action: "reply", baseUrl: LLM, generationModel: GEN, embeddingModel: EMBED,
      simulatedCharacters: ["Cell"], userCharacter: "Krillin", privateNotes: "",
      messages: [{ role: "user", content: "You won't get away with this, Cell!" }],
    });
    if (r.status === 200 && r.json?.reply) { console.log("SIM reply:", r.json.reply); ok("simulate reply"); }
    else bad("simulate reply", JSON.stringify(r.json).slice(0, 200));
  }

  section("SUMMARY");
  console.log(results.join("\n"));
  console.log(`\nTOTAL: ${pass} pass, ${fail} fail`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((e) => { console.error("AUDIT CRASHED:", e); process.exitCode = 2; });
