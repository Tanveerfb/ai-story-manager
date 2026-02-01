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
      sceneType
    } = await request.json();

    // Handle different actions
    switch (action) {
      case 'generate':
        return await handleGenerate(userPrompt, characterFocus, revisionInstructions);
      
      case 'revise':
        return await handleRevise(draftId, revisionInstructions);
      
      case 'save-draft':
        return await handleSaveDraft(userPrompt, characterFocus, revisionInstructions, tags, sideNotes, sceneType);
      
      case 'get-history':
        return await handleGetHistory(draftId);
      
      case 'branch':
        return await handleBranch(draftId, branchName, userPrompt, characterFocus, sideNotes);
      
      case 'list-drafts':
        return await handleListDrafts();
      
      case 'delete-draft':
        return await handleDeleteDraft(draftId);
      
      default:
        // Default to generate if no action specified
        return await handleGenerate(userPrompt, characterFocus, revisionInstructions);
    }
  } catch (error: any) {
    console.error('Continue API error:', error);
    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}

// Generate new continuation
async function handleGenerate(
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null
) {
  if (!userPrompt) {
    return NextResponse.json(
      { error: 'User prompt is required' },
      { status: 400 }
    );
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

  // Generate continuation
  const continuation = await continueStory(context, enhancedPrompt);

  return NextResponse.json({
    continuation,
    contextNotes,
    timestamp: new Date().toISOString()
  });
}

// Revise existing draft with new instructions
async function handleRevise(draftId: string, revisionInstructions: string) {
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

  // Generate revised version
  const result = await handleGenerate(
    draft.user_prompt,
    draft.character_focus,
    revisionInstructions
  );

  if (result.status === 200) {
    const body = await result.json();
    
    // Update draft with new content
    await supabase
      .from('continuation_drafts')
      .update({
        generated_content: body.continuation,
        revision_instructions: revisionInstructions
      })
      .eq('id', draftId);

    return NextResponse.json({
      ...body,
      draftId
    });
  }

  return result;
}

// Save as draft
async function handleSaveDraft(
  userPrompt: string,
  characterFocus: string | null,
  revisionInstructions: string | null,
  tags: string[] | null,
  sideNotes: string | null,
  sceneType: string | null
) {
  // First generate the content
  const generateResult = await handleGenerate(userPrompt, characterFocus, revisionInstructions);
  
  if (generateResult.status !== 200) {
    return generateResult;
  }

  const { continuation } = await generateResult.json();

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
  sideNotes: string | null
) {
  if (!parentDraftId || !branchName || !userPrompt) {
    return NextResponse.json(
      { error: 'Parent draft ID, branch name, and prompt are required' },
      { status: 400 }
    );
  }

  // Generate content for the branch
  const generateResult = await handleGenerate(userPrompt, characterFocus, null);
  
  if (generateResult.status !== 200) {
    return generateResult;
  }

  const { continuation } = await generateResult.json();

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
