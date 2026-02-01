import { NextRequest, NextResponse } from "next/server";
import {
  getCharacters,
  insertCharacter,
  getCharacterById,
  getStoryParts,
} from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { extractEntities } from "@/lib/ollama";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const id = searchParams.get("id");

    if (id) {
      const character = await getCharacterById(id);
      return NextResponse.json(character);
    }

    const characters = await getCharacters(role || undefined);
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

    // Handle extraction from story parts
    if (action === "extract") {
      return await handleExtractFromStory();
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

async function handleExtractFromStory() {
  try {
    // Get recent story parts
    const storyParts = await getStoryParts();

    if (storyParts.length === 0) {
      return NextResponse.json(
        { error: "No story parts found to extract from" },
        { status: 400 },
      );
    }

    // Combine content from story parts
    const combinedContent = storyParts
      .slice(-5) // Use last 5 parts
      .map((part: any) => part.content)
      .join("\n\n");

    console.log("📝 Extracting from", storyParts.length, "story parts");
    console.log("📝 Content length:", combinedContent.length, "characters");

    // Extract entities using AI
    const entities = await extractEntities(combinedContent);

    console.log("🔍 Extracted entities:", JSON.stringify(entities, null, 2));
    console.log("👥 Found", entities.characters?.length || 0, "characters");

    let newCharacters = 0;
    let updatedCharacters = 0;

    // Get existing characters
    const existingCharacters = await getCharacters();
    const existingNames = existingCharacters.map((c: any) =>
      c.name.toLowerCase(),
    );

    // Process extracted characters
    if (entities.characters && Array.isArray(entities.characters)) {
      for (const char of entities.characters) {
        const charNameLower = char.name.toLowerCase();

        if (existingNames.includes(charNameLower)) {
          // Update existing character
          const existing = existingCharacters.find(
            (c: any) => c.name.toLowerCase() === charNameLower,
          );

          await supabase
            .from("characters")
            .update({
              personality: char.personality || existing.personality,
              traits: char.traits || existing.traits,
              goals: char.goals || existing.goals,
              description: char.description || existing.description,
            })
            .eq("id", existing.id);

          updatedCharacters++;
        } else {
          // Create new character
          await insertCharacter({
            name: char.name,
            personality: char.personality || "",
            traits: char.traits || [],
            goals: char.goals || "",
            description: char.description || "",
            role: "side", // Default role
          });

          newCharacters++;
        }
      }
    }

    return NextResponse.json({
      newCharacters,
      updatedCharacters,
      totalExtracted: entities.characters?.length || 0,
      extractedNames: entities.characters?.map((c: any) => c.name) || [],
      message:
        entities.characters?.length === 0
          ? "No characters found in the story parts. The AI may need clearer character descriptions."
          : undefined,
    });
  } catch (error: any) {
    console.error("Extract from story error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract characters" },
      { status: 500 },
    );
  }
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
