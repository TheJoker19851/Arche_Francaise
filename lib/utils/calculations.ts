import {
  Season,
  Player,
  SeasonPlayer,
  Fight,
  FightEntry,
  PlayerSeasonStats,
  PlayerFightDetail,
  FightSummary,
  FightEntryDetail,
  KpiCards,
} from "../domain/types";

export function computePlayerStats(
  season: Season,
  players: Player[],
  seasonPlayers: SeasonPlayer[],
  fights: Fight[],
  fightEntries: FightEntry[]
): PlayerSeasonStats[] {
  const seasonFights = fights.filter((f) => f.seasonId === season.id);
  const seasonFightIds = new Set(seasonFights.map((f) => f.id));
  const seasonEntries = fightEntries.filter((e) => seasonFightIds.has(e.fightId));
  const seasonPlayerMap = new Map(seasonPlayers.map((sp) => [sp.playerId, sp]));
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const activeSeasonPlayerIds = seasonPlayers.map((sp) => sp.playerId);

  return activeSeasonPlayerIds.map((playerId) => {
    const player = playerMap.get(playerId)!;
    const sp = seasonPlayerMap.get(playerId)!;
    const playerEntries = seasonEntries.filter((e) => e.playerId === playerId);

    const totalDamage = playerEntries.reduce((sum, e) => sum + e.damage, 0);
    const totalShields = playerEntries.reduce((sum, e) => sum + e.shieldsBroken, 0);
    const fightsPlayed = playerEntries.length;

    const lastEntry = playerEntries.length > 0
      ? playerEntries.reduce((latest, e) => {
          const fight = seasonFights.find((f) => f.id === e.fightId)!;
          const currentLatest = seasonFights.find((f) => f.id === latest.fightId)!;
          return fight.fightDate > currentLatest.fightDate ? e : latest;
        })
      : null;

    const currentLevel = lastEntry ? lastEntry.levelAtFight : sp.startLevel;
    const levelGain = currentLevel - sp.startLevel;

    const fightDetails: PlayerFightDetail[] = playerEntries.map((e) => {
      const fight = seasonFights.find((f) => f.id === e.fightId)!;
      return {
        fightId: fight.id,
        against: fight.against,
        fightDate: fight.fightDate,
        damage: e.damage,
        shieldsBroken: e.shieldsBroken,
        levelAtFight: e.levelAtFight,
      };
    }).sort((a, b) => b.fightDate.localeCompare(a.fightDate));

    return {
      playerId,
      playerName: player.name,
      currentLevel,
      levelGain,
      totalDamage,
      totalShields,
      fightsPlayed,
      fightDetails,
    };
  }).sort((a, b) => b.totalDamage - a.totalDamage);
}

export function computeFightSummary(
  fight: Fight,
  players: Player[],
  fightEntries: FightEntry[]
): FightSummary {
  const entries = fightEntries.filter((e) => e.fightId === fight.id);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const entryDetails: FightEntryDetail[] = entries.map((e) => ({
    playerId: e.playerId,
    playerName: playerMap.get(e.playerId)?.name ?? "Inconnu",
    levelAtFight: e.levelAtFight,
    damage: e.damage,
    shieldsBroken: e.shieldsBroken,
  })).sort((a, b) => b.damage - a.damage);

  const totalDamage = entries.reduce((sum, e) => sum + e.damage, 0);
  const totalShields = entries.reduce((sum, e) => sum + e.shieldsBroken, 0);
  const mvp = entryDetails.length > 0 ? entryDetails[0].playerName : "-";

  return {
    fightId: fight.id,
    against: fight.against,
    fightDate: fight.fightDate,
    totalDamage,
    totalShields,
    participants: entries.length,
    mvpPlayerName: mvp,
    entries: entryDetails,
  };
}

export function computeKpiCards(playerStats: PlayerSeasonStats[], fights: Fight[]): KpiCards {
  const topDamage = playerStats.length > 0
    ? { playerName: playerStats[0].playerName, value: playerStats[0].totalDamage }
    : { playerName: "-", value: 0 };

  const sortedByShield = [...playerStats].sort((a, b) => b.totalShields - a.totalShields);
  const topShield = sortedByShield.length > 0
    ? { playerName: sortedByShield[0].playerName, value: sortedByShield[0].totalShields }
    : { playerName: "-", value: 0 };

  const sortedByLevelGain = [...playerStats].sort((a, b) => b.levelGain - a.levelGain);
  const topLevelGain = sortedByLevelGain.length > 0
    ? { playerName: sortedByLevelGain[0].playerName, value: sortedByLevelGain[0].levelGain }
    : { playerName: "-", value: 0 };

  const sortedFights = [...fights].sort((a, b) => b.fightDate.localeCompare(a.fightDate));
  const lastOpponent = sortedFights.length > 0 ? sortedFights[0].against : "-";

  return {
    topDamage,
    topShield,
    topLevelGain,
    totalFights: fights.length,
    lastOpponent,
  };
}
