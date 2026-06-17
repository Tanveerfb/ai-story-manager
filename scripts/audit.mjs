/**
 * End-to-end audit driver. Drives the running app's API routes against a live
 * local LLM (LM Studio) to generate and manage a small story, exercising every
 * pipeline stage and reporting PASS/FAIL per step.
 *
 * Run with the dev server up and STORY_DATA_PATH pointed at an isolated dir.
 */

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const LLM = process.env.AUDIT_LLM ?? "http://localhost:1234/v1";
const GEN = process.env.AUDIT_GEN ?? "gemma-4-e4b-uncensored-hauhaucs-aggressive";
const EMBED = process.env.AUDIT_EMBED ?? "text-embedding-nomic-embed-text-v1.5";

let pass = 0;
let fail = 0;
const results = [];

function ok(name, detail = "") {
  pass++;
  results.push(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function bad(name, detail = "") {
  fail++;
  results.push(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(path, method, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

function section(t) {
  console.log(`\n=== ${t} ===`);
}

async function main() {
  // --- 0. health ---------------------------------------------------------
  section("health");
  {
    const r = await api("/api/llm/health", "POST", {
      provider: "lmstudio",
      baseUrl: LLM,
    });
    if (r.status === 200 && r.json?.ok && (r.json.models ?? []).includes(GEN)) {
      ok("health", `${r.json.models.length} models, gen present`);
    } else {
      bad("health", JSON.stringify(r.json).slice(0, 200));
      return;
    }
  }

  // --- 1. story scaffold -------------------------------------------------
  section("story scaffold");
  const part = (await api("/api/story", "POST", { action: "createPart", title: "The Hollow Crown" })).json;
  if (!part?.slug) return bad("createPart", JSON.stringify(part));
  ok("createPart", part.slug);
  const chapter = (await api("/api/story", "POST", { action: "createChapter", part: part.slug, title: "Ashfall" })).json;
  if (!chapter?.slug) return bad("createChapter", JSON.stringify(chapter));
  ok("createChapter", chapter.slug);

  // --- 2. raw author input -> two additions ------------------------------
  // Terse author drafts. The formatter must fix grammar/flow ONLY.
  const raws = [
    "kira step into burned village. smoke everywhere. she find old man named bren hiding in well. he scared. she say we go now before riders come back.",
    "they ride north to ironhold gate. captain vael block road. kira show the iron sigil. vael let them pass but warn the queen is watching.",
  ];

  const proseByAddition = [];
  for (let i = 0; i < raws.length; i++) {
    section(`addition ${i + 1}: format`);
    const fmt = await api("/api/llm/format", "POST", {
      baseUrl: LLM,
      generationModel: GEN,
      embeddingModel: EMBED,
      part: part.slug,
      chapter: chapter.slug,
      rawInput: raws[i],
      adjustments: [],
    });
    if (fmt.status !== 200 || !fmt.json?.prose) {
      bad(`format ${i + 1}`, JSON.stringify(fmt.json).slice(0, 200));
      continue;
    }
    const prose = fmt.json.prose;
    proseByAddition.push(prose);
    console.log("RAW  :", raws[i]);
    console.log("PROSE:", prose);
    console.log("DIFF :", fmt.json.summary);
    // Heuristic faithfulness check: prose shouldn't balloon (sign of invention).
    const ratio = prose.split(/\s+/).length / raws[i].split(/\s+/).length;
    if (ratio > 2.2) {
      bad(`format ${i + 1} faithfulness`, `word ratio ${ratio.toFixed(2)} — possible invention, inspect`);
    } else {
      ok(`format ${i + 1}`, `word ratio ${ratio.toFixed(2)}`);
    }

    // persist as an addition
    const add = await api("/api/story", "POST", {
      action: "createAddition",
      part: part.slug,
      chapter: chapter.slug,
      content: prose,
    });
    if (add.status !== 201) bad(`createAddition ${i + 1}`, JSON.stringify(add.json));
    else ok(`createAddition ${i + 1}`, `addition ${add.json.number}`);

    // embed it
    section(`addition ${i + 1}: embed`);
    const emb = await api("/api/llm/embed", "POST", {
      baseUrl: LLM,
      model: EMBED,
      text: prose,
      chunkRef: `${part.slug}/${chapter.slug}/${add.json?.number ?? i}`,
      additionNumber: add.json?.number ?? i,
      metadata: { part: part.slug, chapter: chapter.slug, characters: [], location: null },
    });
    if (emb.status !== 201) bad(`embed ${i + 1}`, JSON.stringify(emb.json));
    else ok(`embed ${i + 1}`, emb.json.id);

    // extract artifacts
    section(`addition ${i + 1}: extract`);
    const ext = await api("/api/llm/extract", "POST", {
      baseUrl: LLM,
      generationModel: GEN,
      part: part.slug,
      chapter: chapter.slug,
      additionNumber: add.json?.number ?? i,
      text: prose,
    });
    if (ext.status !== 200) {
      bad(`extract ${i + 1}`, JSON.stringify(ext.json).slice(0, 300));
    } else {
      console.log("EXTRACT:", JSON.stringify(ext.json));
      ok(`extract ${i + 1}`, `failed=[${(ext.json.failed ?? []).join(",")}]`);
    }
  }

  // --- 3. semantic search ------------------------------------------------
  section("search");
  {
    const r = await api("/api/llm/search", "POST", {
      baseUrl: LLM,
      model: EMBED,
      query: "Who did Kira find hiding?",
      topK: 5,
    });
    if (r.status === 200 && Array.isArray(r.json?.results) && r.json.results.length > 0) {
      console.log("SEARCH:", JSON.stringify(r.json.results.map((x) => ({ ref: x.chunkRef, score: x.score?.toFixed?.(3) ?? x.score }))));
      const top = r.json.results[0];
      // the well/bren scene is addition 0
      ok("search", `top=${top.chunkRef} score=${top.score?.toFixed?.(3)}`);
    } else {
      bad("search", JSON.stringify(r.json).slice(0, 200));
    }
  }

  // --- 4. artifacts + bible ---------------------------------------------
  section("artifacts");
  const arts = await api("/api/artifacts", "GET");
  if (arts.status === 200 && arts.json) {
    const a = arts.json;
    console.log("ARTIFACTS:", JSON.stringify({
      characters: a.characters?.map((c) => c.name),
      locations: a.locations?.map((l) => l.name),
      factions: a.factions?.map((f) => f.name),
      lore: a.lore?.map((l) => l.term),
      timeline: a.timeline?.length,
    }));
    if ((a.characters?.length ?? 0) > 0) ok("artifacts", `${a.characters.length} chars, ${a.locations?.length ?? 0} locs`);
    else bad("artifacts", "no characters extracted");
  } else {
    bad("artifacts", JSON.stringify(arts.json).slice(0, 200));
  }

  section("bible");
  const bible = await api("/api/bible", "GET");
  if (bible.status === 200 && bible.json) {
    console.log("BIBLE keys:", Object.keys(bible.json));
    ok("bible read");
    const ann = await api("/api/bible", "PUT", { annotations: "Audit note: Kira carries the iron sigil." });
    if (ann.status === 200) ok("bible annotate");
    else bad("bible annotate", JSON.stringify(ann.json));
  } else {
    bad("bible read", JSON.stringify(bible.json).slice(0, 200));
  }

  // --- 5. fanboy ---------------------------------------------------------
  section("fanboy");
  {
    const r = await api("/api/llm/fanboy", "POST", {
      baseUrl: LLM,
      generationModel: GEN,
      embeddingModel: EMBED,
      messages: [{ role: "user", content: "What did you think of the village scene?" }],
    });
    if (r.status === 200 && r.json?.reply) {
      console.log("FAN persona:", r.json.personality);
      console.log("FAN reply:", r.json.reply);
      ok("fanboy");
    } else {
      bad("fanboy", JSON.stringify(r.json).slice(0, 200));
    }
  }

  // --- 6. simulation -----------------------------------------------------
  section("simulation: reply");
  {
    const r = await api("/api/llm/simulate", "POST", {
      action: "reply",
      baseUrl: LLM,
      generationModel: GEN,
      embeddingModel: EMBED,
      simulatedCharacters: ["Kira"],
      userCharacter: "Bren",
      privateNotes: "",
      messages: [{ role: "user", content: "Why should I trust you, girl?" }],
    });
    if (r.status === 200 && r.json?.reply) {
      console.log("SIM reply:", r.json.reply);
      ok("simulate reply");
    } else {
      bad("simulate reply", JSON.stringify(r.json).slice(0, 200));
    }
  }
  section("simulation: suggest");
  {
    const r = await api("/api/llm/simulate", "POST", {
      action: "suggest",
      baseUrl: LLM,
      generationModel: GEN,
      sceneText: "Kira grips the iron sigil as the gate groans open.",
    });
    if (r.status === 200 && r.json?.part && r.json?.chapter) {
      console.log("SUGGEST:", JSON.stringify(r.json));
      ok("simulate suggest", `${r.json.part}/${r.json.chapter}`);
    } else {
      bad("simulate suggest", JSON.stringify(r.json).slice(0, 200));
    }
  }

  // --- summary -----------------------------------------------------------
  section("SUMMARY");
  console.log(results.join("\n"));
  console.log(`\nTOTAL: ${pass} pass, ${fail} fail`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error("AUDIT CRASHED:", e);
  process.exitCode = 2;
});
