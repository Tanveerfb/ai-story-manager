import { NextRequest, NextResponse } from 'next/server';
import { continueStory } from '@/lib/ollama';
import { getStoryParts, getCharacters } from '@/lib/supabase';
import { buildStoryContext } from '@/lib/contextBuilder';
import { supabase } from '@/lib/supabase';

// Helper to parse in-context markers [ --- ]
function parseContextMarkers(prompt: string): { cleanPrompt: string; contextNotes: string[] } {
  const markerRegex = /\[\s*---\s*([^\]]+)\]/g;
  const contextNotes: string[] = [];
  let match;
  
  while ((match = markerRegex.exec(prompt)) !== null) {
    contextNotes.push(match[1].trim());
  }
  
  const cleanPrompt = prompt.replace(markerRegex, '').trim();
  return { cleanPrompt, contextNotes };
}

// Build enhanced prompt with context markers and revision instructions
function buildEnhancedPrompt(
  context: string,
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null,
  contextNotes: string[]
): string {
  let prompt = context + '\n\n';
  
  if (characterFocus) {
    prompt += `=== FOCUS CHARACTER ===\n${characterFocus}\n\n`;
  }
  
  if (contextNotes.length > 0) {
    prompt += `=== AUTHOR'S CONTEXT NOTES ===\n`;
    contextNotes.forEach((note, idx) => {
      prompt += `${idx + 1}. ${note}\n`;
    });
    prompt += '\n';
  }
  
  if (revisionInstructions) {
    prompt += `=== REVISION INSTRUCTIONS ===\n${revisionInstructions}\n\n`;
  }
  
  prompt += `=== USER REQUEST ===\n${userPrompt}\n\n`;
  
  return prompt;
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
      maxTokens // Add max tokens parameter for generation control
    } = await request.json();

    // Handle different actions
    switch (action) {
      case 'generate':
        return await handleGenerate(userPrompt, characterFocus, revisionInstructions, model, generationStyle, maxTokens);
      
      case 'revise':
        return await handleRevise(draftId, revisionInstructions, model, generationStyle, maxTokens);
      
      case 'save-draft':
        return await handleSaveDraft(
          userPrompt, 
          characterFocus, 
          revisionInstructions, 
          tags, 
          sideNotes, 
          sceneType,
          generatedContent
        );
      
      case 'get-history':
        return await handleGetHistory(draftId);
      
      case 'branch':
        return await handleBranch(draftId, branchName, userPrompt, characterFocus, sideNotes, model, generationStyle, maxTokens);
      
      case 'list-drafts':
        return await handleListDrafts();
      
      case 'delete-draft':
        return await handleDeleteDraft(draftId);
      
      default:
        // Default to generate if no action specified
        return await handleGenerate(userPrompt, characterFocus, revisionInstructions, model, generationStyle, maxTokens);
    }
  } catch (error: any) {
    console.error('Continue API error:', error);
    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}

// Generate new continuation - returns data object instead of NextResponse
async function generateContinuation(
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null,
  model?: string,
  generationStyle: 'strict' | 'creative' = 'strict',
  maxTokens: number = 1500
): Promise<{ continuation: string; contextNotes: string[] }> {
  if (!userPrompt) {
    throw new Error('User prompt is required');
  }

  // Parse context markers from prompt
  const { cleanPrompt, contextNotes } = parseContextMarkers(userPrompt);

  // Fetch recent story parts (last 3)
  const allParts = await getStoryParts();
  const recentParts = allParts.slice(-3);

  // Fetch all characters
  const characters = await getCharacters();

  // Fetch relationships
  const { data: relationships } = await supabase
    .from('relationships')
    .select('*');

  // Build context
  const context = buildStoryContext(
    recentParts,
    characters,
    relationships || []
  );

  // Build enhanced prompt with all features
  const enhancedPrompt = buildEnhancedPrompt(
    context,
    cleanPrompt,
    characterFocus,
    revisionInstructions,
    contextNotes
  );

  // Generate continuation with optional model, generation style, and max tokens
  const continuation = await continueStory('', enhancedPrompt, model, generationStyle, maxTokens);

  return {
    continuation,
    contextNotes
  };
}

// Generate new continuation - HTTP handler
async function handleGenerate(
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null,
  model?: string,
  generationStyle: 'strict' | 'creative' = 'strict',
  maxTokens: number = 1500
) {
  try {
    const result = await generateContinuation(userPrompt, characterFocus, revisionInstructions, model, generationStyle, maxTokens);
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 400 }
    );
  }
}

// Revise existing draft with new instructions
async function handleRevise(
  draftId: string, 
  revisionInstructions: string, 
  model?: string,
  generationStyle: 'strict' | 'creative' = 'strict',
  maxTokens: number = 1500
) {
  if (!draftId || !revisionInstructions) {
    return NextResponse.json(
      { error: 'Draft ID and revision instructions are required' },
      { status: 400 }
    );
  }

  // Get the existing draft
  const { data: draft, error } = await supabase
    .from('continuation_drafts')
    .select('*')
    .eq('id', draftId)
    .single();

  if (error || !draft) {
    return NextResponse.json(
      { error: 'Draft not found' },
      { status: 404 }
    );
  }

  // Save current version to history
  await supabase.from('continuation_history').insert({
    draft_id: draftId,
    user_prompt: draft.user_prompt,
    character_focus: draft.character_focus,
    revision_instructions: draft.revision_instructions,
    generated_content: draft.generated_content
  });

  // Generate revised version with optional model, generation style, and max tokens
  try {
    const result = await generateContinuation(
      draft.user_prompt,
      draft.character_focus,
      revisionInstructions,
      model,
      generationStyle,
      maxTokens
    );
    
    // Update draft with new content
    await supabase
      .from('continuation_drafts')
      .update({
        generated_content: result.continuation,
        revision_instructions: revisionInstructions
      })
      .eq('id', draftId);

    return NextResponse.json({
      ...result,
      draftId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Revision failed' },
      { status: 500 }
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
  generatedContent?: string // Accept pre-generated content
) {
  let continuation = generatedContent;
  
  // Only generate if content not provided
  if (!continuation) {
    try {
      const result = await generateContinuation(userPrompt, characterFocus, revisionInstructions);
      continuation = result.continuation;
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Generation failed' },
        { status: 500 }
      );
    }
  }

  // Save to drafts table
  const { data: draft, error } = await supabase
    .from('continuation_drafts')
    .insert({
      user_prompt: userPrompt,
      character_focus: characterFocus,
      generated_content: continuation,
      revision_instructions: revisionInstructions,
      tags: tags || [],
      side_notes: sideNotes,
      scene_type: sceneType
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    draft,
    continuation
  });
}

// Get history for a draft
async function handleGetHistory(draftId: string) {
  if (!draftId) {
    return NextResponse.json(
      { error: 'Draft ID is required' },
      { status: 400 }
    );
  }

  const { data: history, error } = await supabase
    .from('continuation_history')
    .select('*')
    .eq('draft_id', draftId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
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
  generationStyle: 'strict' | 'creative' = 'strict',
  maxTokens: number = 1500
) {
  if (!parentDraftId || !branchName || !userPrompt) {
    return NextResponse.json(
      { error: 'Parent draft ID, branch name, and prompt are required' },
      { status: 400 }
    );
  }

  // Generate content for the branch with optional model, generation style, and max tokens
  let continuation: string;
  try {
    const result = await generateContinuation(userPrompt, characterFocus, null, model, generationStyle, maxTokens);
    continuation = result.continuation;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }

  // Save branch
  const { data: branch, error } = await supabase
    .from('continuation_branches')
    .insert({
      parent_draft_id: parentDraftId,
      branch_name: branchName,
      user_prompt: userPrompt,
      character_focus: characterFocus,
      generated_content: continuation,
      side_notes: sideNotes
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    branch,
    continuation
  });
}

// List all drafts
async function handleListDrafts() {
  const { data: drafts, error } = await supabase
    .from('continuation_drafts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }

  return NextResponse.json({ drafts });
}

// Delete a draft
async function handleDeleteDraft(draftId: string) {
  if (!draftId) {
    return NextResponse.json(
      { error: 'Draft ID is required' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('continuation_drafts')
    .delete()
    .eq('id', draftId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
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
  const draftId = searchParams.get('id');
  
  if (!draftId) {
    return NextResponse.json(
      { error: 'Draft ID is required' },
      { status: 400 }
    );
  }

  return handleDeleteDraft(draftId);
}
