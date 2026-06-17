# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@project-rules.md

## What this is

AI Story Manager v3 — local-first, AI-assisted story tool. **The author owns all creative output; the LLM is a formatter and memory system, never a co-author.** Full spec: `ai-story-manager-plan.md` — authoritative; read it before any architectural or feature work. `project-rules.md` (imported above) defines the global code standards this project follows strictly.

## Non-negotiable rules

- **LLM never adds to the story.** Prose formatter fixes grammar/flow only — never invents dialogue, actions, plot, or description. Every output sentence must trace to author input.
- **System prompts in `lib/llm/prompts.ts` are locked** — do not modify during feature work without explicit review.
- **All LLM calls go through Next.js API routes** (`app/api/llm/*`). The client never calls Ollama/LM Studio directly.
- **Story data is accessed only via API routes**, never from the client. Lives in `story-data/`.
- **Validate every LLM artifact response with Zod before writing.** Never overwrite fields marked `authorOverride: true`.

## Project-specific stack

Generic stack/standards live in `project-rules.md`. This project adds: **LLM = Ollama or LM Studio only** (OpenAI-compatible REST, local); **storage = filesystem JSON/MD, no DB for v1**; Framer Motion for animation.

## Gotchas

- MCP servers are configured in `.mcp.json` (Context7, shadcn, Firebase, Vercel, web-search, next-devtools). Use **Context7** for version-specific library docs before implementing (rules §1) — don't assume from training data.
- Build in batch order (plan §14); Batch 1 = LLM gateway + settings page.
