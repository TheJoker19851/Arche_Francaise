import { DashboardData } from "@/lib/domain/types";
import { getActiveSeason, getPlayers, getSeasonPlayers, getFights, getAllFightEntries } from "@/lib/data/store";
import { computePlayerStats, computeKpiCards } from "@/lib/utils/calculations";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const season = await getActiveSeason();
  let data: DashboardData | null = null;

  if (season) {
    const [players, seasonPlayers, fights, fightEntries] = await Promise.all([
      getPlayers(),
      getSeasonPlayers(season.id),
      getFights(season.id),
      getAllFightEntries(season.id),
    ]);

    const playerStats = computePlayerStats(season, players, seasonPlayers, fights, fightEntries);
    const kpiCards = computeKpiCards(playerStats, fights);

    data = { season, players: playerStats, kpiCards };
  }

  return <DashboardClient data={data} />;
}
