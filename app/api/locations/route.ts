import { NextRequest, NextResponse } from "next/server";
import { getLocations, insertLocation, getStoryParts } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { extractEntities } from "@/lib/ollama";

export async function GET(request: NextRequest) {
  try {
    const locations = await getLocations();
    return NextResponse.json(locations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch locations" },
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

    // Normal location creation
    const body = await request.json();
    const location = await insertLocation(body);
    return NextResponse.json(location);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create location" },
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

    console.log(
      "📍 Extracting locations from",
      storyParts.length,
      "story parts",
    );
    console.log("📍 Content length:", combinedContent.length, "characters");

    // Extract entities using AI
    const entities = await extractEntities(combinedContent);

    console.log("🏛️ Found", entities.locations?.length || 0, "locations");

    let newLocations = 0;
    let updatedLocations = 0;

    // Get existing locations
    const existingLocations = await getLocations();
    const existingNames = existingLocations.map((l: any) =>
      l.name.toLowerCase(),
    );

    // Process extracted locations
    if (entities.locations && Array.isArray(entities.locations)) {
      for (const loc of entities.locations) {
        const locNameLower = loc.name.toLowerCase();

        if (existingNames.includes(locNameLower)) {
          // Update existing location
          const existing = existingLocations.find(
            (l: any) => l.name.toLowerCase() === locNameLower,
          );

          await supabase
            .from("locations")
            .update({
              description: loc.description || existing.description,
              atmosphere: loc.atmosphere || existing.atmosphere,
            })
            .eq("id", existing.id);

          updatedLocations++;
        } else {
          // Create new location
          await insertLocation({
            name: loc.name,
            description: loc.description || "",
            atmosphere: loc.atmosphere || "",
            type: "public", // Default type
            importance: "minor", // Default importance
          });

          newLocations++;
        }
      }
    }

    return NextResponse.json({
      newLocations,
      updatedLocations,
      totalExtracted: entities.locations?.length || 0,
      extractedNames: entities.locations?.map((l: any) => l.name) || [],
      message:
        entities.locations?.length === 0
          ? "No locations found in the story parts. The AI may need clearer location descriptions."
          : undefined,
    });
  } catch (error: any) {
    console.error("Extract from story error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract locations" },
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
        { error: "Location ID is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("locations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update location" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("locations").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete location" },
      { status: 500 },
    );
  }
}
