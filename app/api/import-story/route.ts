import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import mammoth from 'mammoth';
import { extractEntities } from '@/lib/ollama';
import { insertStoryPart, insertCharacter, insertLocation, insertEvent, insertRelationship } from '@/lib/supabase';
import { cleanText, countWords, chunkText, mergeEntities, ExtractedEntities } from '@/lib/parsers';

async function parseFormData(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const partNumber = parseInt(formData.get('partNumber') as string) || 1;
  const title = formData.get('title') as string || '';
  const skipExtraction = formData.get('skipExtraction') === 'true';

  return { file, partNumber, title, skipExtraction };
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const { file, partNumber, title, skipExtraction } = await parseFormData(request);

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Only .docx files are supported' },
        { status: 400 }
      );
    }

    // Save file temporarily - use OS-specific temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tempFilePath = join(tmpdir(), `upload-${Date.now()}.docx`);
    await writeFile(tempFilePath, buffer);

    // Parse DOCX
    const result = await mammoth.extractRawText({ path: tempFilePath });
    const rawText = result.value;
    const cleanedText = cleanText(rawText);
    const wordCount = countWords(cleanedText);

    console.log(`File parsed: ${wordCount} words`);

    // Extract entities using AI with chunking for large files
    let entities: ExtractedEntities;
    
    if (skipExtraction) {
      console.log('Skipping entity extraction (user requested)');
      entities = {
        characters: [],
        locations: [],
        events: [],
        relationships: [],
        summary: '',
      };
    } else {
      // Chunk the text for large files (6000 words per chunk, safe for 4096 token context)
      const chunks = chunkText(cleanedText, 6000);
      console.log(`Processing ${chunks.length} chunk(s)...`);

      // Extract entities from each chunk
      const allEntities: ExtractedEntities[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const progress = Math.round(((i + 1) / chunks.length) * 100);
        console.log(`[${progress}%] Processing chunk ${i + 1}/${chunks.length}...`);
        
        try {
          const chunkEntities = await extractEntities(chunks[i]);
          allEntities.push(chunkEntities);
          console.log(`Chunk ${i + 1} extracted: ${chunkEntities.characters?.length || 0} characters, ${chunkEntities.locations?.length || 0} locations`);
        } catch (error: any) {
          console.error(`Failed to process chunk ${i + 1}:`, error.message);
          // Continue with other chunks instead of failing completely
        }
      }

      // Merge and deduplicate entities
      console.log('Merging entities from all chunks...');
      entities = mergeEntities(allEntities);
      console.log(`Final results: ${entities.characters?.length || 0} characters, ${entities.locations?.length || 0} locations, ${entities.events?.length || 0} events, ${entities.relationships?.length || 0} relationships`);
    }

    // Save story part
    const storyPart = await insertStoryPart({
      part_number: partNumber,
      title: title || undefined,
      content: cleanedText,
      word_count: wordCount,
      summary: entities.summary || undefined,
    });

    // Track errors for better reporting
    const errors: string[] = [];

    // Save characters
    const savedCharacters = [];
    for (const char of entities.characters || []) {
      try {
        const saved = await insertCharacter({
          name: char.name,
          role: char.role || 'minor',
          description: char.description,
          personality: char.personality ? JSON.stringify(char.personality) : null,
          physical_traits: char.physical_traits ? JSON.stringify(char.physical_traits) : null,
          first_appearance_part: partNumber,
        });
        savedCharacters.push(saved);
      } catch (error: any) {
        errors.push(`Failed to save character ${char.name}: ${error.message}`);
        console.error(`Failed to save character ${char.name}:`, error);
      }
    }

    // Save locations
    const savedLocations = [];
    for (const loc of entities.locations || []) {
      try {
        const saved = await insertLocation({
          name: loc.name,
          description: loc.description,
          type: loc.type || 'indoor',
          importance: 'minor',
          first_mentioned_part: partNumber,
        });
        savedLocations.push(saved);
      } catch (error: any) {
        errors.push(`Failed to save location ${loc.name}: ${error.message}`);
        console.error(`Failed to save location ${loc.name}:`, error);
      }
    }

    // Save events
    const savedEvents = [];
    for (const event of entities.events || []) {
      try {
        const saved = await insertEvent({
          story_part_id: storyPart.id,
          event_type: event.event_type || 'action',
          description: event.description,
          content: event.content,
          significance: 5,
        });
        savedEvents.push(saved);
      } catch (error: any) {
        errors.push(`Failed to save event: ${error.message}`);
        console.error('Failed to save event:', error);
      }
    }

    // Save relationships
    const savedRelationships = [];
    for (const rel of entities.relationships || []) {
      try {
        // Find character IDs by name
        const char1 = savedCharacters.find((c) => c.name === rel.character_1);
        const char2 = savedCharacters.find((c) => c.name === rel.character_2);

        if (char1 && char2) {
          const saved = await insertRelationship({
            character_1_id: char1.id,
            character_2_id: char2.id,
            relationship_type: rel.relationship_type,
            description: rel.description,
          });
          savedRelationships.push(saved);
        }
      } catch (error: any) {
        errors.push(`Failed to save relationship: ${error.message}`);
        console.error('Failed to save relationship:', error);
      }
    }

    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError: any) {
        console.warn('Failed to cleanup temporary file:', cleanupError.message);
      }
    }

    return NextResponse.json({
      success: true,
      storyPart,
      extracted: {
        characters: savedCharacters.length,
        locations: savedLocations.length,
        events: savedEvents.length,
        relationships: savedRelationships.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Import error:', error);

    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError: any) {
        console.warn('Failed to cleanup temporary file:', cleanupError.message);
      }
    }

    return NextResponse.json(
      { error: error.message || 'Failed to import story' },
      { status: 500 }
    );
  }
}
