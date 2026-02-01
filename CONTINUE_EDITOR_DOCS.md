# Advanced Continue Story Editor - Feature Documentation

## Overview

The Advanced Continue Story Editor is a comprehensive, full-featured creative suite for AI-enhanced interactive storytelling. It provides writers with powerful tools to generate, revise, and manage story continuations without directly editing markdown files.

## Key Features

### 1. **In-Context Markers Support**
- Use `[ --- note ]` markers in your prompts to provide contextual instructions to the AI
- Example: `[ --- Make this scene intense ] Duke enters the room...`
- The AI respects these notes and never waters down content

### 2. **Character Role Selection**
- Select a character from your story to "play as" or focus on
- The AI will generate content from that character's perspective
- Dropdown populated with all characters from your story database

### 3. **Rich Text Editor**
- Edit AI-generated content in a beautiful, readable editor
- Georgia serif font with proper line spacing for comfortable reading
- No need to edit raw markdown files

### 4. **Previous Story Context**
- View recent story parts in an expandable accordion
- Shows last 3 parts with summaries
- Helps maintain continuity and context awareness

### 5. **Quick Prompt Templates**
- One-click access to common story continuation patterns:
  - Continue from cliffhanger
  - Describe character's reaction
  - Add dialogue scene
  - Describe setting
  - Plot twist

### 6. **Generation Progress Tracking**
- Real-time status updates during AI generation
- Progress bar showing active generation
- Display of detected context notes from your prompt

### 7. **Feedback & Revision System**
- Provide specific instructions to revise generated content
- Quick template buttons for common revision requests:
  - "Make the dialogue more natural"
  - "Add more descriptive details"
  - "Increase the tension in this scene"
  - "Make the character sound angrier"
  - "Add more emotional depth"
- Conversational, iterative revision process

### 8. **Generation History**
- View all previous generations for the current draft
- Each history entry shows:
  - Timestamp
  - Original prompt
  - Revision instructions (if any)
  - Generated content preview
- One-click restore to any previous version

### 9. **Side Notes & Tags**
- Add private author's notes to track creative decisions
- Tag continuations with labels like:
  - Draft, Needs Review, Important
  - Climax, Character Development, Plot Point
  - Romance, Conflict, Resolution
- Classify scene type:
  - Action, Dialogue, Description
  - Cliffhanger, Reversal, Revelation
  - Transition, Flashback, Emotional

### 10. **Branching System**
- Create alternative scenarios without losing current progress
- Named branches for exploring different story directions
- Each branch maintains its own side notes

### 11. **Draft Management**
- Save work as drafts before inserting into story
- Drafts include all metadata (tags, notes, scene type)
- List and manage all saved drafts

### 12. **Action Buttons**
- **Generate**: Create new story continuation
- **Retry**: Regenerate with the same prompt
- **Clear**: Clear current output
- **Save Draft**: Save current work without finalizing
- **Insert into Story**: Add continuation to main story as new part

## UI Layout

### Main Editor (Left Column)
- Previous story context viewer (collapsible)
- Large prompt input area with example text
- Character focus selector
- Generate/Retry/Clear action buttons
- Quick prompt templates
- Generation progress indicator
- Generated content editor (rich text)
- Feedback/revision panel (appears after generation)

### Sidebar Tools (Right Column)
- Side Notes & Tags panel
- Branching panel
- History panel (when draft exists)

## Usage Workflow

### Basic Story Continuation
1. Enter a prompt describing what should happen next
2. Optionally select a character to focus on
3. Click "Generate"
4. Edit the generated content as needed
5. Click "Insert into Story" to add it to your story

### Using In-Context Markers
```
[ --- Make Duke sound determined and angry ]
Duke confronts the villain in the abandoned warehouse...
```

### Revision Workflow
1. Generate initial content
2. Review the output
3. Provide specific feedback in the Feedback Panel
4. Click "Generate Revision"
5. The AI rewrites the content based on your instructions
6. Repeat as needed until satisfied

### Branching Workflow
1. Save your current work as a draft
2. Click "Create Branch" in the Branching panel
3. Name your branch (e.g., "Alternative ending")
4. Enter a prompt for the alternative scenario
5. Add optional side notes
6. The branch is saved separately from your main draft

### Draft Management
1. Work on a continuation
2. Click "Save Draft" to preserve it without finalizing
3. Add tags and notes to organize
4. Come back later to continue working or insert into story

## API Endpoints

The feature uses the `/api/continue` endpoint with the following actions:

- `generate`: Generate new story continuation
- `revise`: Revise existing draft with new instructions
- `save-draft`: Save current work as draft
- `get-history`: Retrieve generation history for a draft
- `branch`: Create alternative scenario branch
- `list-drafts`: Get all saved drafts
- `delete-draft`: Remove a draft

## Database Schema

### continuation_drafts
Stores non-finalized story parts with metadata:
- user_prompt, character_focus, generated_content
- revision_instructions, tags, side_notes, scene_type
- created_at, updated_at

### continuation_history
Tracks all generations for version control:
- draft_id, user_prompt, character_focus
- revision_instructions, generated_content
- created_at

### continuation_branches
Stores alternative scenarios:
- parent_draft_id, branch_name
- user_prompt, character_focus, generated_content
- side_notes, created_at

## Best Practices

1. **Use Context Markers Wisely**: Place `[ --- ]` markers at relevant points to guide the AI's understanding of tone, pacing, and content requirements.

2. **Be Specific in Revisions**: Instead of "make it better", try "add more sensory details about the environment" or "make the character's anger more subtle".

3. **Tag Everything**: Use tags to organize your continuations and make them easier to find later.

4. **Save Branches**: When exploring different directions, use branches instead of overwriting your main draft.

5. **Review History**: If a revision doesn't work out, you can always restore a previous version from history.

6. **Add Side Notes**: Document your creative decisions and intentions - your future self will thank you.

## Responsive Design

The editor is optimized for:
- Desktop: Full two-column layout with all features visible
- Tablet: Responsive grid that adapts to screen size
- Large screens: Extra space for comfortable editing

## Technical Implementation

- **Framework**: Next.js 16 with App Router
- **UI Library**: Material-UI v5
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Local LLM via Ollama
- **State Management**: React hooks (useState, useEffect)

## Future Enhancements

Potential additions for future versions:
- AI-powered suggestion prompts based on story context
- Multi-step feedback process with guided questions
- Save/restore entire creative sessions
- Export branches as separate story variants
- Collaborative editing features
- Mobile app version
