import { NextRequest, NextResponse } from "next/server";
import { getFightById, getPlayers, getFightEntries, updateFightWithEntries, deleteFight, generateId } from "@/lib/data/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fight = await getFightById(id);
  if (!fight) {
    return NextResponse.json({ error: "Fight not found" }, { status: 404 });
  }

  const [players, fightEntries] = await Promise.all([
    getPlayers(),
    getFightEntries(id),
  ]);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  return NextResponse.json({
    ...fight,
    entries: fightEntries.map((e) => ({
      ...e,
      playerName: playerMap.get(e.playerId)?.name ?? "Inconnu",
    })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { against, fightDate, notes, entries } = body as {
    against: string;
    fightDate: string;
    notes?: string;
    entries: { playerId: string; levelAtFight: number; damage: number; shieldsBroken: number; wasPresentLive?: true | null }[];
  };

  const fight = await getFightById(id);
  if (!fight) {
    return NextResponse.json({ error: "Fight not found" }, { status: 404 });
  }

  fight.against = against;
  fight.fightDate = fightDate;
  fight.notes = notes || "";

  const newEntries = entries.map((e) => ({
    id: generateId(),
    fightId: id,
    playerId: e.playerId,
    levelAtFight: e.levelAtFight,
    damage: e.damage,
    shieldsBroken: e.shieldsBroken,
    wasPresentLive: (e.wasPresentLive === true ? true : null) as true | null,
  }));

  await updateFightWithEntries(fight, newEntries);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteFight(id);
  return NextResponse.json({ success: true });
}
