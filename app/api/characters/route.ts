import { NextRequest, NextResponse } from "next/server";
import {
  getCharacters,
  insertCharacter,
  getCharacterById,
  getStoryParts,
} from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { extractCharacterProfiles } from "@/lib/ollama";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const id = searchParams.get("id");
    const worldId = searchParams.get("world_id") || undefined;

    if (id) {
      const character = await getCharacterById(id);
      return NextResponse.json(character);
    }

    const characters = await getCharacters(role || undefined, worldId);
    return NextResponse.json(characters);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch characters" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const worldId = searchParams.get("world_id") || undefined;

    // Handle extraction from story parts
    if (action === "extract") {
      return await handleExtractFromStory(worldId);
    }

    // Handle adding a relationship between two characters
    if (action === "add-relationship") {
      const body = await request.json();
      const { character_1_id, character_2_id, relationship_type, description } =
        body;

      if (!character_1_id || !character_2_id) {
        return NextResponse.json(
          { error: "Both character IDs are required" },
          { status: 400 },
        );
      }

      // Check if relationship already exists (either direction)
      const { data: existing } = await supabase
        .from("relationships")
        .select("id")
        .or(
          `and(character_1_id.eq.${character_1_id},character_2_id.eq.${character_2_id}),and(character_1_id.eq.${character_2_id},character_2_id.eq.${character_1_id})`,
        )
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing relationship if new description is longer
        const { data, error } = await supabase
          .from("relationships")
          .update({
            relationship_type: relationship_type || undefined,
            description: description || undefined,
          })
          .eq("id", existing[0].id)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      const { data, error } = await supabase
        .from("relationships")
        .insert({
          character_1_id,
          character_2_id,
          relationship_type: relationship_type || "unknown",
          description: description || "",
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Handle deleting a relationship
    if (action === "delete-relationship") {
      const { searchParams: sp } = new URL(request.url);
      const relId = sp.get("id");
      if (!relId) {
        return NextResponse.json(
          { error: "Relationship ID is required" },
          { status: 400 },
        );
      }
      const { error } = await supabase
        .from("relationships")
        .delete()
        .eq("id", relId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Normal character creation
    const body = await request.json();
    const character = await insertCharacter(body);
    return NextResponse.json(character);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create character" },
      { status: 500 },
    );
  }
}

async function handleExtractFromStory(worldId?: string) {
  try {
    // Get ALL story parts — not just the last 5
    const storyParts = await getStoryParts(undefined, worldId);

    console.log(
      "📝 Story parts query - worldId:",
      worldId,
      "found:",
      storyParts.length,
    );
    if (storyParts.length > 0) {
      console.log("📝 First part preview:", {
        id: storyParts[0].id,
        part_number: storyParts[0].part_number,
        chapter_number: storyParts[0].chapter_number,
        contentLength: storyParts[0].content?.length || 0,
        contentPreview: storyParts[0].content?.substring(0, 100),
      });
    }

    if (storyParts.length === 0) {
      // Try without worldId as fallback
      if (worldId) {
        console.log("📝 No parts found with worldId, trying without filter...");
        const allParts = await getStoryParts();
        console.log("📝 Total parts without world filter:", allParts.length);
        if (allParts.length > 0) {
          // Use all parts if world-filtered query returned nothing
          return await processStoryParts(allParts);
        }
      }
      return NextResponse.json(
        { error: "No story parts found to extract from" },
        { status: 400 },
      );
    }

    return await processStoryParts(storyParts, worldId);
  } catch (error: any) {
    console.error("❌ Extract from story error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract characters" },
      { status: 500 },
    );
  }
}

async function processStoryParts(storyParts: any[], worldId?: string) {
  try {
    console.log(
      "📝 Processing",
      storyParts.length,
      "story parts for extraction",
    );

    // Get existing characters for context-aware extraction
    const existingCharacters = await getCharacters(undefined, worldId);
    const existingNames = existingCharacters.map((c: any) => c.name);
    console.log(
      "📝 Existing characters:",
      existingNames.join(", ") || "(none)",
    );

    // Accumulated character data across all parts — keyed by lowercase name
    const characterMap: Record<string, any> = {};

    // Process each story part individually for focused extraction
    for (const part of storyParts) {
      const content = part.content;
      if (!content || content.trim().length < 50) {
        console.log(
          `⏭️ Skipping Part ${part.part_number}, Chapter ${part.chapter_number}: content too short (${content?.length || 0} chars)`,
        );
        continue;
      }

      console.log(
        `🔍 Extracting from Part ${part.part_number}, Chapter ${part.chapter_number} (${content.length} chars)`,
      );

      const extracted = await extractCharacterProfiles(content, existingNames);

      console.log(
        `  → Found ${extracted.length} characters:`,
        extracted.map((c: any) => c.name).join(", "),
      );

      // Merge extracted info into the accumulated map
      for (const char of extracted) {
        const key = char.name.toLowerCase().trim();
        if (!characterMap[key]) {
          characterMap[key] = { ...char };
        } else {
          mergeCharacterData(characterMap[key], char);
        }
      }
    }

    const allExtracted = Object.values(characterMap);
    console.log(
      "👥 Total unique characters found:",
      allExtracted.length,
      allExtracted.map((c: any) => c.name).join(", "),
    );

    let newCharacters = 0;
    let updatedCharacters = 0;
    const existingNamesLower = existingCharacters.map((c: any) =>
      c.name.toLowerCase(),
    );

    for (const char of allExtracted) {
      const charNameLower = char.name.toLowerCase();

      if (existingNamesLower.includes(charNameLower)) {
        // Update existing character - merge all fields
        const existing = existingCharacters.find(
          (c: any) => c.name.toLowerCase() === charNameLower,
        );

        const updatePayload = buildUpdatePayload(existing, char);
        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from("characters")
            .update(updatePayload)
            .eq("id", existing.id);
          updatedCharacters++;
        }
      } else {
        // Create new character with all available fields
        await insertCharacter({
          name: char.name,
          role: char.role || "side",
          personality: char.personality || null,
          traits: char.traits?.length ? char.traits : [],
          physical_traits: char.physical_traits?.length
            ? char.physical_traits
            : [],
          description: char.description || null,
          background: char.background || null,
          goals: char.goals || null,
          behavior_notes: char.behavior_notes || null,
          speech_patterns: char.speech_patterns || null,
          fears: char.fears || null,
          motivations: char.motivations || null,
          arc_notes: char.arc_notes || null,
          dialogue_style: char.dialogue_style || null,
          vocabulary_level: char.vocabulary_level || null,
          catchphrases: char.catchphrases?.length ? char.catchphrases : [],
        });

        newCharacters++;
      }
    }

    return NextResponse.json({
      newCharacters,
      updatedCharacters,
      totalExtracted: allExtracted.length,
      extractedNames: allExtracted.map((c: any) => c.name),
      message:
        allExtracted.length === 0
          ? "No characters found in the story parts. Try adding more story content with named characters."
          : undefined,
    });
  } catch (error: any) {
    console.error("❌ processStoryParts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract characters" },
      { status: 500 },
    );
  }
}

/** Merge new extraction data into an accumulated character record */
function mergeCharacterData(existing: any, incoming: any) {
  // For text fields: keep the longer/richer value, or append new info
  const textFields = [
    "personality",
    "description",
    "background",
    "goals",
    "behavior_notes",
    "speech_patterns",
    "fears",
    "motivations",
    "arc_notes",
    "dialogue_style",
    "vocabulary_level",
  ];

  for (const field of textFields) {
    if (!incoming[field]) continue;
    if (!existing[field]) {
      existing[field] = incoming[field];
    } else if (
      incoming[field] !== existing[field] &&
      !existing[field].toLowerCase().includes(incoming[field].toLowerCase())
    ) {
      // Append new info, separated by semicolon
      existing[field] = `${existing[field]}; ${incoming[field]}`;
    }
  }

  // For array fields: merge and deduplicate
  const arrayFields = ["traits", "physical_traits", "catchphrases"];
  for (const field of arrayFields) {
    if (!incoming[field] || !Array.isArray(incoming[field])) continue;
    if (!existing[field] || !Array.isArray(existing[field])) {
      existing[field] = [...incoming[field]];
    } else {
      const existingLower = new Set(
        existing[field].map((t: string) => t.toLowerCase()),
      );
      for (const item of incoming[field]) {
        if (!existingLower.has(item.toLowerCase())) {
          existing[field].push(item);
        }
      }
    }
  }

  // Role: prefer more important role (main > side > minor > bg)
  const rolePriority: Record<string, number> = {
    main: 4,
    side: 3,
    minor: 2,
    bg: 1,
  };
  if (
    incoming.role &&
    (rolePriority[incoming.role] || 0) > (rolePriority[existing.role] || 0)
  ) {
    existing.role = incoming.role;
  }
}

/** Build Supabase update payload by merging existing DB record with new extraction */
function buildUpdatePayload(
  dbRecord: any,
  extracted: any,
): Record<string, any> {
  const payload: Record<string, any> = {};

  // Text fields: if extracted has longer/different content, use it
  const textFields = [
    "personality",
    "description",
    "background",
    "goals",
    "behavior_notes",
    "speech_patterns",
    "fears",
    "motivations",
    "arc_notes",
    "dialogue_style",
    "vocabulary_level",
  ];

  for (const field of textFields) {
    if (!extracted[field]) continue;

    const dbVal = dbRecord[field];
    if (!dbVal || (typeof dbVal === "string" && dbVal.trim() === "")) {
      payload[field] = extracted[field];
    } else if (
      typeof dbVal === "string" &&
      extracted[field] !== dbVal &&
      !dbVal.toLowerCase().includes(extracted[field].toLowerCase())
    ) {
      // Append new observations
      payload[field] = `${dbVal}; ${extracted[field]}`;
    }
  }

  // Array fields: merge and deduplicate
  const arrayFields = [
    { name: "traits", type: "text[]" },
    { name: "physical_traits", type: "jsonb" },
    { name: "catchphrases", type: "text[]" },
  ];

  for (const { name } of arrayFields) {
    if (
      !extracted[name] ||
      !Array.isArray(extracted[name]) ||
      extracted[name].length === 0
    )
      continue;

    const dbArr = Array.isArray(dbRecord[name]) ? dbRecord[name] : [];
    const dbLower = new Set(dbArr.map((t: string) => t.toLowerCase()));
    const merged = [...dbArr];
    let changed = false;

    for (const item of extracted[name]) {
      if (!dbLower.has(item.toLowerCase())) {
        merged.push(item);
        changed = true;
      }
    }

    if (changed) {
      payload[name] = merged;
    }
  }

  // Role: upgrade if extracted has higher role
  const rolePriority: Record<string, number> = {
    main: 4,
    side: 3,
    minor: 2,
    bg: 1,
  };
  if (
    extracted.role &&
    (rolePriority[extracted.role] || 0) > (rolePriority[dbRecord.role] || 0)
  ) {
    payload.role = extracted.role;
  }

  return payload;
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Character ID is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("characters")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update character" },
      { status: 500 },
    );
  }
}
