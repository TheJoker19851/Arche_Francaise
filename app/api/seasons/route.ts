import { NextRequest, NextResponse } from "next/server";
import { getSeasons, getPlayers, addSeason, setActiveSeason, generateId } from "@/lib/data/store";

export async function GET() {
  const [seasons, players] = await Promise.all([getSeasons(), getPlayers()]);
  return NextResponse.json({ seasons, players });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, startDate, endDate, playerStartLevels } = body as {
    name: string;
    startDate: string;
    endDate: string;
    playerStartLevels: { playerId: string; startLevel: number }[];
  };

  if (!name || !startDate || !endDate || !playerStartLevels?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const seasonId = generateId();
  const season = {
    id: seasonId,
    name,
    startDate,
    endDate,
    isActive: true,
  };

  const seasonPlayers = playerStartLevels.map((p) => ({
    id: generateId(),
    seasonId,
    playerId: p.playerId,
    startLevel: p.startLevel,
  }));

  await addSeason(season, seasonPlayers);

  return NextResponse.json({ success: true, seasonId });
}

export async function PUT(request: NextRequest) {
  const { seasonId } = await request.json();
  if (!seasonId) {
    return NextResponse.json({ error: "Missing seasonId" }, { status: 400 });
  }
  await setActiveSeason(seasonId);
  return NextResponse.json({ success: true });
}
