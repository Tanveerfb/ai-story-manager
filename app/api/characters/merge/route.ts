import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primaryCharacterId, duplicateCharacterIds } = body;

    if (!primaryCharacterId || !Array.isArray(duplicateCharacterIds)) {
      return NextResponse.json(
        { error: "Invalid request. primaryCharacterId and duplicateCharacterIds array required" },
        { status: 400 },
      );
    }

    if (duplicateCharacterIds.length === 0) {
      return NextResponse.json(
        { error: "At least one duplicate character ID is required" },
        { status: 400 },
      );
    }

    // Validate that primary character is not in the duplicates list
    if (duplicateCharacterIds.includes(primaryCharacterId)) {
      return NextResponse.json(
        { error: "Primary character cannot be in the duplicates list" },
        { status: 400 },
      );
    }

    // Fetch primary character
    const { data: primaryCharacter, error: primaryError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", primaryCharacterId)
      .single();

    if (primaryError || !primaryCharacter) {
      return NextResponse.json(
        { error: "Primary character not found" },
        { status: 404 },
      );
    }

    // Fetch duplicate characters
    const { data: duplicateCharacters, error: duplicatesError } = await supabase
      .from("characters")
      .select("*")
      .in("id", duplicateCharacterIds);

    if (duplicatesError || !duplicateCharacters || duplicateCharacters.length === 0) {
      return NextResponse.json(
        { error: "Duplicate characters not found" },
        { status: 404 },
      );
    }

    // Merge character data intelligently
    const mergedData: any = { ...primaryCharacter };

    for (const duplicate of duplicateCharacters) {
      // Take longest personality
      if (
        duplicate.personality &&
        (!mergedData.personality ||
          duplicate.personality.length > mergedData.personality.length)
      ) {
        mergedData.personality = duplicate.personality;
      }

      // Take longest description
      if (
        duplicate.description &&
        (!mergedData.description ||
          duplicate.description.length > mergedData.description.length)
      ) {
        mergedData.description = duplicate.description;
      }

      // Merge and deduplicate traits arrays
      if (duplicate.physical_traits) {
        try {
          const existingTraits = mergedData.physical_traits
            ? JSON.parse(mergedData.physical_traits)
            : [];
          const newTraits = JSON.parse(duplicate.physical_traits);

          const mergedTraits = Array.isArray(existingTraits) && Array.isArray(newTraits)
            ? [...new Set([...existingTraits, ...newTraits])]
            : existingTraits;

          mergedData.physical_traits = JSON.stringify(mergedTraits);
        } catch (e) {
          console.error("Failed to merge traits:", e);
        }
      }

      // Concatenate backstories
      if (duplicate.backstory) {
        mergedData.backstory = mergedData.backstory
          ? `${mergedData.backstory}\n\n${duplicate.backstory}`
          : duplicate.backstory;
      }

      // Take longest goals
      if (
        duplicate.goals &&
        (!mergedData.goals || duplicate.goals.length > mergedData.goals.length)
      ) {
        mergedData.goals = duplicate.goals;
      }

      // Take longest arc
      if (
        duplicate.arc &&
        (!mergedData.arc || duplicate.arc.length > mergedData.arc.length)
      ) {
        mergedData.arc = duplicate.arc;
      }
    }

    // Update primary character with merged data
    const { error: updateError } = await supabase
      .from("characters")
      .update({
        personality: mergedData.personality,
        description: mergedData.description,
        physical_traits: mergedData.physical_traits,
        backstory: mergedData.backstory,
        goals: mergedData.goals,
        arc: mergedData.arc,
      })
      .eq("id", primaryCharacterId);

    if (updateError) {
      console.error("Failed to update primary character:", updateError);
      return NextResponse.json(
        { error: "Failed to update primary character" },
        { status: 500 },
      );
    }

    // Update relationships - character_1_id
    const { error: rel1Error } = await supabase
      .from("relationships")
      .update({ character_1_id: primaryCharacterId })
      .in("character_1_id", duplicateCharacterIds);

    if (rel1Error) {
      console.error("Failed to update relationships (character_1_id):", rel1Error);
    }

    // Update relationships - character_2_id
    const { error: rel2Error } = await supabase
      .from("relationships")
      .update({ character_2_id: primaryCharacterId })
      .in("character_2_id", duplicateCharacterIds);

    if (rel2Error) {
      console.error("Failed to update relationships (character_2_id):", rel2Error);
    }

    // Record merge in history
    await supabase.from("merge_history").insert({
      entity_type: "character",
      primary_entity_id: primaryCharacterId,
      primary_entity_name: primaryCharacter.name,
      merged_entity_ids: duplicateCharacterIds,
      merged_entity_names: duplicateCharacters.map((c) => c.name),
    });

    // Delete duplicate characters
    const { error: deleteError } = await supabase
      .from("characters")
      .delete()
      .in("id", duplicateCharacterIds);

    if (deleteError) {
      console.error("Failed to delete duplicate characters:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete duplicate characters" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${duplicateCharacters.length} character(s) into ${primaryCharacter.name}`,
      primaryCharacterId,
      mergedCount: duplicateCharacters.length,
    });
  } catch (error: any) {
    console.error("Character merge error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to merge characters" },
      { status: 500 },
    );
  }
}
