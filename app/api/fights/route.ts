import { NextRequest, NextResponse } from "next/server";
import { getActiveSeason, getPlayers, getSeasonPlayers, addFight, addPlayerToSeason, generateId } from "@/lib/data/store";

export async function GET() {
  const season = await getActiveSeason();
  if (!season) {
    return NextResponse.json({ season: null, players: [] });
  }

  const [players, seasonPlayers] = await Promise.all([
    getPlayers(),
    getSeasonPlayers(season.id),
  ]);

  const result = seasonPlayers.map((sp) => {
    const player = players.find((p) => p.id === sp.playerId);
    return {
      playerId: sp.playerId,
      playerName: player?.name ?? "Inconnu",
      startLevel: sp.startLevel,
    };
  });

  return NextResponse.json({ season, players: result });
}

export async function POST(request: NextRequest) {
  try {
    const season = await getActiveSeason();
    if (!season) {
      return NextResponse.json({ error: "No active season" }, { status: 400 });
    }

    const body = await request.json();
    const { against, fightDate, notes, entries } = body as {
      against: string;
      fightDate: string;
      notes?: string;
      entries: { playerId?: string; playerName?: string; levelAtFight: number; damage: number; shieldsBroken: number; wasPresentLive?: true | null }[];
    };

    if (!against || !fightDate || !entries?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const seasonPlayers = await getSeasonPlayers(season.id);
    const seasonPlayerIds = new Set(seasonPlayers.map((sp) => sp.playerId));

    const resolvedEntries: { playerId: string; levelAtFight: number; damage: number; shieldsBroken: number; wasPresentLive: true | null }[] = [];

    for (const entry of entries) {
      if (!Number.isInteger(entry.damage) || entry.damage < 0) {
        return NextResponse.json({ error: "Damage must be a non-negative integer" }, { status: 400 });
      }
      if (!Number.isInteger(entry.shieldsBroken) || entry.shieldsBroken < 0) {
        return NextResponse.json({ error: "Shields must be a non-negative integer" }, { status: 400 });
      }
      if (!Number.isInteger(entry.levelAtFight) || entry.levelAtFight < 0) {
        return NextResponse.json({ error: "Level must be a non-negative integer" }, { status: 400 });
      }

      let playerId = entry.playerId ?? null;

      if (!playerId && entry.playerName) {
        playerId = await addPlayerToSeason(
          generateId(),
          entry.playerName,
          season.id,
          entry.levelAtFight
        );
        seasonPlayerIds.add(playerId);
      }

      if (!playerId) {
        return NextResponse.json({ error: "Entry missing playerId or playerName" }, { status: 400 });
      }

      resolvedEntries.push({
        playerId,
        levelAtFight: entry.levelAtFight,
        damage: entry.damage,
        shieldsBroken: entry.shieldsBroken,
        wasPresentLive: entry.wasPresentLive === true ? true : null,
      });
    }

    const fightId = generateId();
    const fight = {
      id: fightId,
      seasonId: season.id,
      against,
      fightDate,
      notes: notes || "",
    };

    const fightEntries = resolvedEntries.map((e) => ({
      id: generateId(),
      fightId,
      playerId: e.playerId,
      levelAtFight: e.levelAtFight,
      damage: e.damage,
      shieldsBroken: e.shieldsBroken,
      wasPresentLive: e.wasPresentLive,
    }));

    await addFight(fight, fightEntries);

    return NextResponse.json({ success: true, fightId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/fights] Error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
