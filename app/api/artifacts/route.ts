import { NextResponse } from "next/server";
import { characterSchema } from "@/types/artifacts";
import type { ArtifactBundle } from "@/types/artifacts";
import {
  readCharacter,
  readCharacters,
  readFactions,
  readLastSynced,
  readLocations,
  readLore,
  readTimeline,
  writeCharacter,
} from "@/lib/fs/artifacts";

/** Read the full artifact bundle for the dashboard, and save manual edits. */
export async function GET() {
  try {
    const [characters, locations, timeline, factions, lore, lastSyncedAddition] =
      await Promise.all([
        readCharacters(),
        readLocations(),
        readTimeline(),
        readFactions(),
        readLore(),
        readLastSynced(),
      ]);
    const bundle: ArtifactBundle = {
      characters,
      locations,
      timeline,
      factions,
      lore,
      lastSyncedAddition,
    };
    return NextResponse.json(bundle);
  } catch (error) {
    console.error("[api/artifacts GET]", error);
    return NextResponse.json(
      { error: "Failed to read artifacts" },
      { status: 500 },
    );
  }
}

/**
 * Manual character edit (plan §11C). Forces authorOverride so background
 * extraction never overwrites the author's changes.
 */
export async function PUT(request: Request) {
  let parsed;
  try {
    parsed = characterSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid character" }, { status: 400 });
  }

  try {
    const existing = await readCharacter(parsed.slug);
    await writeCharacter({
      ...parsed,
      authorOverride: true,
      authorOverrideNote:
        parsed.authorOverrideNote ??
        existing?.authorOverrideNote ??
        "Edited by the author",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/artifacts PUT]", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
