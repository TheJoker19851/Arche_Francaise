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
  const stmts: Array<string | { sql: string; args: (string | number)[] }> = [
    {
      sql: "INSERT INTO fights (id, season_id, against, fight_date, notes) VALUES (?, ?, ?, ?, ?)",
      args: [fight.id, fight.seasonId, fight.against, fight.fightDate, fight.notes || ""],
    },
  ];

  for (const entry of entries) {
    stmts.push({
      sql: "INSERT INTO fight_entries (id, fight_id, player_id, level_at_fight, damage, shields_broken) VALUES (?, ?, ?, ?, ?, ?)",
      args: [entry.id, entry.fightId, entry.playerId, entry.levelAtFight, entry.damage, entry.shieldsBroken],
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
  const stmts: Array<string | { sql: string; args: (string | number)[] }> = [
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
      sql: "INSERT INTO fight_entries (id, fight_id, player_id, level_at_fight, damage, shields_broken) VALUES (?, ?, ?, ?, ?, ?)",
      args: [entry.id, entry.fightId, entry.playerId, entry.levelAtFight, entry.damage, entry.shieldsBroken],
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
  await db.execute({
    sql: "INSERT INTO players (id, name, is_active) VALUES (?, ?, ?)",
    args: [player.id, player.name, player.isActive ? 1 : 0],
  });
}

export async function addPlayerToSeason(playerId: string, name: string, seasonId: string, startLevel: number): Promise<void> {
  await init();
  const db = getDb();
  await db.batch([
    {
      sql: "INSERT OR IGNORE INTO players (id, name, is_active) VALUES (?, ?, 1)",
      args: [playerId, name],
    },
    {
      sql: "INSERT INTO season_players (id, season_id, player_id, start_level) VALUES (?, ?, ?, ?)",
      args: [generateId(), seasonId, playerId, startLevel],
    },
  ], "write");
}

export async function findPlayerByName(name: string): Promise<Player | undefined> {
  await init();
  const db = getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM players WHERE LOWER(name) = LOWER(?) LIMIT 1",
    args: [name.trim()],
  });
  if (rs.rows.length === 0) return undefined;
  return rowToPlayer(rs.rows[0]);
}

export async function updatePlayer(player: Player): Promise<void> {
  await init();
  const db = getDb();
  await db.execute({
    sql: "UPDATE players SET name = ?, is_active = ? WHERE id = ?",
    args: [player.name, player.isActive ? 1 : 0, player.id],
  });
}

export async function seedData(): Promise<void> {
  await init();
  const db = getDb();
  const existing = await db.execute("SELECT COUNT(*) as cnt FROM seasons");
  if ((existing.rows[0].cnt as number) > 0) return;

  const stmts: Array<string | { sql: string; args: (string | number)[] }> = [];

  const players = [
    { id: "p1", name: "Israr", isActive: true },
    { id: "p2", name: "Kaizer", isActive: true },
    { id: "p3", name: "Luna", isActive: true },
    { id: "p4", name: "Shadow", isActive: true },
    { id: "p5", name: "Viper", isActive: true },
    { id: "p6", name: "Storm", isActive: true },
    { id: "p7", name: "Blaze", isActive: true },
    { id: "p8", name: "Frost", isActive: true },
  ];

  for (const p of players) {
    stmts.push({
      sql: "INSERT INTO players (id, name, is_active) VALUES (?, ?, ?)",
      args: [p.id, p.name, 1],
    });
  }

  stmts.push({
    sql: "INSERT INTO seasons (id, name, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)",
    args: ["s1", "Saison 1 — Avril 2026", "2026-04-01", "2026-04-30", 1],
  });

  const seasonPlayers = [
    { id: "sp1", seasonId: "s1", playerId: "p1", startLevel: 480 },
    { id: "sp2", seasonId: "s1", playerId: "p2", startLevel: 475 },
    { id: "sp3", seasonId: "s1", playerId: "p3", startLevel: 490 },
    { id: "sp4", seasonId: "s1", playerId: "p4", startLevel: 465 },
    { id: "sp5", seasonId: "s1", playerId: "p5", startLevel: 500 },
    { id: "sp6", seasonId: "s1", playerId: "p6", startLevel: 470 },
    { id: "sp7", seasonId: "s1", playerId: "p7", startLevel: 485 },
    { id: "sp8", seasonId: "s1", playerId: "p8", startLevel: 492 },
  ];

  for (const sp of seasonPlayers) {
    stmts.push({
      sql: "INSERT INTO season_players (id, season_id, player_id, start_level) VALUES (?, ?, ?, ?)",
      args: [sp.id, sp.seasonId, sp.playerId, sp.startLevel],
    });
  }

  const fights = [
    { id: "f1", seasonId: "s1", against: "iGerX 2", fightDate: "2026-04-05", notes: "Victoire écrasante" },
    { id: "f2", seasonId: "s1", against: "Legion FR", fightDate: "2026-04-08", notes: "" },
    { id: "f3", seasonId: "s1", against: "Shadow Guild", fightDate: "2026-04-11", notes: "" },
  ];

  for (const f of fights) {
    stmts.push({
      sql: "INSERT INTO fights (id, season_id, against, fight_date, notes) VALUES (?, ?, ?, ?, ?)",
      args: [f.id, f.seasonId, f.against, f.fightDate, f.notes],
    });
  }

  const fightEntries = [
    { id: "e1_1", fightId: "f1", playerId: "p1", levelAtFight: 483, damage: 465060, shieldsBroken: 12 },
    { id: "e1_2", fightId: "f1", playerId: "p2", levelAtFight: 478, damage: 398200, shieldsBroken: 8 },
    { id: "e1_3", fightId: "f1", playerId: "p3", levelAtFight: 493, damage: 520100, shieldsBroken: 15 },
    { id: "e1_4", fightId: "f1", playerId: "p4", levelAtFight: 468, damage: 310500, shieldsBroken: 5 },
    { id: "e1_5", fightId: "f1", playerId: "p5", levelAtFight: 503, damage: 580000, shieldsBroken: 18 },
    { id: "e1_6", fightId: "f1", playerId: "p6", levelAtFight: 472, damage: 290000, shieldsBroken: 3 },
    { id: "e1_7", fightId: "f1", playerId: "p7", levelAtFight: 487, damage: 410000, shieldsBroken: 10 },
    { id: "e1_8", fightId: "f1", playerId: "p8", levelAtFight: 494, damage: 475000, shieldsBroken: 14 },

    { id: "e2_1", fightId: "f2", playerId: "p1", levelAtFight: 485, damage: 510000, shieldsBroken: 14 },
    { id: "e2_2", fightId: "f2", playerId: "p2", levelAtFight: 480, damage: 420000, shieldsBroken: 9 },
    { id: "e2_3", fightId: "f2", playerId: "p3", levelAtFight: 495, damage: 535000, shieldsBroken: 16 },
    { id: "e2_4", fightId: "f2", playerId: "p4", levelAtFight: 470, damage: 345000, shieldsBroken: 7 },
    { id: "e2_5", fightId: "f2", playerId: "p5", levelAtFight: 505, damage: 610000, shieldsBroken: 20 },
    { id: "e2_6", fightId: "f2", playerId: "p7", levelAtFight: 489, damage: 440000, shieldsBroken: 11 },
    { id: "e2_7", fightId: "f2", playerId: "p8", levelAtFight: 496, damage: 490000, shieldsBroken: 13 },

    { id: "e3_1", fightId: "f3", playerId: "p1", levelAtFight: 487, damage: 465060, shieldsBroken: 0 },
    { id: "e3_2", fightId: "f3", playerId: "p3", levelAtFight: 497, damage: 570000, shieldsBroken: 17 },
    { id: "e3_3", fightId: "f3", playerId: "p4", levelAtFight: 472, damage: 380000, shieldsBroken: 8 },
    { id: "e3_4", fightId: "f3", playerId: "p5", levelAtFight: 507, damage: 625000, shieldsBroken: 22 },
    { id: "e3_5", fightId: "f3", playerId: "p6", levelAtFight: 474, damage: 305000, shieldsBroken: 4 },
    { id: "e3_6", fightId: "f3", playerId: "p7", levelAtFight: 491, damage: 455000, shieldsBroken: 12 },
    { id: "e3_7", fightId: "f3", playerId: "p8", levelAtFight: 498, damage: 500000, shieldsBroken: 15 },
  ];

  for (const e of fightEntries) {
    stmts.push({
      sql: "INSERT INTO fight_entries (id, fight_id, player_id, level_at_fight, damage, shields_broken) VALUES (?, ?, ?, ?, ?, ?)",
      args: [e.id, e.fightId, e.playerId, e.levelAtFight, e.damage, e.shieldsBroken],
    });
  }

  await db.batch(stmts, "write");
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
  };
}
