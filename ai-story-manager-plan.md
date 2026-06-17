# AI Story Manager — Project Plan

**Author:** Tanveer (Truqorun)  
**Version:** 1.0.0  
**Status:** Pre-development — Brainstorming Complete  
**Rules:** Follows `project-rules.md` v1.0.0 strictly

---

## 1. Project Overview

A local-first, AI-assisted story management system where the **author owns all creative output** and the **LLM is a formatter and memory system**, never a co-author. The author provides raw story content prompt by prompt. The LLM formats it into proper prose, manages story artifacts in the background, and optionally engages the author as a fanboy or simulates story characters — all without ever adding to the story itself.

This is v3 of this system. v1 and v2 failed due to:

- Context loss (no embeddings — LLM forgot story by chapter 7)
- Prose formatter hallucinating additions the author never wrote
- Frustrating adjustment loop (free-text only, prone to drift)
- Artifact extraction being incomplete or wrong
- Background processing being unreliable and out of sync

Every architectural decision in this plan is a direct response to one or more of those failure modes.

---

## 2. V1 Success Criteria

Before any additional features are considered, all four of these must be true:

1. **AI never loses track of the story** — embedding pipeline + story bible ensure full context retention regardless of chapter count
2. **Artifacts are always accurate and in sync** — structured extraction, Zod validation, and visible sync status
3. **Prose formatter never adds what the author didn't write** — restrictive system prompt + diff summary on output
4. **The workflow never gets in the author's way** — mobile-first, minimal friction, fast approval loop

---

## 3. Tech Stack

| Layer         | Choice                                                | Reason                                    |
| ------------- | ----------------------------------------------------- | ----------------------------------------- |
| Framework     | Next.js (App Router, TypeScript, strict mode)         | Project standard                          |
| UI Components | shadcn/ui                                             | Project standard                          |
| Styling       | Tailwind CSS + CSS Modules where needed               | Project standard                          |
| Animation     | Framer Motion                                         | Specified                                 |
| State         | Zustand (one store per domain)                        | Project standard                          |
| Validation    | Zod                                                   | Schema validation for artifact extraction |
| Forms         | react-hook-form + Zod                                 | Settings page                             |
| Data Fetching | SWR                                                   | Client-side data fetching standard        |
| Local Storage | Filesystem (JSON + MD files via API routes)           | Specified — no DB for v1                  |
| Auth          | Firebase Auth (optional, feature-flagged)             | Specified                                 |
| LLM           | Ollama or LM Studio (user selectable)                 | Specified                                 |
| Embeddings    | Ollama or LM Studio embedding model (user selectable) | Specified                                 |

---

## 4. Core Philosophy — LLM as a Strict Employee

The LLM has a narrow, clearly defined job. It is never a creative collaborator.

Every prompt sent to the LLM from this system must be:

- **Scoped to one specific task** (format, extract, embed, fanboy, simulate)
- **Given explicit rules about what NOT to do**
- **Validated before it touches any data**
- **Transparent to the user about what it did**

This principle must be enforced in every system prompt in the system prompt library (defined in Batch 1 of the build order).

---

## 5. Project Structure

Follows `project-rules.md` Section 4 with story-specific additions.

```
app/
  (auth)/
    login/
      page.tsx
  layout.tsx
  page.tsx                        # Redirects to /story or /setup
  story/
    page.tsx                      # Main story navigator
  editor/
    page.tsx                      # Prose editor (full screen on mobile)
  artifacts/
    page.tsx                      # Artifact dashboard
  simulation/
    page.tsx                      # Character simulation mode
  fanboy/
    page.tsx                      # Fanboy Q&A panel
  settings/
    page.tsx                      # LLM settings
  api/
    llm/
      format/route.ts             # Prose formatter endpoint
      extract/route.ts            # Artifact extraction endpoint
      embed/route.ts              # Embedding endpoint
      search/route.ts             # Semantic search endpoint
      fanboy/route.ts             # Fanboy Q&A endpoint
      simulate/route.ts           # Character simulation endpoint
    story/
      route.ts                    # Story CRUD
    artifacts/
      route.ts                    # Artifact CRUD
    fs/
      route.ts                    # Filesystem read/write abstraction

components/
  layout/
    Navbar.tsx
    Footer.tsx
    Button.tsx                    # All variants per project-rules.md Section 11
    MobileDrawer.tsx
    BottomSheet.tsx
    PageWrapper.tsx
  ui/                             # shadcn generated — do not edit directly
  editor/
    RawInput.tsx                  # Author's raw prompt input
    ProseOutput.tsx               # Formatted prose display
    DiffSummary.tsx               # "What changed" summary (mobile-friendly)
    AdjustmentToolbar.tsx         # Quick adjustment buttons
    ApprovalBar.tsx               # Approve / Adjust / Discard
  story/
    StoryNavigator.tsx            # Parts → Chapters sidebar/drawer
    ChapterList.tsx
    AdditionCard.tsx
  artifacts/
    CharacterCard.tsx
    LocationCard.tsx
    TimelineEntry.tsx
    FactionCard.tsx
    LoreEntry.tsx
    ArtifactEditor.tsx            # User can manually edit artifact fields
    SyncStatusBadge.tsx           # Shows last sync state per artifact
  simulation/
    SimulationChat.tsx
    MessageBubble.tsx
    SessionReview.tsx             # Cherry-pick exchanges before inserting
  fanboy/
    FanboyChat.tsx
  queue/
    QueueStatusBar.tsx            # Subtle background processing indicator

hooks/
  useLLMGateway.ts               # Abstraction over Ollama / LM Studio
  useEmbeddings.ts               # Embed + cosine search
  useStoryFS.ts                  # Filesystem operations via API
  useProcessingQueue.ts          # Job queue state and management
  useAdjustmentLoop.ts           # Manage adjustment session state
  useSimulationSession.ts        # Character simulation session
  useArtifactSync.ts             # Trigger and track artifact extraction

lib/
  utils.ts                       # shadcn cn() utility
  llm/
    gateway.ts                   # LLM provider abstraction
    prompts.ts                   # All system prompts — locked library
    parser.ts                    # LLM response parsing + Zod validation
  embeddings/
    cosine.ts                    # Cosine similarity calculation
    search.ts                    # Top-K semantic search
  fs/
    story.ts                     # Story file read/write helpers
    artifacts.ts                 # Artifact file read/write helpers
    embeddings.ts                # Embedding index read/write
  constants.ts                   # App-wide constants

store/
  useSettingsStore.ts            # LLM config — persisted to localStorage
  useStoryStore.ts               # Current part, chapter, additions list
  useEditorStore.ts              # Current draft, adjustment loop, approval status
  useArtifactStore.ts            # Characters, locations, timeline in memory
  useQueueStore.ts               # Background processing queue + job statuses
  useSimulationStore.ts          # Current simulation session state
  useUIStore.ts                  # Panels, drawers, mobile nav state

types/
  story.ts                       # Part, Chapter, Addition types
  artifacts.ts                   # Character, Location, Timeline, Faction, Lore types
  llm.ts                         # LLM provider config, request/response types
  embeddings.ts                  # EmbeddingEntry, SearchResult types
  queue.ts                       # Job, JobStatus types
  simulation.ts                  # SimulationSession, SimulationMessage types
  settings.ts                    # AppSettings type

styles/
  globals.css

public/
```

---

## 6. Local File System — Data Structure

All story data lives in `/story-data/` at the project root (accessed only via API routes, never from the client directly).

```
story-data/
  story.json                          # Story metadata
  parts/
    part-01/
      meta.json                       # Part title, time gap note (optional)
      chapters/
        ch-01/
          meta.json                   # Chapter title, short summary
          additions/
            001.md                    # Each approved prose chunk
            002.md
  artifacts/
    characters/
      [character-slug].json           # One file per character
    locations.json                    # All locations
    timeline.json                     # Chronological events array
    factions.json                     # Organisations, groups
    lore.json                         # World rules, terminology
  embeddings/
    index.json                        # [{id, chunkRef, vector[], metadata}]
  story-bible.json                    # Auto-generated always-injected context block
```

### story.json shape

```json
{
  "id": "uuid",
  "title": "Story title",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "currentPart": "part-01",
  "currentChapter": "ch-01",
  "totalAdditions": 42,
  "storyBibleUpdatedAt": "ISO timestamp"
}
```

### Character artifact shape (Zod-validated)

```json
{
  "slug": "elara-voss",
  "name": "Elara Voss",
  "firstAppearedAt": {
    "part": "part-01",
    "chapter": "ch-01",
    "addition": "001"
  },
  "lastUpdatedAt": { "part": "part-01", "chapter": "ch-03", "addition": "007" },
  "lastUpdatedByAddition": 7,
  "authorOverride": false,
  "authorOverrideNote": null,
  "traits": [],
  "relationships": [],
  "knownLocations": [],
  "notes": ""
}
```

`authorOverride: true` is set when the author manually edits a character profile. The LLM treats all `authorOverride: true` fields as authoritative and does not overwrite them.

---

## 7. Zustand Stores

### useSettingsStore

Persisted to localStorage. Controls LLM provider config.

```
provider: "ollama" | "lmstudio"
baseUrl: string (default: http://localhost:11434)
generationModel: string
embeddingModel: string
```

### useStoryStore

```
currentPart: string
currentChapter: string
additions: Addition[]
storyMeta: StoryMeta
```

### useEditorStore

```
rawInput: string
currentDraft: string
adjustmentHistory: Message[]       # [{role, content}] — cleared on approve/discard
adjustmentCount: number            # Soft cap at 3
approvalStatus: "idle" | "reviewing" | "approved" | "discarded"
```

### useArtifactStore

```
characters: Character[]
locations: Location[]
timeline: TimelineEvent[]
factions: Faction[]
lore: LoreEntry[]
lastSyncedAddition: number
```

### useQueueStore

```
jobs: Job[]                        # [{id, type, status, additionRef, error}]
  type: "embed" | "extract"
  status: "pending" | "running" | "done" | "failed"
```

### useSimulationStore

```
session: SimulationSession | null
messages: SimulationMessage[]
selectedCharacters: string[]       # slugs of LLM-simulated characters
userCharacter: string | null       # slug or "author"
isProcessing: boolean
```

### useUIStore

```
isDrawerOpen: boolean              # Story navigator drawer (mobile)
isArtifactSheetOpen: boolean       # Artifact bottom sheet (mobile)
activeArtifactTab: string
isFanboyOpen: boolean
```

---

## 8. LLM Gateway

Both Ollama and LM Studio expose an OpenAI-compatible REST API. The gateway abstracts them behind one interface.

```
Ollama base URL:    http://localhost:11434/v1
LM Studio base URL: http://localhost:1234/v1
```

The gateway handles:

- Provider selection from settings
- Chat completions (generation)
- Embeddings
- JSON mode enforcement where needed
- Error handling and retry logic

All LLM calls go through Next.js API routes. The client never calls the local LLM directly.

---

## 9. System Prompt Library

All system prompts are defined in `lib/llm/prompts.ts` and locked before any feature implementation begins. They are never modified during feature development without explicit review.

### PROSE_FORMATTER

Purpose: Take author's raw input and rewrite into clean prose.

Rules injected into every call:

- You are a prose formatter only
- Do NOT add character actions not explicitly stated
- Do NOT invent dialogue
- Do NOT add plot elements
- Do NOT add descriptions of anything not mentioned
- If the author wrote it vaguely, keep it vague — do not fill gaps
- Every sentence in your output must trace back to the author's input
- You may fix grammar, punctuation, and sentence flow only

### ARTIFACT_EXTRACTOR (one variant per artifact type)

Rules injected:

- Extract only what is explicitly stated in the provided text
- Do not infer, assume, or extrapolate
- If a field cannot be filled from the text, leave it null
- Return valid JSON matching the provided schema exactly
- Do not include commentary outside the JSON object

### STORY_BIBLE_UPDATER

Purpose: Maintain a compact always-injected context block.
Rules:

- Summarise current part, current chapter, active characters, current location
- Maximum 500 tokens
- Factual only — no interpretation

### CONTEXT_BUILDER

Purpose: Assemble the context window for a prose format call.
Components injected (in order):

1. Story bible block (always included, ~500 tokens)
2. Top-K semantically relevant past additions (from embedding search)
3. Last 2 additions verbatim (recency anchor)
4. Author's raw input

### FANBOY

Purpose: On-demand Q&A as a story enjoyer.
Rules:

- Personality is inferred from story content and tone — never hardcoded
- You are a fan of this story, not a critic or analyst
- Your personality stays consistent within a session
- Ask questions from curiosity, not as a reviewer
- Never spoil or predict — respond only to what has been written

### CHARACTER_SIMULATOR

Purpose: Simulate one or more story characters in an interactive session.
Rules:

- You play [Character Name(s)] as they are established in the story
- Only use knowledge established in the story OR privately defined by the author for this session
- If asked about something not established, respond as the character would — uncertain or unaware
- Stay in character at all times
- Do not break the fourth wall
- Maximum two simultaneous simulated characters

---

## 10. Embedding Pipeline

### On Approval (non-blocking)

When the author approves a formatted prose chunk:

1. Addition is saved to filesystem as `additions/NNN.md`
2. Two jobs are pushed to `useQueueStore`: `{type: "embed"}` and `{type: "extract"}`
3. Queue processor picks up jobs in background
4. Embed job: sends addition text to embedding model → receives vector → appended to `embeddings/index.json`
5. Extract job: runs per-artifact-type extraction → validates with Zod → updates artifact files

### On New Prompt (semantic search)

Before sending a format call to the LLM:

1. Embed the author's raw input
2. Run cosine similarity against `embeddings/index.json`
3. Return top-K most relevant past addition references
4. Fetch those addition MD files
5. Combine with story bible + last 2 additions → build context window

### Embedding Index Entry shape

```json
{
  "id": "uuid",
  "chunkRef": "part-01/ch-03/additions/007",
  "additionNumber": 7,
  "vector": [0.123, 0.456, ...],
  "metadata": {
    "part": "part-01",
    "chapter": "ch-03",
    "characters": ["elara-voss"],
    "location": "the-market"
  }
}
```

Cosine similarity is computed in `lib/embeddings/cosine.ts`. No external vector DB needed for single-story v1.

---

## 11. Core User Flows

### A. Prose Editor Loop

```
Author types raw prompt in RawInput
        ↓
[API] Search embeddings for relevant past context
        ↓
[API] Build context window (story bible + top-K relevant + last 2 + raw input)
        ↓
[API] LLM formats into prose (PROSE_FORMATTER system prompt)
        ↓
ProseOutput displays formatted result
DiffSummary shows "X phrases restructured" (non-blocking, dismissible)
        ↓
Author choice:
  ┌─ "Adjust" → AdjustmentToolbar shown
  │     Quick buttons: Shorter / Longer / Less flowery / More formal / Fix punctuation only
  │     Or: targeted selection + custom instruction
  │     Adjustment round sent with full adjustmentHistory in context
  │     adjustmentCount increments (soft warning at 3)
  │     → New draft displayed → repeat choice
  │
  └─ "Approve"
        Addition saved as NNN.md
        adjustmentHistory cleared
        Queue: push embed + extract jobs
        Editor resets to idle
```

### B. Artifact Extraction (Background Queue)

```
Job: {type: "extract", additionRef: "part-01/ch-03/007"}
        ↓
Read addition MD file
        ↓
Run 5 parallel extraction calls (characters, locations, timeline, factions, lore)
Each call uses ARTIFACT_EXTRACTOR prompt variant for that type
        ↓
Zod validation on each response
  ├─ Valid → merge with existing artifact file
  │     If authorOverride fields exist → do not overwrite them
  │     Append author override note to LLM context for that field
  └─ Invalid → retry once → if still invalid → mark job as "failed"
        ↓
QueueStatusBar updates in UI
"X artifacts updated — review?" notification (non-blocking)
Artifact timestamp updated to "last synced at addition #N"
```

### C. Author Manual Artifact Edit

```
Author opens artifact (e.g. character profile)
Edits a field
Saves
        ↓
Field marked authorOverride: true
authorOverrideNote: "Author updated at Part 1, Ch 4"
        ↓
LLM notified via system prompt context injection:
"Note: [field] for [character] has been manually set by the author. Treat as authoritative."
```

### D. Character Simulation Mode

```
Author enters Simulation Mode
Selects: which character(s) LLM simulates (max 2)
Selects: who they are playing (established character or "author/interviewer")
Optionally defines: private character knowledge (not yet in story)
        ↓
Session begins
Author sends message as their character
        ↓
[API] Simulation call with CHARACTER_SIMULATOR prompt
Context injected: story bible + relevant past additions + private character definitions
        ↓
LLM responds as simulated character(s)
Each response has: Accept | Regenerate
  ├─ Regenerate → new response generated
  ├─ Accept → message approved (explicit)
  └─ Author sends next message without selecting → previous auto-approved
        ↓
Session ends (author triggers)
        ↓
Session Review screen:
  - Full conversation displayed
  - Author can cherry-pick individual exchanges
  - Selected exchanges processed through PROSE_FORMATTER as a scene
  - Author selects insertion point (Part + Chapter)
  - LLM suggests insertion point with reasoning
  - Approved scene saved as a new addition in the target chapter
  - Scene is embedded and extracted like any other addition
```

### E. Fanboy Mode

```
Author opens Fanboy Panel (on-demand only)
        ↓
First open in session:
  [API] LLM infers fanboy personality from story content + tone
  Personality stored in session (not persisted between sessions)
        ↓
Author and fanboy chat freely
Context: story bible + relevant past additions via semantic search
LLM responds as an enthusiastic story fan
  - Asks questions
  - Reacts to events
  - Never predicts or spoils
        ↓
Panel can be closed and reopened — personality persists within session
```

---

## 12. Background Processing Queue

Managed by `useQueueStore` + `useProcessingQueue` hook.

### Job lifecycle

```
pending → running → done
                 → failed (auto-retry once) → failed_final
```

### UI representation

- `QueueStatusBar` — a subtle persistent indicator (small icon + count)
  - Idle: hidden or minimal
  - Running: spinner + "Syncing..."
  - Done: brief checkmark flash
  - Failed: amber warning icon, click to retry manually

### Rules

- Jobs run sequentially per addition (not in parallel between additions)
- Embed job always runs before extract job for the same addition
- Failed jobs are retried once automatically
- After second failure: flagged for manual retry, never silently dropped
- Queue state survives page refresh (persisted via Zustand persist middleware)

---

## 13. Mobile UX Rules

- **Editor is full screen on mobile** — no panels, no drawers visible during active writing
- **Story Navigator** lives in a left drawer (swipe to open or hamburger button)
- **Artifact panel** lives in a bottom sheet
- **Fanboy panel** lives in a bottom sheet
- **Simulation Mode** is full screen on mobile
- **DiffSummary** on mobile: single line ("3 phrases restructured") with dismiss button — never side-by-side
- **AdjustmentToolbar** on mobile: horizontal scroll row of quick action chips above the keyboard
- All tap targets minimum 44px

---

## 14. Feature Batches & Build Order

### Pre-work (before any batch)

- [ ] Write and lock all system prompts in `lib/llm/prompts.ts`
- [ ] Define all Zod schemas for artifact types in `types/artifacts.ts`
- [ ] Define all TypeScript types across `types/` directory
- [ ] Brand colors confirmed and added to `tailwind.config.ts`
- [ ] Navigation style confirmed (sidebar on desktop, drawer on mobile)
- [ ] Base components built: Button (all variants), MobileDrawer, BottomSheet, PageWrapper

---

### Batch 1 — LLM Gateway + Settings Page

**Goal:** Get both LLM providers working through a single abstraction. Settings page is the first thing a user sees.

**Scope:**

- `lib/llm/gateway.ts` — OpenAI-compatible client, provider-agnostic
- `lib/llm/prompts.ts` — all system prompts written and locked
- `/settings` page — LLM provider selector, model name inputs, base URL override, connection test button
- `useSettingsStore` — persisted to localStorage
- API health check: ping the configured provider and return success/fail

**Types involved:** `settings.ts`, `llm.ts`

**Acceptance Criteria:**

- [ ] User can select Ollama or LM Studio on settings page
- [ ] User can input model name for generation and embedding
- [ ] Base URL is overrideable with a sensible default per provider
- [ ] Connection test button pings provider and shows success or error
- [ ] Settings persist across page refresh
- [ ] Switching provider clears model name fields (prevents mismatch)
- [ ] `lib/llm/gateway.ts` handles both providers with identical interface

---

### Batch 2 — Story Engine (Filesystem CRUD)

**Goal:** Establish the local filesystem as the data layer. All story structure operations work reliably.

**Scope:**

- `lib/fs/story.ts` — create, read, update part/chapter/addition structure
- `app/api/story/route.ts` — REST endpoints for story CRUD
- `app/api/fs/route.ts` — low-level filesystem abstraction
- `/story` page — story navigator (parts list → chapter list → additions list)
- `useStoryStore` — story state in memory
- `useStoryFS` hook — filesystem operations via SWR

**Acceptance Criteria:**

- [ ] Story directory is created on first launch if it doesn't exist
- [ ] Author can create a new Part with optional title and time-gap note
- [ ] Author can create a new Chapter within a Part
- [ ] Additions are saved as sequentially numbered MD files
- [ ] Story navigator shows parts, chapters, additions correctly
- [ ] Navigating to a chapter loads its additions in order
- [ ] All filesystem errors are caught, logged, and surfaced to the user

---

### Batch 3 — Embedding Pipeline

**Goal:** Every addition gets embedded on approval. Semantic search works correctly before the editor is built.

**Scope:**

- `lib/embeddings/cosine.ts` — cosine similarity function
- `lib/embeddings/search.ts` — top-K search against index
- `lib/fs/embeddings.ts` — index read/write helpers
- `app/api/llm/embed/route.ts` — embed a text chunk
- `app/api/llm/search/route.ts` — semantic search endpoint
- `useEmbeddings` hook
- `useQueueStore` + `useProcessingQueue` hook — queue foundation

**Acceptance Criteria:**

- [ ] Embedding a text chunk calls the configured embedding model correctly
- [ ] Vector is stored in `embeddings/index.json` with correct metadata
- [ ] Cosine similarity search returns correct top-K results
- [ ] Search endpoint returns addition references, not raw vectors
- [ ] Queue pushes embed job on addition approval
- [ ] Failed embed job is retried once then flagged
- [ ] Queue status is visible in UI (QueueStatusBar)

---

### Batch 4 — Prose Editor Loop

**Goal:** The core author experience. This is the most critical batch.

**Scope:**

- `/editor` page — full screen
- `RawInput` component — author's prompt input
- `ProseOutput` component — formatted prose display
- `DiffSummary` component — what changed summary
- `AdjustmentToolbar` component — quick action chips + targeted input
- `ApprovalBar` component — Approve / Adjust / Discard
- `app/api/llm/format/route.ts` — prose formatter endpoint
- `useEditorStore` — draft, adjustment loop, approval status
- `useAdjustmentLoop` hook — adjustment session management
- Context builder: story bible + semantic search + last 2 additions

**Acceptance Criteria:**

- [ ] Author submits raw input → formatted prose returned
- [ ] Context window correctly includes story bible + relevant past additions + last 2 additions
- [ ] PROSE_FORMATTER system prompt is used — no additions by the LLM
- [ ] DiffSummary shows a plain-language summary of what changed (no side-by-side on mobile)
- [ ] Quick action buttons trigger targeted adjustment round
- [ ] Adjustment loop maintains full conversation history in context
- [ ] adjustmentCount increments and soft warning appears at 3 rounds
- [ ] Approve saves addition to filesystem and triggers queue jobs
- [ ] adjustmentHistory is cleared on approve or discard
- [ ] Editor resets to idle state after approval
- [ ] Full screen on mobile, no panels visible during writing

---

### Batch 5 — Artifact Extraction + Dashboard

**Goal:** Background artifact extraction runs reliably. Author can view and edit artifacts.

**Scope:**

- `app/api/llm/extract/route.ts` — per-type extraction endpoint
- `lib/fs/artifacts.ts` — artifact file read/write
- `/artifacts` page — artifact dashboard
- `CharacterCard`, `LocationCard`, `TimelineEntry`, `FactionCard`, `LoreEntry` components
- `ArtifactEditor` component — manual edit with authorOverride flag
- `SyncStatusBadge` component — "last synced at addition #N"
- `useArtifactStore` — artifacts in memory
- `useArtifactSync` hook — trigger extraction and track status
- Zod validation on all extraction responses

**Acceptance Criteria:**

- [ ] Extract job runs after each addition approval (non-blocking)
- [ ] 5 extraction calls run per addition (characters, locations, timeline, factions, lore)
- [ ] Each response is Zod-validated before writing to filesystem
- [ ] Invalid response: retry once → flag as failed if still invalid
- [ ] authorOverride fields are never overwritten by extraction
- [ ] Author can manually edit any artifact field
- [ ] Manual edits set authorOverride: true and record a note
- [ ] LLM context includes author override notes for that character
- [ ] Artifact dashboard shows all artifact types with their last sync timestamp
- [ ] "X artifacts updated — review?" notification appears after sync (non-blocking, dismissible)
- [ ] Failed extraction jobs are visible and manually retriable

---

### Batch 6 — Story Bible

**Goal:** Always-injected context block stays accurate and current.

**Scope:**

- `app/api/llm/format/route.ts` — extend to include story bible in context
- Story bible generation: runs after each addition approval as a lightweight background job
- `story-data/story-bible.json` — auto-generated compact summary
- Optional author annotation: author can add notes to the story bible that are always injected
- Story bible is displayed on the story navigator page for author reference

**Story Bible Contents (max ~500 tokens):**

- Current part title and number
- Current chapter title and number
- Active characters (names + brief descriptor)
- Current location
- Recent significant events (last 3)
- Author annotations (if any)

**Acceptance Criteria:**

- [ ] Story bible is generated/updated after each addition approval
- [ ] Story bible stays under 500 tokens
- [ ] Story bible is always included in prose formatter context window
- [ ] Author can add optional annotations via the story navigator
- [ ] Author annotations are always injected and survive story bible regeneration
- [ ] Story bible is readable on the story navigator page

---

### Batch 7 — Fanboy Mode

**Goal:** On-demand Q&A with a personality inferred from the story.

**Scope:**

- `/fanboy` page (or bottom sheet on mobile)
- `FanboyChat` component
- `app/api/llm/fanboy/route.ts`
- Personality inference: first message of session triggers a brief tone-analysis call
- Personality persists for the session, not beyond

**Acceptance Criteria:**

- [ ] Fanboy panel is accessible on-demand, never intrusive
- [ ] Personality is inferred from story content on first open per session
- [ ] Personality stays consistent within a session
- [ ] Context includes story bible + semantic search results
- [ ] LLM never predicts, spoils, or adds to the story
- [ ] Conversation history is maintained within the session
- [ ] Panel can be dismissed and reopened without losing conversation

---

### Batch 8 — Character Simulation Mode

**Goal:** Author can interact with story characters in a live session that can feed back into the story.

**Scope:**

- `/simulation` page — full screen
- `SimulationChat` component
- `MessageBubble` component — with Accept / Regenerate per LLM message
- `SessionReview` component — cherry-pick screen at end of session
- `app/api/llm/simulate/route.ts`
- `useSimulationStore`
- `useSimulationSession` hook
- Session processing: selected exchanges → PROSE_FORMATTER → new addition in target chapter

**Acceptance Criteria:**

- [ ] Author selects simulated character(s) before session (max 2)
- [ ] Author selects who they are playing (established character or author/interviewer)
- [ ] Optional private character knowledge can be defined before session starts
- [ ] LLM responds only as the simulated character(s)
- [ ] Each LLM response has Accept and Regenerate options
- [ ] Sending a new message auto-approves the previous LLM response
- [ ] Author can end session at any time
- [ ] Session review shows full conversation
- [ ] Author can cherry-pick individual exchanges
- [ ] Selected exchanges are formatted as scene prose via PROSE_FORMATTER
- [ ] LLM suggests an insertion point with reasoning
- [ ] Author confirms or overrides insertion point
- [ ] Processed scene is saved as an addition in the target chapter
- [ ] Scene is embedded and extracted like any other addition
- [ ] Simulation mode is full screen on mobile

---

### Batch 9 — Firebase Auth (Optional — Feature Flagged)

**Goal:** Auth wrapper that can be enabled without touching core story functionality.

**Scope:**

- Feature flag: `NEXT_PUBLIC_AUTH_ENABLED=true/false` in `.env.local`
- `(auth)/login/page.tsx`
- `useAuthStore`
- Auth guard on all story routes (only when flag is enabled)
- When disabled: app works completely without auth

**Acceptance Criteria:**

- [ ] With flag off: app loads directly into story, no auth UI visible
- [ ] With flag on: unauthenticated users are redirected to login
- [ ] Firebase Auth initialised and working when flag is on
- [ ] Auth state persisted via useAuthStore
- [ ] Login page follows project UI standards

---

## 15. What Is Out of Scope for V1

- Multiple stories per user
- Export (MD, PDF, DOCX) — data is already local, manually extractable
- Real-time collaboration
- Story branching / alternate timelines
- Custom fanboy personality definition (v1: always inferred)
- More than 2 simultaneous simulated characters
- Vector DB (cosine search on index.json is sufficient for single story)
- Any LLM provider other than Ollama / LM Studio

---

## 16. New Project Setup Checklist

- [ ] `create-next-app` with TypeScript, Tailwind, App Router, `@/` alias
- [ ] `tsconfig.json` — strict mode confirmed
- [ ] shadcn initialised
- [ ] Brand colors confirmed and added to `tailwind.config.ts`
- [ ] Navigation style confirmed: sidebar on desktop, drawer on mobile
- [ ] Zustand confirmed
- [ ] Base components built: Navbar, Footer, Button (all variants per project-rules.md)
- [ ] Folder structure matches Section 5 of this plan
- [ ] `story-data/` directory created with correct subdirectory structure
- [ ] `.env.local` created: `NEXT_PUBLIC_AUTH_ENABLED=false`, `STORY_DATA_PATH`
- [ ] MCP servers active: Context7, shadcn, web search
- [ ] First `npm run build` passes clean before any feature work begins
- [ ] All system prompts written and locked in `lib/llm/prompts.ts`
- [ ] All Zod schemas defined in `types/artifacts.ts`
- [ ] All TypeScript types defined across `types/` directory
