export const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS seasons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  )`,

  `CREATE TABLE IF NOT EXISTS season_players (
    id TEXT PRIMARY KEY,
    season_id TEXT NOT NULL REFERENCES seasons(id),
    player_id TEXT NOT NULL REFERENCES players(id),
    start_level INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS fights (
    id TEXT PRIMARY KEY,
    season_id TEXT NOT NULL REFERENCES seasons(id),
    against TEXT NOT NULL,
    fight_date TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS fight_entries (
    id TEXT PRIMARY KEY,
    fight_id TEXT NOT NULL REFERENCES fights(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id),
    level_at_fight INTEGER NOT NULL DEFAULT 0,
    damage INTEGER NOT NULL DEFAULT 0,
    shields_broken INTEGER NOT NULL DEFAULT 0
  )`,
];

export async function ensureSchema(db: ReturnType<typeof import("./db")["getDb"]>) {
  await db.migrate(SCHEMA_SQL);
}
