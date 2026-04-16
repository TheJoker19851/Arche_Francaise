import { NextResponse } from "next/server";
import { getActiveSeason, getPlayers, getSeasonPlayers, getFights, getAllFightEntries } from "@/lib/data/store";
import { computePlayerStats, computeKpiCards } from "@/lib/utils/calculations";

export async function GET() {
  const season = await getActiveSeason();
  if (!season) {
    return NextResponse.json({ season: null, players: [], kpiCards: null });
  }

  const [players, seasonPlayers, fights, fightEntries] = await Promise.all([
    getPlayers(),
    getSeasonPlayers(season.id),
    getFights(season.id),
    getAllFightEntries(season.id),
  ]);

  const playerStats = computePlayerStats(season, players, seasonPlayers, fights, fightEntries);
  const kpiCards = computeKpiCards(playerStats, fights);

  return NextResponse.json({
    season,
    players: playerStats,
    kpiCards,
  });
}
