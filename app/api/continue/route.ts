import { NextRequest, NextResponse } from "next/server";
import { continueStory } from "@/lib/ollama";
import { getStoryParts, getCharacters } from "@/lib/supabase";
import { buildStoryContext } from "@/lib/contextBuilder";
import { supabase } from "@/lib/supabase";

// Default generation settings
const DEFAULT_GENERATION_STYLE: "strict" | "creative" = "strict";
const DEFAULT_MAX_TOKENS = 600;

// Helper to parse in-context markers [ --- ]
function parseContextMarkers(prompt: string): {
  cleanPrompt: string;
  contextNotes: string[];
} {
  const markerRegex = /\[\s*---\s*([^\]]+)\]/g;
  const contextNotes: string[] = [];
  let match;

  while ((match = markerRegex.exec(prompt)) !== null) {
    contextNotes.push(match[1].trim());
  }

  const cleanPrompt = prompt.replace(markerRegex, "").trim();
  return { cleanPrompt, contextNotes };
}

// Build the user instruction block — context is passed separately to the AI
function buildUserInstruction(
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null,
  contextNotes: string[],
): string {
  let instruction = "";

  if (contextNotes.length > 0) {
    instruction += `AUTHOR'S SIDE NOTES:\n`;
    contextNotes.forEach((note, idx) => {
      instruction += `${idx + 1}. ${note}\n`;
    });
    instruction += "\n";
  }

  if (characterFocus) {
    instruction += `FOCUS CHARACTER: ${characterFocus}\n\n`;
  }

  if (revisionInstructions) {
    instruction += `REVISION: ${revisionInstructions}\n\n`;
  }

  instruction += userPrompt;
  return instruction.trim();
}

// POST /api/continue - Generate story continuation
export async function POST(request: NextRequest) {
  try {
    const {
      action,
      userPrompt,
      characterFocus,
      revisionInstructions,
      draftId,
      branchName,
      tags,
      sideNotes,
      sceneType,
      generatedContent, // Add this for pre-generated content
      model, // Add model parameter for AI model selection
      generationStyle, // Add generation style parameter ('strict' or 'creative')
      maxTokens, // Add max tokens parameter for generation control
      temperature, // Optional temperature override (null = use style default)
      worldId, // World filter
    } = await request.json();

    // Handle different actions
    switch (action) {
      case "generate":
        return await handleGenerate(
          userPrompt,
          characterFocus,
          revisionInstructions,
          model,
          generationStyle,
          maxTokens,
          worldId,
          temperature,
        );

      case "revise":
        return await handleRevise(
          draftId,
          revisionInstructions,
          model,
          generationStyle,
          maxTokens,
        );

      case "save-draft":
        return await handleSaveDraft(
          userPrompt,
          characterFocus,
          revisionInstructions,
          tags,
          sideNotes,
          sceneType,
          generatedContent,
        );

      case "get-history":
        return await handleGetHistory(draftId);

      case "branch":
        return await handleBranch(
          draftId,
          branchName,
          userPrompt,
          characterFocus,
          sideNotes,
          model,
          generationStyle,
          maxTokens,
        );

      case "list-drafts":
        return await handleListDrafts();

      case "delete-draft":
        return await handleDeleteDraft(draftId);

      default:
        // Default to generate if no action specified
        return await handleGenerate(
          userPrompt,
          characterFocus,
          revisionInstructions,
          model,
          generationStyle,
          maxTokens,
          worldId,
        );
    }
  } catch (error: any) {
    console.error("Continue API error:", error);
    return NextResponse.json(
      { error: error.message || "Operation failed" },
      { status: 500 },
    );
  }
}

// Generate new continuation - returns data object instead of NextResponse
async function generateContinuation(
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null,
  model?: string,
  generationStyle: "strict" | "creative" = DEFAULT_GENERATION_STYLE,
  maxTokens: number = DEFAULT_MAX_TOKENS,
  worldId?: string,
  temperature?: number | null,
): Promise<{ continuation: string; contextNotes: string[] }> {
  if (!userPrompt) {
    throw new Error("User prompt is required");
  }

  // Parse context markers from prompt
  const { cleanPrompt, contextNotes } = parseContextMarkers(userPrompt);

  // Fetch ALL story parts — smart selection based on count
  const allParts = await getStoryParts(undefined, worldId);

  // Fetch AI story memory (condensed summary of older parts)
  const { data: memoryRow } = await supabase
    .from("story_memory")
    .select("content, part_count")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  // Build parts for context:
  // - If memory exists: use memory + last 2 full parts
  // - If no memory and <= 6 parts: include all
  // - If no memory and > 6 parts: include last 5 full parts
  let contextParts: typeof allParts;
  let memoryPrefix = "";

  if (memoryRow?.content) {
    const memorizedCount = memoryRow.part_count || 0;
    contextParts = allParts.slice(-2); // last 2 full parts
    memoryPrefix = `=== STORY SO FAR (condensed memory of parts 1–${memorizedCount}) ===\n${memoryRow.content}\n\n`;
  } else {
    contextParts = allParts.length <= 6 ? allParts : allParts.slice(-5);
  }

  // Fetch all characters with full profiles
  const characters = await getCharacters(undefined, worldId);

  // Fetch relationships
  const { data: relationships } = await supabase
    .from("relationships")
    .select("*");

  // Build context — story parts + characters + relationships
  const storyContext =
    memoryPrefix +
    buildStoryContext(contextParts, characters, relationships || []);

  // Build the user instruction — only the authoring direction, no context duplication
  const userInstruction = buildUserInstruction(
    cleanPrompt,
    characterFocus,
    revisionInstructions,
    contextNotes,
  );

  // Build POV profile if user is playing as a character
  let playAsCharacterProfile: string | null = null;
  let otherCharacterProfiles: string | null = null;

  if (characterFocus && characters.length > 0) {
    const playedChar = characters.find(
      (c: any) => c.name.toLowerCase() === characterFocus.toLowerCase(),
    );

    if (playedChar) {
      const lines: string[] = [];
      lines.push(
        `Name: ${playedChar.name} (${playedChar.role || "character"})`,
      );
      if (playedChar.description)
        lines.push(`Appearance: ${playedChar.description}`);
      if (playedChar.personality)
        lines.push(`Personality: ${playedChar.personality}`);
      if (playedChar.behavior_notes)
        lines.push(`Behavior/Reactions: ${playedChar.behavior_notes}`);
      if (playedChar.speech_patterns)
        lines.push(`Speech Style: ${playedChar.speech_patterns}`);
      if (playedChar.dialogue_style)
        lines.push(`Dialogue Style: ${playedChar.dialogue_style}`);
      if (playedChar.vocabulary_level)
        lines.push(`Vocabulary: ${playedChar.vocabulary_level}`);
      if (playedChar.catchphrases?.length)
        lines.push(`Catchphrases: ${playedChar.catchphrases.join(", ")}`);
      if (playedChar.fears) lines.push(`Fears: ${playedChar.fears}`);
      if (playedChar.motivations)
        lines.push(`Motivations: ${playedChar.motivations}`);
      if (playedChar.background)
        lines.push(`Background: ${playedChar.background}`);
      playAsCharacterProfile = lines.join("\n");
    }

    // Other characters — used by AI to portray them accurately
    const others = characters.filter(
      (c: any) => c.name.toLowerCase() !== characterFocus.toLowerCase(),
    );

    if (others.length > 0) {
      otherCharacterProfiles = others
        .map((c: any) => {
          const parts: string[] = [`${c.name}:`];
          if (c.personality) parts.push(`  Personality: ${c.personality}`);
          if (c.behavior_notes) parts.push(`  Behavior: ${c.behavior_notes}`);
          if (c.speech_patterns) parts.push(`  Speech: ${c.speech_patterns}`);
          if (c.dialogue_style)
            parts.push(`  Dialogue Style: ${c.dialogue_style}`);
          if (c.vocabulary_level)
            parts.push(`  Vocabulary: ${c.vocabulary_level}`);
          if (c.catchphrases?.length)
            parts.push(`  Catchphrases: ${c.catchphrases.join(", ")}`);
          return parts.join("\n");
        })
        .join("\n\n");
    }
  }

  // Generate continuation — pass context and user instruction SEPARATELY
  // so ollama.ts can correctly detect opening scene vs continuation
  const continuation = await continueStory(
    storyContext,
    userInstruction,
    model,
    generationStyle,
    maxTokens,
    playAsCharacterProfile,
    otherCharacterProfiles,
    temperature,
  );

  return {
    continuation,
    contextNotes,
  };
}

// Generate new continuation - HTTP handler
async function handleGenerate(
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null,
  model?: string,
  generationStyle: "strict" | "creative" = DEFAULT_GENERATION_STYLE,
  maxTokens: number = DEFAULT_MAX_TOKENS,
  worldId?: string,
  temperature?: number | null,
) {
  try {
    const result = await generateContinuation(
      userPrompt,
      characterFocus,
      revisionInstructions,
      model,
      generationStyle,
      maxTokens,
      worldId,
      temperature,
    );
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 400 },
    );
  }
}

// Revise existing draft with new instructions
async function handleRevise(
  draftId: string,
  revisionInstructions: string,
  model?: string,
  generationStyle: "strict" | "creative" = DEFAULT_GENERATION_STYLE,
  maxTokens: number = DEFAULT_MAX_TOKENS,
) {
  if (!draftId || !revisionInstructions) {
    return NextResponse.json(
      { error: "Draft ID and revision instructions are required" },
      { status: 400 },
    );
  }

  // Get the existing draft
  const { data: draft, error } = await supabase
    .from("continuation_drafts")
    .select("*")
    .eq("id", draftId)
    .single();

  if (error || !draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  // Save current version to history
  await supabase.from("continuation_history").insert({
    draft_id: draftId,
    user_prompt: draft.user_prompt,
    character_focus: draft.character_focus,
    revision_instructions: draft.revision_instructions,
    generated_content: draft.generated_content,
  });

  // Generate revised version with optional model, generation style, and max tokens
  try {
    const result = await generateContinuation(
      draft.user_prompt,
      draft.character_focus,
      revisionInstructions,
      model,
      generationStyle,
      maxTokens,
    );

    // Update draft with new content
    await supabase
      .from("continuation_drafts")
      .update({
        generated_content: result.continuation,
        revision_instructions: revisionInstructions,
      })
      .eq("id", draftId);

    return NextResponse.json({
      ...result,
      draftId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Revision failed" },
      { status: 500 },
    );
  }
}

// Save as draft
async function handleSaveDraft(
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null,
  tags: string[] | null,
  sideNotes: string | null,
  sceneType: string | null,
  generatedContent?: string, // Accept pre-generated content
) {
  let continuation = generatedContent;

  // Only generate if content not provided
  if (!continuation) {
    try {
      const result = await generateContinuation(
        userPrompt,
        characterFocus,
        revisionInstructions,
        undefined,
        DEFAULT_GENERATION_STYLE,
        DEFAULT_MAX_TOKENS,
      );
      continuation = result.continuation;
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Generation failed" },
        { status: 500 },
      );
    }
  }

  // Save to drafts table
  const { data: draft, error } = await supabase
    .from("continuation_drafts")
    .insert({
      user_prompt: userPrompt,
      character_focus: characterFocus,
      generated_content: continuation,
      revision_instructions: revisionInstructions,
      tags: tags || [],
      side_notes: sideNotes,
      scene_type: sceneType,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save draft:", error);
    return NextResponse.json(
      { error: `Failed to save draft: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    draft,
    continuation,
  });
}

// Get history for a draft
async function handleGetHistory(draftId: string) {
  if (!draftId) {
    return NextResponse.json(
      { error: "Draft ID is required" },
      { status: 400 },
    );
  }

  const { data: history, error } = await supabase
    .from("continuation_history")
    .select("*")
    .eq("draft_id", draftId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }

  return NextResponse.json({ history });
}

// Create a branch/fork of a draft
async function handleBranch(
  parentDraftId: string,
  branchName: string,
  userPrompt: string,
  characterFocus: string | null,
  sideNotes: string | null,
  model?: string,
  generationStyle: "strict" | "creative" = DEFAULT_GENERATION_STYLE,
  maxTokens: number = DEFAULT_MAX_TOKENS,
) {
  if (!parentDraftId || !branchName || !userPrompt) {
    return NextResponse.json(
      { error: "Parent draft ID, branch name, and prompt are required" },
      { status: 400 },
    );
  }

  // Generate content for the branch with optional model, generation style, and max tokens
  let continuation: string;
  try {
    const result = await generateContinuation(
      userPrompt,
      characterFocus,
      null,
      model,
      generationStyle,
      maxTokens,
    );
    continuation = result.continuation;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 500 },
    );
  }

  // Save branch
  const { data: branch, error } = await supabase
    .from("continuation_branches")
    .insert({
      parent_draft_id: parentDraftId,
      branch_name: branchName,
      user_prompt: userPrompt,
      character_focus: characterFocus,
      generated_content: continuation,
      side_notes: sideNotes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    branch,
    continuation,
  });
}

// List all drafts
async function handleListDrafts() {
  const { data: drafts, error } = await supabase
    .from("continuation_drafts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 },
    );
  }

  return NextResponse.json({ drafts });
}

// Delete a draft
async function handleDeleteDraft(draftId: string) {
  if (!draftId) {
    return NextResponse.json(
      { error: "Draft ID is required" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("continuation_drafts")
    .delete()
    .eq("id", draftId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

// GET /api/continue - Get drafts list
export async function GET() {
  return handleListDrafts();
}

// DELETE /api/continue - Delete draft
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const draftId = searchParams.get("id");

  if (!draftId) {
    return NextResponse.json(
      { error: "Draft ID is required" },
      { status: 400 },
    );
  }

  return handleDeleteDraft(draftId);
}
