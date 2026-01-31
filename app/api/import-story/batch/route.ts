import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import mammoth from "mammoth";
import { extractEntities } from "@/lib/ollama";
import {
  insertStoryPart,
  insertCharacter,
  insertLocation,
  insertEvent,
  insertRelationship,
  insertTheme,
} from "@/lib/supabase";
import {
  cleanText,
  countWords,
  chunkText,
  mergeEntities,
  ExtractedEntities,
} from "@/lib/parsers";

interface FileProcessResult {
  success: boolean;
  fileName: string;
  partNumber: number;
  error?: string;
  extracted?: {
    characters: number;
    locations: number;
    events: number;
    relationships: number;
    themes: number;
  };
}

async function processFile(
  file: File,
  partNumber: number,
  skipExtraction: boolean,
): Promise<FileProcessResult> {
  let tempFilePath: string | null = null;

  try {
    // Check file extension
    const fileName = file.name.toLowerCase();
    const isDocx = fileName.endsWith(".docx");
    const isMarkdown =
      fileName.endsWith(".md") || fileName.endsWith(".markdown");
    const isText = fileName.endsWith(".txt");

    if (!isDocx && !isMarkdown && !isText) {
      return {
        success: false,
        fileName: file.name,
        partNumber,
        error: "Only .docx, .md, .markdown, and .txt files are supported",
      };
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = isDocx ? ".docx" : isText ? ".txt" : ".md";
    tempFilePath = join(tmpdir(), `upload-${Date.now()}${fileExtension}`);
    await writeFile(tempFilePath, buffer);

    // Parse based on file type
    let rawText: string;

    if (isDocx) {
      const result = await mammoth.extractRawText({ path: tempFilePath });
      rawText = result.value;
    } else {
      rawText = await readFile(tempFilePath, "utf-8");
    }

    const cleanedText = cleanText(rawText);
    const wordCount = countWords(cleanedText);

    const fileType = isDocx ? "DOCX" : isText ? "TXT" : "Markdown";
    console.log(
      `File ${file.name} parsed (${fileType}): ${wordCount} words`,
    );

    // Extract entities using AI with chunking for large files
    let entities: ExtractedEntities;

    if (skipExtraction) {
      console.log("Skipping entity extraction (user requested)");
      entities = {
        characters: [],
        locations: [],
        events: [],
        relationships: [],
        themes: [],
        summary: "",
      };
    } else {
      // Chunk the text for large files
      const chunks = chunkText(cleanedText, 5000);
      console.log(`Processing ${chunks.length} chunk(s) for ${file.name}...`);

      const allEntities = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(
          `[${Math.round(((i + 1) / chunks.length) * 100)}%] Processing chunk ${i + 1}/${chunks.length}...`,
        );

        try {
          const chunkEntities = await extractEntities(chunks[i]);
          allEntities.push(chunkEntities);

          // Add 1 second delay between chunks to let GPU reset
          if (i < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error: any) {
          console.error(`Failed chunk ${i + 1}:`, error.message);
          allEntities.push({
            characters: [],
            locations: [],
            events: [],
            relationships: [],
            themes: [],
          });
        }
      }

      // Merge and deduplicate entities
      console.log("Merging entities from all chunks...");
      entities = mergeEntities(allEntities);
    }

    // Save story part
    const storyPart = await insertStoryPart({
      part_number: partNumber,
      title: file.name.replace(/\.(docx|md|markdown|txt)$/i, ""),
      content: cleanedText,
      word_count: wordCount,
      summary: entities.summary || undefined,
    });

    // Save characters
    const savedCharacters = [];
    for (const char of entities.characters || []) {
      try {
        const saved = await insertCharacter({
          name: char.name,
          role: char.role || "side",
          description: char.description || null,
          personality: char.personality || null,
          physical_traits:
            char.traits && char.traits.length > 0
              ? JSON.stringify(char.traits)
              : null,
          goals: char.goals || null,
          arc: char.arc || null,
          backstory: char.backstory || null,
          first_appearance_part: partNumber,
        });
        savedCharacters.push(saved);
      } catch (error: any) {
        console.error(`Failed to save character ${char.name}:`, error);
      }
    }

    // Save locations
    const savedLocations = [];
    for (const loc of entities.locations || []) {
      try {
        const saved = await insertLocation({
          name: loc.name,
          description: loc.description || null,
          type: loc.type || "indoor",
          importance: "minor",
          atmosphere: loc.atmosphere || null,
          significance: loc.significance || null,
          first_mentioned_part: partNumber,
        });
        savedLocations.push(saved);
      } catch (error: any) {
        console.error(`Failed to save location ${loc.name}:`, error);
      }
    }

    // Save events
    const savedEvents = [];
    for (const event of entities.events || []) {
      try {
        const saved = await insertEvent({
          story_part_id: storyPart.id,
          event_type: "action",
          description: event.description,
          content: event.description,
          participants: event.participants || null,
          emotional_impact: event.emotional_impact || null,
          consequences: event.consequences || null,
          event_significance: event.significance || null,
          significance: 5,
        });
        savedEvents.push(saved);
      } catch (error: any) {
        console.error("Failed to save event:", error);
      }
    }

    // Save relationships
    const savedRelationships = [];
    for (const rel of entities.relationships || []) {
      try {
        const char1 = savedCharacters.find((c) => c.name === rel.character_1);
        const char2 = savedCharacters.find((c) => c.name === rel.character_2);

        if (char1 && char2) {
          const saved = await insertRelationship({
            character_1_id: char1.id,
            character_2_id: char2.id,
            relationship_type: rel.relationship_type,
            description: rel.description || null,
            dynamic: rel.dynamic || null,
            development: rel.development || null,
          });
          savedRelationships.push(saved);
        }
      } catch (error: any) {
        console.error("Failed to save relationship:", error);
      }
    }

    // Save themes
    const savedThemes = [];
    for (const theme of entities.themes || []) {
      try {
        const saved = await insertTheme({
          story_part_id: storyPart.id,
          theme: theme,
          description: null,
        });
        savedThemes.push(saved);
      } catch (error: any) {
        console.error("Failed to save theme:", error);
      }
    }

    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError: any) {
        console.warn("Failed to cleanup temporary file:", cleanupError.message);
      }
    }

    return {
      success: true,
      fileName: file.name,
      partNumber,
      extracted: {
        characters: savedCharacters.length,
        locations: savedLocations.length,
        events: savedEvents.length,
        relationships: savedRelationships.length,
        themes: savedThemes.length,
      },
    };
  } catch (error: any) {
    console.error(`Error processing ${file.name}:`, error);

    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError: any) {
        console.warn("Failed to cleanup temporary file:", cleanupError.message);
      }
    }

    return {
      success: false,
      fileName: file.name,
      partNumber,
      error: error.message || "Failed to process file",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const skipExtraction = formData.get("skipExtraction") === "true";
    const startingPartNumber =
      parseInt(formData.get("startingPartNumber") as string) || 1;

    // Collect all files
    const files: File[] = [];
    let fileIndex = 0;
    while (true) {
      const file = formData.get(`file_${fileIndex}`) as File;
      if (!file) break;
      files.push(file);
      fileIndex++;
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 },
      );
    }

    console.log(`Processing ${files.length} files in batch...`);

    // Process files sequentially
    const results: FileProcessResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const partNumber = startingPartNumber + i;

      console.log(
        `\n=== Processing file ${i + 1}/${files.length}: ${file.name} (Part ${partNumber}) ===`,
      );

      const result = await processFile(file, partNumber, skipExtraction);
      results.push(result);

      // Add 1 second delay between files for GPU stability
      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `\n=== Batch import completed: ${successCount} succeeded, ${failureCount} failed ===`,
    );

    return NextResponse.json({
      success: true,
      totalFiles: files.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error: any) {
    console.error("Batch import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process batch import" },
      { status: 500 },
    );
  }
}
