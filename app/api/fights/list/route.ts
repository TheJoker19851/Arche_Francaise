import { NextResponse } from "next/server";
import { getActiveSeason, getPlayers, getFights, getAllFightEntries } from "@/lib/data/store";
import { computeFightSummary } from "@/lib/utils/calculations";

export async function GET() {
  const season = await getActiveSeason();
  if (!season) {
    return NextResponse.json([]);
  }

  const [players, fights, allEntries] = await Promise.all([
    getPlayers(),
    getFights(season.id),
    getAllFightEntries(season.id),
  ]);

  const summaries = fights
    .map((f) => computeFightSummary(f, players, allEntries))
    .sort((a, b) => b.fightDate.localeCompare(a.fightDate));

  return NextResponse.json(summaries);
}
