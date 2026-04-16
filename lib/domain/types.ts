export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Player {
  id: string;
  name: string;
  isActive: boolean;
}

export interface SeasonPlayer {
  id: string;
  seasonId: string;
  playerId: string;
  startLevel: number;
}

export interface Fight {
  id: string;
  seasonId: string;
  against: string;
  fightDate: string;
  notes?: string;
}

export interface FightEntry {
  id: string;
  fightId: string;
  playerId: string;
  levelAtFight: number;
  damage: number;
  shieldsBroken: number;
}

export interface PlayerSeasonStats {
  playerId: string;
  playerName: string;
  currentLevel: number;
  levelGain: number;
  totalDamage: number;
  totalShields: number;
  fightsPlayed: number;
  fightDetails: PlayerFightDetail[];
}

export interface PlayerFightDetail {
  fightId: string;
  against: string;
  fightDate: string;
  damage: number;
  shieldsBroken: number;
  levelAtFight: number;
}

export interface FightSummary {
  fightId: string;
  against: string;
  fightDate: string;
  totalDamage: number;
  totalShields: number;
  participants: number;
  mvpPlayerName: string;
  entries: FightEntryDetail[];
}

export interface FightEntryDetail {
  playerId: string;
  playerName: string;
  levelAtFight: number;
  damage: number;
  shieldsBroken: number;
}

export interface DashboardData {
  season: Season;
  players: PlayerSeasonStats[];
  kpiCards: KpiCards;
}

export interface KpiCards {
  topDamage: { playerName: string; value: number };
  topShield: { playerName: string; value: number };
  topLevelGain: { playerName: string; value: number };
  totalFights: number;
  lastOpponent: string;
}
