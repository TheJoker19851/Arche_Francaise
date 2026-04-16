import { getActiveSeason, getPlayers, getFights, getAllFightEntries } from "@/lib/data/store";
import { computeFightSummary } from "@/lib/utils/calculations";
import { FightSummary } from "@/lib/domain/types";
import CombatsClient from "./CombatsClient";

export const dynamic = "force-dynamic";

export default async function CombatsPage() {
  const season = await getActiveSeason();
  let fights: FightSummary[] = [];

  if (season) {
    const [players, seasonFights, allEntries] = await Promise.all([
      getPlayers(),
      getFights(season.id),
      getAllFightEntries(season.id),
    ]);

    fights = seasonFights
      .map((f) => computeFightSummary(f, players, allEntries))
      .sort((a, b) => b.fightDate.localeCompare(a.fightDate));
  }

  return <CombatsClient seasonName={season?.name ?? null} fights={fights} />;
}
