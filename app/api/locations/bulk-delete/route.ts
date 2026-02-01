import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST - Bulk delete multiple locations
 */
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "An array of location IDs is required" },
        { status: 400 },
      );
    }

    // Delete all locations with the given IDs
    const { error } = await supabase.from("locations").delete().in("id", ids);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedCount: ids.length,
      message: `Successfully deleted ${ids.length} location(s)`,
    });
  } catch (error: any) {
    console.error("Error bulk deleting locations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to bulk delete locations" },
      { status: 500 },
    );
  }
}
