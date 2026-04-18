import { Season, Player, SeasonPlayer, Fight, FightEntry } from "../domain/types";
import { getDb } from "./db";
import { ensureSchema } from "./schema";

let schemaInitialized = false;

async function init() {
  if (!schemaInitialized) {
    await ensureSchema(getDb());
    schemaInitialized = true;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function normalizeName(name: string): string {
  return name.trim();
}

export async function getActiveSeason(): Promise<Season | undefined> {
  await init();
  const db = getDb();
  const rs = await db.execute("SELECT * FROM seasons WHERE is_active = 1 LIMIT 1");
  if (rs.rows.length === 0) return undefined;
  return rowToSeason(rs.rows[0]);
}

export async function getSeasons(): Promise<Season[]> {
  await init();
  const db = getDb();
  const rs = await db.execute("SELECT * FROM seasons ORDER BY start_date DESC");
  return rs.rows.map(rowToSeason);
}

export async function getPlayers(): Promise<Player[]> {
  await init();
  const db = getDb();
  const rs = await db.execute("SELECT * FROM players ORDER BY name");
  return rs.rows.map(rowToPlayer);
}

export async function getSeasonPlayers(seasonId: string): Promise<SeasonPlayer[]> {
  await init();
  const db = getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM season_players WHERE season_id = ?",
    args: [seasonId],
  });
  return rs.rows.map(rowToSeasonPlayer);
}

export async function getFights(seasonId: string): Promise<Fight[]> {
  await init();
  const db = getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM fights WHERE season_id = ? ORDER BY fight_date DESC",
    args: [seasonId],
  });
  return rs.rows.map(rowToFight);
}

export async function getFightById(fightId: string): Promise<Fight | undefined> {
  await init();
  const db = getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM fights WHERE id = ?",
    args: [fightId],
  });
  if (rs.rows.length === 0) return undefined;
  return rowToFight(rs.rows[0]);
}

export async function getFightEntries(fightId: string): Promise<FightEntry[]> {
  await init();
  const db = getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM fight_entries WHERE fight_id = ?",
    args: [fightId],
  });
  return rs.rows.map(rowToFightEntry);
}

export async function getAllFightEntries(seasonId: string): Promise<FightEntry[]> {
  await init();
  const db = getDb();
  const rs = await db.execute({
    sql: `SELECT fe.* FROM fight_entries fe
          JOIN fights f ON fe.fight_id = f.id
          WHERE f.season_id = ?`,
    args: [seasonId],
  });
  return rs.rows.map(rowToFightEntry);
}

export async function getData() {
  const [seasons, players] = await Promise.all([
    getSeasons(),
    getPlayers(),
  ]);

  const allSeasonPlayers: SeasonPlayer[] = [];
  const allFights: Fight[] = [];
  const allFightEntries: FightEntry[] = [];

  for (const season of seasons) {
    const sp = await getSeasonPlayers(season.id);
    allSeasonPlayers.push(...sp);
    const fights = await getFights(season.id);
    allFights.push(...fights);
  }

  for (const fight of allFights) {
    const entries = await getFightEntries(fight.id);
    allFightEntries.push(...entries);
  }

  return { seasons, players, seasonPlayers: allSeasonPlayers, fights: allFights, fightEntries: allFightEntries };
}

export async function addFight(fight: Fight, entries: FightEntry[]): Promise<void> {
  await init();
  const db = getDb();
  const stmts: Array<string | { sql: string; args: (string | number | null)[] }> = [
    {
      sql: "INSERT INTO fights (id, season_id, against, fight_date, notes) VALUES (?, ?, ?, ?, ?)",
      args: [fight.id, fight.seasonId, fight.against, fight.fightDate, fight.notes || ""],
    },
  ];

  for (const entry of entries) {
    stmts.push({
      sql: "INSERT INTO fight_entries (id, fight_id, player_id, level_at_fight, damage, shields_broken, was_present_live) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [entry.id, entry.fightId, entry.playerId, entry.levelAtFight, entry.damage, entry.shieldsBroken, entry.wasPresentLive === true ? 1 : null],
    });
  }

  await db.batch(stmts, "write");
}

export async function updateFight(fight: Fight): Promise<void> {
  await init();
  const db = getDb();
  await db.execute({
    sql: "UPDATE fights SET season_id = ?, against = ?, fight_date = ?, notes = ? WHERE id = ?",
    args: [fight.seasonId, fight.against, fight.fightDate, fight.notes || "", fight.id],
  });
}

export async function deleteFight(fightId: string): Promise<void> {
  await init();
  const db = getDb();
  await db.batch([
    {
      sql: "DELETE FROM fight_entries WHERE fight_id = ?",
      args: [fightId],
    },
    {
      sql: "DELETE FROM fights WHERE id = ?",
      args: [fightId],
    },
  ], "write");
}

export async function updateFightEntry(entry: FightEntry): Promise<void> {
  await init();
  const db = getDb();
  await db.execute({
    sql: "UPDATE fight_entries SET player_id = ?, level_at_fight = ?, damage = ?, shields_broken = ? WHERE id = ?",
    args: [entry.playerId, entry.levelAtFight, entry.damage, entry.shieldsBroken, entry.id],
  });
}

export async function updateFightWithEntries(fight: Fight, entries: FightEntry[]): Promise<void> {
  await init();
  const db = getDb();
  const stmts: Array<string | { sql: string; args: (string | number | null)[] }> = [
    {
      sql: "UPDATE fights SET season_id = ?, against = ?, fight_date = ?, notes = ? WHERE id = ?",
      args: [fight.seasonId, fight.against, fight.fightDate, fight.notes || "", fight.id],
    },
    {
      sql: "DELETE FROM fight_entries WHERE fight_id = ?",
      args: [fight.id],
    },
  ];

  for (const entry of entries) {
    stmts.push({
      sql: "INSERT INTO fight_entries (id, fight_id, player_id, level_at_fight, damage, shields_broken, was_present_live) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [entry.id, entry.fightId, entry.playerId, entry.levelAtFight, entry.damage, entry.shieldsBroken, entry.wasPresentLive === true ? 1 : null],
    });
  }

  await db.batch(stmts, "write");
}

export async function setActiveSeason(seasonId: string): Promise<void> {
  await init();
  const db = getDb();
  await db.batch([
    "UPDATE seasons SET is_active = 0",
    {
      sql: "UPDATE seasons SET is_active = 1 WHERE id = ?",
      args: [seasonId],
    },
  ], "write");
}

export async function addSeason(season: Season, seasonPlayers: SeasonPlayer[]): Promise<void> {
  await init();
  const db = getDb();
  const stmts: Array<string | { sql: string; args: (string | number)[] }> = [
    "UPDATE seasons SET is_active = 0",
    {
      sql: "INSERT INTO seasons (id, name, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)",
      args: [season.id, season.name, season.startDate, season.endDate, 1],
    },
  ];

  for (const sp of seasonPlayers) {
    stmts.push({
      sql: "INSERT INTO season_players (id, season_id, player_id, start_level) VALUES (?, ?, ?, ?)",
      args: [sp.id, sp.seasonId, sp.playerId, sp.startLevel],
    });
  }

  await db.batch(stmts, "write");
}

export async function addPlayer(player: Player): Promise<void> {
  await init();
  const db = getDb();
  const existing = await findPlayerByName(player.name);
  if (existing) throw new Error(`Player "${player.name}" already exists`);
  await db.execute({
    sql: "INSERT INTO players (id, name, is_active) VALUES (?, ?, ?)",
    args: [player.id, normalizeName(player.name), player.isActive ? 1 : 0],
  });
}

export async function addPlayerToSeason(playerId: string, name: string, seasonId: string, startLevel: number): Promise<string> {
  await init();
  const db = getDb();
  const cleaned = normalizeName(name);
  const existing = await findPlayerByName(cleaned);
  const resolvedId = existing ? existing.id : playerId;

  if (!existing) {
    await db.execute({
      sql: "INSERT INTO players (id, name, is_active) VALUES (?, ?, 1)",
      args: [resolvedId, cleaned],
    });
  }

  const spCheck = await db.execute({
    sql: "SELECT id FROM season_players WHERE season_id = ? AND player_id = ?",
    args: [seasonId, resolvedId],
  });
  if (spCheck.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO season_players (id, season_id, player_id, start_level) VALUES (?, ?, ?, ?)",
      args: [generateId(), seasonId, resolvedId, startLevel],
    });
  }

  return resolvedId;
}

export async function findPlayerByName(name: string): Promise<Player | undefined> {
  await init();
  const db = getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM players WHERE LOWER(name) = LOWER(?) LIMIT 1",
    args: [normalizeName(name)],
  });
  if (rs.rows.length === 0) return undefined;
  return rowToPlayer(rs.rows[0]);
}

export async function updatePlayer(player: Player): Promise<void> {
  await init();
  const db = getDb();
  await db.execute({
    sql: "UPDATE players SET name = ?, is_active = ? WHERE id = ?",
    args: [normalizeName(player.name), player.isActive ? 1 : 0, player.id],
  });
}

function rowToSeason(row: Record<string, unknown>): Season {
  return {
    id: row.id as string,
    name: row.name as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    isActive: (row.is_active as number) === 1,
  };
}

function rowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    isActive: (row.is_active as number) === 1,
  };
}

function rowToSeasonPlayer(row: Record<string, unknown>): SeasonPlayer {
  return {
    id: row.id as string,
    seasonId: row.season_id as string,
    playerId: row.player_id as string,
    startLevel: row.start_level as number,
  };
}

function rowToFight(row: Record<string, unknown>): Fight {
  return {
    id: row.id as string,
    seasonId: row.season_id as string,
    against: row.against as string,
    fightDate: row.fight_date as string,
    notes: (row.notes as string) || "",
  };
}

function rowToFightEntry(row: Record<string, unknown>): FightEntry {
  return {
    id: row.id as string,
    fightId: row.fight_id as string,
    playerId: row.player_id as string,
    levelAtFight: row.level_at_fight as number,
    damage: row.damage as number,
    shieldsBroken: row.shields_broken as number,
    wasPresentLive: (row.was_present_live as number) === 1 ? true : null,
  };
}
