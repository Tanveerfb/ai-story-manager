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

async function parseFormData(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const partNumber = parseInt(formData.get("partNumber") as string) || 1;
  const title = (formData.get("title") as string) || "";
  const skipExtraction = formData.get("skipExtraction") === "true";

  return { file, partNumber, title, skipExtraction };
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const { file, partNumber, title, skipExtraction } =
      await parseFormData(request);

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const isDocx = fileName.endsWith(".docx");
    const isMarkdown =
      fileName.endsWith(".md") || fileName.endsWith(".markdown");
    const isText = fileName.endsWith(".txt");
    const isGdoc = fileName.endsWith(".gdoc");

    if (!isDocx && !isMarkdown && !isText && !isGdoc) {
      return NextResponse.json(
        {
          error:
            "Only .docx, .md, .markdown, .txt, and .gdoc files are supported",
        },
        { status: 400 },
      );
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = isDocx
      ? ".docx"
      : isGdoc
        ? ".json"
        : isText
          ? ".txt"
          : ".md";
    tempFilePath = join(tmpdir(), `upload-${Date.now()}${fileExtension}`);
    await writeFile(tempFilePath, buffer);

    // Parse based on file type
    let rawText: string;

    if (isDocx) {
      // Parse DOCX
      const result = await mammoth.extractRawText({ path: tempFilePath });
      rawText = result.value;
    } else if (isGdoc) {
      // Parse Google Doc shortcut file - try to read as JSON or text
      try {
        const fileContent = await readFile(tempFilePath, "utf-8");
        // Try to parse as JSON first (gdoc files are often JSON)
        try {
          const gdocData = JSON.parse(fileContent);
          // If it's a gdoc shortcut, it might have a url property
          if (gdocData.url) {
            return NextResponse.json(
              {
                error:
                  ".gdoc files are shortcuts. Please export your Google Doc as .docx, .md, or .txt and upload that instead.",
              },
              { status: 400 },
            );
          }
          rawText = fileContent; // Use the raw JSON as text if needed
        } catch {
          // Not JSON, treat as plain text
          rawText = fileContent;
        }
      } catch (error: any) {
        return NextResponse.json(
          {
            error:
              "Failed to read .gdoc file. Please export as .docx, .md, or .txt instead.",
          },
          { status: 400 },
        );
      }
    } else {
      // Parse Markdown/TXT - just read as text
      rawText = await readFile(tempFilePath, "utf-8");
    }

    const cleanedText = cleanText(rawText);
    const wordCount = countWords(cleanedText);

    const fileType = isDocx ? "DOCX" : isText ? "TXT" : "Markdown";
    console.log(`File parsed (${fileType}): ${wordCount} words`);

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
      // Chunk the text for large files (5000 words per chunk for detailed extraction)
      const chunks = chunkText(cleanedText, 8000);
      console.log(`Processing ${chunks.length} chunk(s)...`);

      // Extract entities from each chunk
      const allEntities = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(
          `[${Math.round(((i + 1) / chunks.length) * 100)}%] Processing chunk ${i + 1}/${chunks.length}...`,
        );

        try {
          const chunkEntities = await extractEntities(chunks[i]);
          allEntities.push(chunkEntities);
          console.log(
            `Chunk ${i + 1} extracted: ${chunkEntities.characters?.length || 0} characters, ${chunkEntities.locations?.length || 0} locations, ${chunkEntities.events?.length || 0} events`,
          );

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
      console.log(
        `Final results: ${entities.characters?.length || 0} characters, ${entities.locations?.length || 0} locations, ${entities.events?.length || 0} events, ${entities.relationships?.length || 0} relationships, ${entities.themes?.length || 0} themes`,
      );
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

    // Save characters with detailed fields
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
        console.log(`✓ Saved character: ${char.name}`);
      } catch (error: any) {
        errors.push(`Failed to save character ${char.name}: ${error.message}`);
        console.error(`✗ Failed to save character ${char.name}:`, error);
      }
    }

    // Save locations with detailed fields
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
        console.log(`✓ Saved location: ${loc.name}`);
      } catch (error: any) {
        errors.push(`Failed to save location ${loc.name}: ${error.message}`);
        console.error(`✗ Failed to save location ${loc.name}:`, error);
      }
    }

    // Save events with detailed fields
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
        console.log(`✓ Saved event`);
      } catch (error: any) {
        errors.push(`Failed to save event: ${error.message}`);
        console.error("✗ Failed to save event:", error);
      }
    }

    // Save relationships with detailed fields
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
            description: rel.description || null,
            dynamic: rel.dynamic || null,
            development: rel.development || null,
          });
          savedRelationships.push(saved);
          console.log(
            `✓ Saved relationship: ${rel.character_1} - ${rel.character_2}`,
          );
        } else {
          console.warn(
            `⚠ Skipped relationship: Characters not found (${rel.character_1}, ${rel.character_2})`,
          );
        }
      } catch (error: any) {
        errors.push(`Failed to save relationship: ${error.message}`);
        console.error("✗ Failed to save relationship:", error);
      }
    }

    // Save themes
    const savedThemes = [];
    for (const theme of entities.themes || []) {
      try {
        const saved = await insertTheme({
          story_part_id: storyPart.id,
          theme: theme,
          description: undefined,
        });
        savedThemes.push(saved);
        console.log(`✓ Saved theme: ${theme}`);
      } catch (error: any) {
        errors.push(`Failed to save theme: ${error.message}`);
        console.error("✗ Failed to save theme:", error);
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

    return NextResponse.json({
      success: true,
      storyPart,
      extracted: {
        characters: savedCharacters.length,
        locations: savedLocations.length,
        events: savedEvents.length,
        relationships: savedRelationships.length,
        themes: savedThemes.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Import error:", error);

    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError: any) {
        console.warn("Failed to cleanup temporary file:", cleanupError.message);
      }
    }

    return NextResponse.json(
      { error: error.message || "Failed to import story" },
      { status: 500 },
    );
  }
}
