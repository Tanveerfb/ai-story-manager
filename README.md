# AI-First Authoring Suite

An AI-first story creation web application for building narratives from scratch with AI assistance. Create stories, characters, and locations interactively with multiple uncensored AI models, live entity management, AI story memory, character portrait generation via Stable Diffusion, and advanced story continuation tools.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Set Up Ollama](#3-set-up-ollama)
  - [4. Set Up Supabase](#4-set-up-supabase)
  - [5. Set Up ComfyUI (Portrait Generation)](#5-set-up-comfyui-portrait-generation)
  - [6. Configure Environment Variables](#6-configure-environment-variables)
  - [7. Run the Development Server](#7-run-the-development-server)
- [Usage Guide](#usage-guide)
  - [Continue Story Editor](#continue-story-editor)
  - [UI Layout](#ui-layout)
  - [Story Memory (AI Context)](#story-memory-ai-context)
  - [Character Portrait Generation](#character-portrait-generation)
  - [Advanced Features](#advanced-features)
  - [Managing Your Story](#managing-your-story)
  - [Next-Gen Features](#next-gen-features)
- [API Endpoints](#api-endpoints)
- [Database Schema and Migrations](#database-schema-and-migrations)
- [AI Configuration](#ai-configuration)
- [Architecture](#architecture)
- [Privacy and Security](#privacy-and-security)
- [Mobile Access](#mobile-access)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

### Core AI-First Workflow

- **Start from Scratch** — No imports needed; create stories directly with AI guidance
- **Multiple Uncensored AI Models** — Switch between WizardLM, Llama 3, Dolphin, and others
- **Live Entity Creation** — Build characters and locations on-the-fly as your story develops
- **Interactive Story Continuation** — AI-powered narrative generation with full context awareness
- **In-Context Instructions** — Use `[ --- note ]` markers anywhere in your prompt to guide the AI inline
- **Iterative Revision** — Provide feedback and refine generated content without editing raw text
- **Story Branching** — Explore alternative scenarios without losing progress
- **Draft Management** — Save, version, and restore story continuations

### AI Quality Features

- **Strict (Prose Editor) Mode** — Temperature 0.45; AI rewrites your exact words as polished prose; no invented plot, characters, or events; no resolution added
- **Creative Mode** — Temperature 0.82; AI writes expansive scenes with natural flow and embellishment
- **Proportional Word Budget** — Output scales to your prompt length (`promptWords × 5`, floor 120)
- **Banned Filler Phrases** — AI never writes "Meanwhile...", "Little did...", passive synopsis, etc.
- **No Hard Token Cut** — AI self-completes within the word budget naturally

### Story Memory

- **AI-Generated Memory Block** — Compresses your full story into a ~250-word factual summary at temperature 0.3
- **Smart Context Loading** — ≤6 parts: full context; >6 parts: last 5; with memory: memory + last 2 parts
- **Generate / Regenerate / Clear** — Full UI panel on the Continue page

### Character Portraits (Stable Diffusion via ComfyUI)

- **One-Click Portrait Generation** — Brush icon on every character card and character detail page
- **Custom SD Prompt** — Optional custom prompt field to override the auto-generated one
- **Auto-Built Prompts** — Builds Stable Diffusion prompt from character description, traits, and personality
- **Saved to Profile** — Portrait saved as the character's avatar automatically (base64 in `avatar_url`)
- **Model Selection** — Uses any checkpoint model in your `ComfyUI/models/checkpoints/` folder

### Entity Management

- **Auto Extract on Insert** — When you click "Insert into Story", entity extraction runs first; new characters and locations are merged silently; success message shows what was added
- **Character Manager** — Create, edit, merge, and manage character profiles with traits and personalities
- **Location Manager** — Build your world with detailed location descriptions; merge duplicates; clean unused
- **Missing Names Resolver** — Detect character names in events/relationships not yet linked to a canonical character
- **Flashbacks** — Search and save key scenes for quick reference

### Other UI Features

- **Dark/Light Mode** — Toggle between themes
- **Responsive Design** — Desktop, tablet, and mobile
- **Tags and Notes** — Organize scenes with tags and private author notes
- **Timeline View** — Events timeline linked to characters and locations

---

## Tech Stack

| Layer           | Technology                                          |
| --------------- | --------------------------------------------------- |
| Frontend        | Next.js 16 (App Router), Material UI v5, TypeScript |
| Backend         | Next.js API Routes (Node.js)                        |
| Database        | Supabase (PostgreSQL)                               |
| Local AI        | Ollama (uncensored models)                          |
| Image Gen       | ComfyUI + Stable Diffusion (local GPU)              |
| File Processing | mammoth (DOCX parsing — legacy)                     |

---

## Prerequisites

- **Node.js** 18.0+ — [Download](https://nodejs.org/)
- **Ollama** — [Installation Guide](https://ollama.ai/)
- **Supabase Account** — [Sign up](https://supabase.com/)
- **Python 3.12** (for ComfyUI) — [Download](https://www.python.org/downloads/release/python-3126/)
- **Git**
- **NVIDIA GPU** with up-to-date drivers (for portrait generation; CPU-only possible but very slow)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Tanveerfb/ai-story-manager.git
cd ai-story-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Ollama

#### Install Ollama

- **macOS/Linux**:
  ```bash
  curl -fsSL https://ollama.ai/install.sh | sh
  ```
- **Windows**: Download the installer from [ollama.ai](https://ollama.ai/) and run it. Ollama starts automatically as a Windows service on `http://localhost:11434`.

#### Pull Models

```bash
# Recommended uncensored models
ollama pull wizardlm-uncensored
ollama pull dolphin-llama3
ollama pull llama3-uncensored

# High quality (slower — requires 48GB+ RAM or GPU)
ollama pull llama3.1:70b

# Fast iteration
ollama pull llama3.1:8b
```

#### Start Ollama Server

```bash
ollama serve
```

### 4. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com/)
2. Go to the **SQL Editor** in your Supabase dashboard
3. Run all migrations **in order**:

| File                                                  | Purpose                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `supabase/migrations/001_initial_schema.sql`          | Core tables: story_parts, characters, locations, events, relationships |
| `supabase/migrations/002_nextgen_features.sql`        | character_aliases, location_aliases, flashbacks, merge_history         |
| `supabase/migrations/003_continue_story_features.sql` | continuation_drafts, continuation_history, continuation_branches       |
| `supabase/migrations/005_story_memory.sql`            | story_memory table for AI context compression                          |

4. Go to **Project Settings → API** and copy your Project URL and anon key.

### 5. Set Up ComfyUI (Portrait Generation)

ComfyUI generates character portraits using Stable Diffusion locally on your GPU. Skip this section if you don't need portrait generation.

#### Clone and Install

```powershell
# From the ai-story-manager directory
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create a Python 3.12 virtual environment
# (Python 3.14 has no CUDA-compatible PyTorch builds as of early 2026)
py -3.12 -m venv venv312

# Install PyTorch 2.6.0 with CUDA 12.4
# Use cu124 — it works with NVIDIA driver 528+ including 591.x (CUDA 13.x)
.\venv312\Scripts\python.exe -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

# Install ComfyUI requirements
.\venv312\Scripts\python.exe -m pip install -r requirements.txt
```

> **Critical**: All three packages (torch, torchvision, torchaudio) must be from the **same build tag**. Mixing e.g. `torch 2.5.1+cu121` with `torchvision 0.25.0+cu124` causes `OSError: [WinError 127] c10_cuda.dll` on startup because `c10.dll` and `c10_cuda.dll` are from different versions.

#### Place Your Checkpoint Model

Put `.safetensors` files in `ComfyUI/models/checkpoints/`. The current configured model:

```
ComfyUI/models/checkpoints/cyberrealistic_illustriousAnimeV30.safetensors
```

#### Start ComfyUI

```powershell
cd ComfyUI
.\venv312\Scripts\python.exe main.py --listen 0.0.0.0
```

Or use the convenience script from the project root:

```powershell
.\ComfyUI\run_comfyui.ps1
```

Successful startup output:

```
pytorch version: 2.6.0+cu124
Device: cuda:0 NVIDIA GeForce RTX 3060 : cudaMallocAsync
Total VRAM 12288 MB
To see the GUI go to: http://0.0.0.0:8188
```

#### ComfyUI Troubleshooting

| Error                            | Cause                                                                          | Fix                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `WinError 127 c10_cuda.dll`      | Mixed PyTorch versions (e.g. `torch 2.5.1+cu121` + `torchvision 0.21.0+cu124`) | `pip uninstall torch torchvision torchaudio -y && pip cache purge` then reinstall fresh with `--index-url .../cu124` |
| `CUDA not available`             | Wrong CUDA tag for your driver                                                 | Use `cu124` for driver 528+; check `nvidia-smi` for driver version                                                   |
| `no module named triton` warning | Triton not available on Windows                                                | Harmless; ComfyUI uses `eager` backend automatically                                                                 |
| Portrait loads then fails        | Model filename mismatch                                                        | `SD_MODEL` in `.env.local` must match the exact filename in `models/checkpoints/`                                    |

### 6. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Ollama
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=wizardlm-uncensored:latest
OLLAMA_UNRESTRICTED_MODE=true

# AI Parameters
AI_NUM_CTX=4096
AI_TEMPERATURE=0.90
AI_TOP_P=0.92
AI_TOP_K=50
AI_MAX_TOKENS=1500
AI_REPEAT_PENALTY=1.1

# ComfyUI / Stable Diffusion (portrait generation)
STABLE_DIFFUSION_HOST=http://localhost:8188
SD_MODEL=cyberrealistic_illustriousAnimeV30.safetensors
```

To switch portrait models, change `SD_MODEL` to the filename of any checkpoint in `ComfyUI/models/checkpoints/`. The app picks it up on the next portrait generation without a restart.

`OLLAMA_UNRESTRICTED_MODE=true` removes content filters from all story generation. See [Privacy and Security](#privacy-and-security).

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects automatically to the Continue Story editor.

For network/mobile access (see [Mobile Access](#mobile-access)):

```bash
npm run dev -- --hostname 0.0.0.0
```

---

## Usage Guide

### Continue Story Editor

The Continue Story page (`/continue`) is the central workspace. The home page redirects here immediately.

#### Basic Workflow

1. **Select AI Model** — Click the model dropdown; lists all models installed in Ollama
2. **Select Generation Style**
   - **Strict (no filler)** — AI takes your words and rewrites them as polished prose. No invented characters, events, or resolution. Temperature 0.45.
   - **Creative (filler allowed)** — AI writes expansive scenes with natural flow and atmospheric detail. Temperature 0.82.
3. **Set Max Tokens** — Slider 500–3000 (default 600). Actual output scales proportionally to your prompt length.
4. **Create Characters** (optional) — Click **Add** in the Characters sidebar panel; fill in name, role, personality, traits, description
5. **Create Locations** (optional) — Click **Add** in the Locations sidebar panel
6. **Write Your Prompt** — Describe what should happen next
7. **Generate** — AI uses characters, locations, previous story parts, and story memory as context
8. **Edit** — Rich text editor appears with generated output; Georgia serif font for comfortable reading
9. **Insert into Story** — Auto-extracts entities first, then saves as a new numbered story part

Success message example: `"Story part 4 saved (added 1 character and 2 locations)."`

#### In-Context Markers

Insert `[ --- note ]` anywhere in your prompt to give the AI inline instructions:

```
[ --- Make Duke sound barely controlled — fury beneath the surface ]
Duke confronts the man who betrayed him in the alley behind the bar.
```

```
[ --- Write from Emma's POV, internal monologue only ]
The letter arrived with no return address.
```

The AI reads these notes and applies them without diluting or skipping them.

---

### UI Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  AI-First Story Editor                                                           │
│  Use [ --- note ] markers for in-context instructions.                          │
└──────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────┬────────────────────────────────────┐
│  MAIN EDITOR                              │  SIDEBAR TOOLS                     │
├───────────────────────────────────────────┼────────────────────────────────────┤
│                                           │                                    │
│  ▼ Story Memory                           │  ┌──────────────────────────────┐ │
│  [Generate Memory] [Regenerate] [Clear]   │  │ Author's Notes & Tags        │ │
│                                           │  ├──────────────────────────────┤ │
│  ▼ Recent Story Context                   │  │ Scene Type: [Dropdown ▼]     │ │
│  ┌──────────────────────────────────────┐ │  │                              │ │
│  │ Part 45: The Confrontation           │ │  │ Tags:                        │ │
│  │ Part 46: Revelation                  │ │  │ [Draft] [Climax] [Conflict]  │ │
│  └──────────────────────────────────────┘ │  │                              │ │
│                                           │  │ Side Notes: [textarea]       │ │
│  ┌──────────────────────────────────────┐ │  └──────────────────────────────┘ │
│  │ Your Prompt                          │ │                                    │
│  │                                      │ │  ┌──────────────────────────────┐ │
│  │ [ --- Make this intense ]            │ │  │ Alternative Scenarios        │ │
│  │ Duke enters the warehouse...         │ │  ├──────────────────────────────┤ │
│  └──────────────────────────────────────┘ │  │ [↗ Create Branch]            │ │
│                                           │  └──────────────────────────────┘ │
│  [Model ▼]  [Strict ▼]  [Tokens: ──●─]   │                                    │
│  [✨ Generate]  [🔄 Retry]  [🗑 Clear]     │  ┌──────────────────────────────┐ │
│                                           │  │ Generation History           │ │
│  Quick Templates:                         │  ├──────────────────────────────┤ │
│  [Continue cliffhanger] [Add dialogue]    │  │ 🕐 [timestamp] Prompt...     │ │
│  [Character react] [Describe setting]     │  │ Content preview... [↶]       │ │
│                                           │  └──────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │                                    │
│  │ Generated Continuation               │ │                                    │
│  │ [💾 Save Draft]  [➕ Insert Story]   │ │                                    │
│  ├──────────────────────────────────────┤ │                                    │
│  │ (editable rich text — Georgia serif) │ │                                    │
│  └──────────────────────────────────────┘ │                                    │
│                                           │                                    │
│  ┌──────────────────────────────────────┐ │                                    │
│  │ Revision Instructions                │ │                                    │
│  │ [📤 Generate Revision]               │ │                                    │
│  │ [Make dialogue natural] [Add details]│ │                                    │
│  └──────────────────────────────────────┘ │                                    │
└───────────────────────────────────────────┴────────────────────────────────────┘
```

**Left column (8/12):** Story memory panel → Context accordion → Prompt input → Model/style/token controls → Quick templates → Generated content editor → Revision panel

**Right column (4/12):** Author notes & tags → Branching panel → Generation history

---

### Story Memory (AI Context)

For long stories, summary memory prevents context window overflow and keeps the AI coherent.

**Strategy:**

| Condition           | Context Sent to AI          |
| ------------------- | --------------------------- |
| No memory, ≤6 parts | All story parts             |
| No memory, >6 parts | Last 5 parts                |
| Memory exists       | Memory block + last 2 parts |

**UI Panel on Continue page:**

- **Generate Memory** — Reads all story parts; calls Ollama at temperature 0.3 to produce a ~250-word factual summary; saves to `story_memory` table
- **Regenerate** — Overwrites existing memory (run after adding significant new story parts)
- **Clear** — Deletes stored memory; reverts to last-N-parts strategy
- Expand the panel to view memory content and when it was generated

**Database requirement:** Run `supabase/migrations/005_story_memory.sql` before using this feature:

```sql
CREATE TABLE story_memory (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content    TEXT NOT NULL,
  part_count INTEGER,
  generated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Character Portrait Generation

Generates character portraits using Stable Diffusion locally via ComfyUI. Requires ComfyUI running at `http://localhost:8188`.

#### From the Character Card (Characters list page)

Each character card has a **brush icon** (🖌) button in the top-right corner:

1. Click the brush icon
2. Portrait generates in ~20–40 seconds on an RTX 3060 (first generation loads the model: ~30s extra)
3. Portrait is displayed immediately and saved to the character's `avatar_url`

#### From the Character Detail Page (`/characters/[id]`)

1. Click **Generate Portrait** (or **Regenerate Portrait** if one already exists)
2. Optionally expand **Custom Prompt** to enter your own Stable Diffusion prompt
3. Click Generate — loading state shown during generation
4. Portrait saved to character profile and displayed

#### Auto-Built Prompt Logic

When no custom prompt is provided, the system builds one from the character record:

- Base: `"anime illustration, detailed character portrait, beautiful lighting, high quality"`
- Appends: character name, description, physical traits
- Personality mapping → expression hint:
  - `"bratty"` → `"smug smirk"`
  - `"cold"`, `"stoic"` → `"serious cold expression"`
  - `"cheerful"`, `"gentle"` → `"warm gentle smile"`
  - `"mysterious"` → `"enigmatic gaze"`
  - `"confident"`, `"dominant"` → `"confident expression"`
- Negative: `"bad anatomy, worst quality, blurry, deformed, ugly, extra limbs"`

#### Switching Models

Update `SD_MODEL` in `.env.local` to any `.safetensors` filename in `ComfyUI/models/checkpoints/`. The change takes effect on the next generation — no app restart needed.

Currently installed models:

- `cyberrealistic_illustriousAnimeV30.safetensors` ← active

#### Portrait API

| Method | Endpoint                               | Description                                               |
| ------ | -------------------------------------- | --------------------------------------------------------- |
| GET    | `/api/generate-portrait?action=status` | Check if ComfyUI is reachable                             |
| GET    | `/api/generate-portrait?action=models` | List checkpoint models in ComfyUI                         |
| POST   | `/api/generate-portrait`               | Generate portrait; body: `{ characterId, customPrompt? }` |

**ComfyUI Workflow**: `CheckpointLoader → CLIPTextEncode (pos + neg) → KSampler (20 steps, CFG 7.0, euler_ancestral) → VAEDecode → SaveImage`

---

### Advanced Features

#### Generation Styles

| Style                 | Temperature | Use When                                                         |
| --------------------- | ----------- | ---------------------------------------------------------------- |
| Strict (prose editor) | 0.45        | You wrote a rough line; AI polishes it into prose — no additions |
| Creative              | 0.82        | Free-flowing narrative, atmospheric scenes, exploratory writing  |

**Strict mode enforced rules:**

- Only use what the author provided — no invented characters, events, or plot
- No resolution, no conclusion — stay in the moment
- Banned phrases: `"Meanwhile"`, `"Little did"`, `"As if on cue"`, `"At that moment"`, `"Suddenly"`, `"It was clear that"`, `"hours later"`, `"days passed"`, `"unbeknownst"`, and more

**Uncensored rule (both modes):** Never fade to black, skip content, soften scenes, or add warnings or deflections — write what the author directs, in full.

#### Automatic Entity Extraction

When you click **Insert into Story**:

1. Silent entity extraction runs first on the generated text
2. New character/location names are added to your database
3. Existing ones are detected and skipped (no duplicates)
4. Story part is inserted regardless of extraction success/failure
5. Success message: `"Story part 3 saved (added 1 character and 2 locations)."`

You can also click **Extract Entities** manually at any time after generation.

#### Model Switching

- Switch models mid-story for different scenes
- Larger models (70B) for quality on pivotal scenes
- Smaller models (8B) for fast iteration and structure work
- Model list fetched live from Ollama — any installed model appears automatically

#### Story Branching

1. Save current draft
2. Click **Create Branch** in the sidebar
3. Name the branch (e.g., `"Alternative ending"`, `"Dark path"`)
4. Enter a prompt for the diverging scenario
5. Add optional side notes
6. Branch generates and saves independently; main draft is unchanged

#### Draft Management

- **Save Draft** — Preserves all metadata (tags, notes, scene type) without inserting into story
- **Revision History** — Every generation is stored; one-click restore to any previous version
- **Tags** — `Draft`, `Needs Review`, `Important`, `Climax`, `Character Development`, `Plot Point`, `Romance`, `Conflict`, `Resolution`
- **Scene Type** — `Action`, `Dialogue`, `Description`, `Cliffhanger`, `Reversal`, `Revelation`, `Transition`, `Flashback`, `Emotional`

#### Quick Prompt Templates

One-click starters in the editor:

- Continue from cliffhanger
- Describe character's reaction
- Add dialogue scene
- Describe setting in detail
- Plot twist

#### Revision Workflow

1. Generate initial content
2. Read it — decide what needs changing
3. Enter specific feedback in the **Revision Instructions** panel
   - Good: `"Make the dialogue sharper — Duke doesn't ramble"`
   - Good: `"Add more sensory detail about the rain"`
   - Avoid: `"Make it better"`
4. Click **Generate Revision** — AI rewrites using your instructions
5. Old version auto-saved to history; restore anytime

Quick revision templates: `"Make dialogue more natural"`, `"Add descriptive details"`, `"Increase tension"`, `"More emotional depth"`, `"Make character sound angrier"`

---

### Managing Your Story

#### Story Viewer (`/story`)

- Browse all inserted story parts in order
- Search and filter by content
- Each continuation inserted via **Insert into Story** becomes a numbered part

#### Character Management (`/characters`)

- Character list with cards, avatars, and portrait generation button per card
- Click any card for detail page with tabs: Overview, Traits, Relationships
- Generate/regenerate portrait from detail page with custom prompt support
- Merge duplicate characters: `/characters/merge`
- Resolve unlinked name aliases: `/characters/unlinked`

#### Location Management (`/locations`)

- Browse all locations with type filtering
- Edit descriptions and atmosphere
- Merge duplicates: `/locations/merge` (three tabs: All, Suggested Merges, Unused)
- Bulk delete unused locations

#### Events Timeline (`/timeline`)

- View all story events in chronological order
- Filter by event type: dialogue, action, revelation
- See character and location involvement per event

#### Flashbacks (`/flashbacks`)

- Search story content by keyword, character name, or location name
- Save important scenes with custom titles
- Expandable accordion view of saved flashbacks with delete option

#### Settings (`/settings`)

- View current AI configuration (model, parameters)
- Theme toggle (dark/light)

---

### Next-Gen Features

#### Missing Character Names Resolver (`/characters/unlinked`)

Detects names that appear in story events or character relationships but are not linked to a canonical character record.

- Shows usage count and context preview for each unlinked name
- Fuzzy matching suggests similar existing characters (Levenshtein similarity)
- **Link** — Associates the name with an existing character as an alias
- **Ignore** — Dismisses false positives

API: `GET /api/characters/unlinked` · `POST /api/characters/link-nickname` · `DELETE /api/characters/unlinked`

#### Locations Merge and Review (`/locations/merge`)

Three-tab interface for location database cleanup:

| Tab              | Description                                             |
| ---------------- | ------------------------------------------------------- |
| All Locations    | Select any locations manually and merge them            |
| Suggested Merges | Fuzzy match groups potential duplicates automatically   |
| Unused Locations | Locations referenced 0–1 times in story; safe to delete |

Merge preserves the primary location's data; all references updated automatically. Merge history is tracked in `merge_history` table.

API: `POST /api/locations/merge` · `GET /api/locations/suggestions` · `GET /api/locations/unused` · `DELETE /api/locations/bulk-delete`

---

## API Endpoints

### AI Generation

| Method | Endpoint                | Description                                |
| ------ | ----------------------- | ------------------------------------------ |
| POST   | `/api/continue`         | Generate/revise story continuation         |
| GET    | `/api/models`           | List all installed Ollama models           |
| GET    | `/api/story-memory`     | Get current story memory                   |
| POST   | `/api/story-memory`     | Generate/update story memory               |
| DELETE | `/api/story-memory`     | Clear story memory                         |
| POST   | `/api/extract-entities` | Extract characters and locations from text |

#### `/api/continue` Request Body

```json
{
  "action": "generate",
  "userPrompt": "Duke confronts the betrayer",
  "model": "wizardlm-uncensored:latest",
  "strict": true,
  "maxTokens": 600,
  "characterFocus": "character-uuid",
  "selectedCharacters": ["uuid1", "uuid2"],
  "selectedLocations": ["uuid1"]
}
```

Actions: `generate`, `revise`, `save-draft`, `get-history`, `branch`, `list-drafts`, `delete-draft`

### Characters

| Method         | Endpoint                        | Description                |
| -------------- | ------------------------------- | -------------------------- |
| GET/POST       | `/api/characters`               | List all / create          |
| GET/PUT/DELETE | `/api/characters/[id]`          | Get / update / delete      |
| GET            | `/api/characters/unlinked`      | Unlinked name aliases      |
| POST           | `/api/characters/link-nickname` | Link alias to character    |
| POST           | `/api/characters/merge`         | Merge duplicate characters |

### Locations

| Method         | Endpoint                     | Description                           |
| -------------- | ---------------------------- | ------------------------------------- |
| GET/POST       | `/api/locations`             | List all / create                     |
| GET/PUT/DELETE | `/api/locations/[id]`        | Get / update / delete                 |
| POST           | `/api/locations/merge`       | Merge duplicates                      |
| GET            | `/api/locations/suggestions` | Fuzzy match duplicate suggestions     |
| GET            | `/api/locations/unused`      | Unused or rarely referenced locations |
| DELETE         | `/api/locations/bulk-delete` | Delete multiple locations by ID       |

### Story

| Method         | Endpoint                | Description                          |
| -------------- | ----------------------- | ------------------------------------ |
| GET/POST       | `/api/story-parts`      | List all / create story part         |
| GET/PUT/DELETE | `/api/story-parts/[id]` | Get / update / delete story part     |
| GET            | `/api/events`           | Fetch events with optional filtering |

### Portrait Generation

| Method | Endpoint                               | Description                                               |
| ------ | -------------------------------------- | --------------------------------------------------------- |
| GET    | `/api/generate-portrait?action=status` | Check ComfyUI availability                                |
| GET    | `/api/generate-portrait?action=models` | List available SD checkpoints                             |
| POST   | `/api/generate-portrait`               | Generate portrait; body: `{ characterId, customPrompt? }` |

### Flashbacks

| Method          | Endpoint                 | Description                              |
| --------------- | ------------------------ | ---------------------------------------- |
| GET             | `/api/flashbacks/search` | Search events and story parts by keyword |
| GET/POST/DELETE | `/api/flashbacks/save`   | Manage saved flashbacks                  |

### Legacy (backward compatible, hidden from UI)

| Method | Endpoint                  | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| POST   | `/api/import-story`       | Import DOCX file                   |
| POST   | `/api/import-story/batch` | Batch DOCX import                  |
| POST   | `/api/continue-story`     | Legacy story continuation endpoint |

---

## Database Schema and Migrations

Run all files in order in the Supabase SQL Editor.

### `001_initial_schema.sql`

| Table              | Key Columns                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `story_parts`      | `part_number`, `title`, `content`, `summary`                                  |
| `characters`       | `name`, `role`, `description`, `personality`, `physical_traits`, `avatar_url` |
| `character_traits` | `character_id`, `trait_type`, `trait_value`                                   |
| `locations`        | `name`, `type`, `description`, `atmosphere`                                   |
| `events`           | `event_type`, `content`, `character_ids`, `location_id`                       |
| `relationships`    | `character_id`, `related_character_id`, `relationship_type`                   |
| `story_context`    | `context_type`, `content`                                                     |

### `002_nextgen_features.sql`

| Table               | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `character_aliases` | Nicknames / aliases linked to canonical characters    |
| `location_aliases`  | Location name variations                              |
| `flashbacks`        | Saved flashback scenes with custom titles             |
| `location_usage`    | Tracks how often each location appears in story parts |
| `merge_history`     | Audit trail for character and location merges         |

### `003_continue_story_features.sql`

| Table                   | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `continuation_drafts`   | Non-finalized continuations with tags, scene_type, side_notes |
| `continuation_history`  | All generations per draft for version control and restore     |
| `continuation_branches` | Alternative scenario branches linked to parent drafts         |

### `005_story_memory.sql`

| Table          | Purpose                                                     |
| -------------- | ----------------------------------------------------------- |
| `story_memory` | Single compressed story summary used by AI for long stories |

---

## AI Configuration

### Ollama Models

| Model                 | Size | Best For                         | Speed  |
| --------------------- | ---- | -------------------------------- | ------ |
| `wizardlm-uncensored` | 13B  | Creative fiction, mature content | Medium |
| `llama3.1:70b`        | 70B  | High-quality detailed narratives | Slow   |
| `llama3.1:8b`         | 8B   | Quick iterations and drafts      | Fast   |
| `dolphin-llama3`      | 8B   | Balanced versatility             | Fast   |
| `llama3-uncensored`   | 8B   | Community uncensored model       | Fast   |

Any model installed in Ollama appears in the model selector automatically.

### AI Parameters (`.env.local`)

| Variable            | Default | Effect                                     |
| ------------------- | ------- | ------------------------------------------ |
| `AI_NUM_CTX`        | 4096    | Context window tokens                      |
| `AI_TEMPERATURE`    | 0.90    | Fallback temperature (overridden per mode) |
| `AI_TOP_P`          | 0.92    | Nucleus sampling                           |
| `AI_TOP_K`          | 50      | Token selection pool                       |
| `AI_MAX_TOKENS`     | 1500    | Max output tokens                          |
| `AI_REPEAT_PENALTY` | 1.1     | Repetition reduction                       |

**Effective temperatures per operation:**

| Operation                 | Temperature |
| ------------------------- | ----------- |
| Creative story generation | 0.82        |
| Strict prose editing      | 0.45        |
| Story memory generation   | 0.30        |
| Entity extraction         | 0.10        |

### Stable Diffusion Parameters

| Parameter        | Value                        |
| ---------------- | ---------------------------- |
| Sampling steps   | 20                           |
| CFG scale        | 7.0                          |
| Sampler          | `euler_ancestral`            |
| Scheduler        | `normal`                     |
| Image dimensions | 512 × 768 (portrait)         |
| Model            | `SD_MODEL` from `.env.local` |

---

## Architecture

### Project Structure

```
ai-story-manager/
├── app/
│   ├── api/
│   │   ├── characters/           # List, create, merge, unlinked, link-nickname
│   │   ├── continue/             # Main AI generation endpoint
│   │   ├── events/               # Events with filtering
│   │   ├── extract-entities/     # Entity extraction
│   │   ├── flashbacks/           # Search and save flashbacks
│   │   ├── generate-portrait/    # ComfyUI portrait generation
│   │   ├── import-story/         # DOCX import (legacy)
│   │   ├── locations/            # List, create, merge, suggestions, unused, bulk-delete
│   │   ├── models/               # List Ollama models
│   │   ├── story-memory/         # GET / POST / DELETE story memory
│   │   └── story-parts/          # CRUD for story parts
│   ├── characters/               # List + [id] detail + merge + unlinked pages
│   ├── continue/                 # Main editor page
│   ├── flashbacks/               # Flashback reference page
│   ├── import/                   # Legacy import pages
│   ├── locations/                # List + merge pages
│   ├── settings/                 # Settings page
│   ├── story/                    # Story viewer
│   └── timeline/                 # Events timeline
├── components/
│   ├── CharacterCard.tsx         # Character card with portrait button (brush icon)
│   ├── FileUpload.tsx            # Drag-and-drop upload
│   ├── Navigation.tsx            # App navigation drawer
│   ├── ThemeProvider.tsx         # MUI dark/light theme
│   └── continue/
│       ├── BranchingPanel.tsx    # Branch creation UI
│       ├── EntityManager.tsx     # Live character creation inside editor
│       ├── FeedbackPanel.tsx     # Revision instructions UI
│       ├── GenerationProgress.tsx # Progress during generation
│       ├── HistoryPanel.tsx      # Generation history with restore
│       ├── LocationManager.tsx   # Live location creation inside editor
│       ├── ModelSelector.tsx     # Ollama model dropdown
│       └── SideNotesPanel.tsx    # Tags, scene type, author notes
├── lib/
│   ├── comfyui.ts                # ComfyUI API client — workflow builder, polling, prompt builder
│   ├── constants.ts              # Centralized config
│   ├── contextBuilder.ts         # Builds story context strings for AI prompts
│   ├── fuzzyMatch.ts             # Levenshtein distance, similarity groups
│   ├── ollama.ts                 # Ollama client — continueStory, generateStoryMemory
│   ├── parsers.ts                # Text parsing utilities
│   ├── supabase.ts               # Supabase client and helpers
│   ├── theme.ts                  # MUI theme config
│   └── types.ts                  # Shared TypeScript types
├── supabase/
│   └── migrations/               # SQL files — run in order
├── ComfyUI/                      # Local ComfyUI install (excluded from git)
│   ├── venv312/                  # Python 3.12 venv with torch 2.6.0+cu124
│   ├── models/checkpoints/       # SD checkpoint files
│   └── run_comfyui.ps1           # Startup script
├── .env.local                    # Secrets and config (excluded from git)
├── next.config.js
├── package.json
└── tsconfig.json
```

### Story Generation Data Flow

```
User submits prompt
       │
       ▼
POST /api/continue
       │
       ├── Fetch story_memory (if exists)
       ├── Fetch story parts
       │     ├── Has memory?   → memory + last 2 parts
       │     ├── ≤6 parts?    → all parts
       │     └── >6 parts?    → last 5 parts
       │
       ├── buildUserInstruction()
       │     └── characters, locations, style notes, token budget
       │
       └── continueStory(storyContext, userInstruction, model, strict, maxTokens)
                 │
                 ├── strict=true  → system: "prose editor", temp 0.45, sceneLabel: "REWORD AS PROSE"
                 └── strict=false → system: "scene writer", temp 0.82, sceneLabel: "CONTINUE THE STORY"
```

### Portrait Generation Data Flow

```
Click portrait button
       │
       ▼
POST /api/generate-portrait
       │
       ├── Fetch character from Supabase
       ├── Build SD prompt (auto or custom)
       ├── POST to ComfyUI /prompt (queue workflow)
       ├── Poll ComfyUI /history/{id} until complete
       ├── Fetch image bytes from /view endpoint
       ├── Convert to base64 data URL
       └── UPDATE characters SET avatar_url = base64 WHERE id = characterId
```

---

## Privacy and Security

- **Local AI** — All Ollama generation runs on your machine; no content sent to external APIs
- **Local Image Generation** — ComfyUI runs locally; no images uploaded externally
- **Self-Hosted Option** — Supabase can be self-hosted on your own PostgreSQL
- **No Analytics** — No telemetry or usage tracking of any kind
- **Uncensored Mode** — `OLLAMA_UNRESTRICTED_MODE=true` removes content filters; you take full responsibility for all generated content; use in accordance with applicable laws

---

## Mobile Access

Access the app from any device on your local network.

### Setup

1. **Find your PC's local IP:**

   ```powershell
   ipconfig
   # Look for "IPv4 Address" under your active network adapter
   # Usually 192.168.x.x or 10.0.x.x
   ```

2. **Update `.env.local`** if Ollama needs to be reached from another device:

   ```env
   OLLAMA_API_URL=http://192.168.1.100:11434
   ```

3. **Start Next.js with network binding:**

   ```bash
   npm run dev -- --hostname 0.0.0.0
   ```

4. **Open on mobile:** `http://192.168.1.100:3000`

### Windows Firewall

Add inbound rules for the following TCP ports:

| Port  | Service            |
| ----- | ------------------ |
| 3000  | Next.js dev server |
| 11434 | Ollama             |
| 8188  | ComfyUI            |

Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule → Port → TCP → enter port number.

---

## Troubleshooting

### Ollama

| Problem                                     | Fix                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------- |
| Connection refused                          | Run `ollama serve`; check `OLLAMA_API_URL` in `.env.local`            |
| Model not found                             | `ollama pull <model-name>`; verify with `ollama list`                 |
| AI generates plot synopsis instead of prose | Ensure Strict mode is selected; check latest `lib/ollama.ts`          |
| AI invents characters                       | Strict mode CHARACTER RULE forbids this; verify strict mode is `true` |

### ComfyUI / Portrait Generation

| Problem                       | Fix                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `WinError 127 c10_cuda.dll`   | Mixed PyTorch versions; see [ComfyUI Installation](#5-set-up-comfyui-portrait-generation) |
| Portrait button has no effect | Verify ComfyUI is running at `http://localhost:8188`; check browser console               |
| `SD_MODEL not found`          | Filename in `SD_MODEL` must exactly match file in `models/checkpoints/`                   |
| Out of VRAM                   | Close other GPU apps (games, NVIDIA Broadcast); consider a lower-res model                |
| Slow generation               | ~20–40s on RTX 3060 is normal; first generation takes longer (model load)                 |

### Supabase

| Problem                        | Fix                                                           |
| ------------------------------ | ------------------------------------------------------------- |
| Connection error               | Verify keys in `.env.local`; check Supabase project is active |
| `story_memory` table not found | Run `005_story_memory.sql` in Supabase SQL Editor             |
| Other table not found          | Ensure all four migration files have been run in order        |

### Build

| Problem           | Fix                                   |
| ----------------- | ------------------------------------- |
| TypeScript errors | `npx tsc --noEmit` to see all         |
| Build fails       | Ensure Node.js 18+ (`node --version`) |
| ESLint warnings   | `npm run lint`                        |

---

## License

This project is open source and available under the MIT License.

---

_Built with [Next.js](https://nextjs.org/) · [Material UI](https://mui.com/) · [Supabase](https://supabase.com/) · [Ollama](https://ollama.ai/) · [ComfyUI](https://github.com/comfyanonymous/ComfyUI)_
