"use client";

import { PlayerSeasonStats } from "@/lib/domain/types";
import { formatCompactNumber } from "@/lib/utils/format";
import { useState } from "react";

export default function DashboardTable({ players }: { players: PlayerSeasonStats[] }) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  function toggleExpand(playerId: string) {
    setExpandedPlayerId((prev) => (prev === playerId ? null : playerId));
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4 font-medium">#</th>
              <th className="text-left py-3 px-4 font-medium">Joueur</th>
              <th className="text-right py-3 px-4 font-medium">Level</th>
              <th className="text-right py-3 px-4 font-medium">+Level</th>
              <th className="text-right py-3 px-4 font-medium">DMG total</th>
              <th className="text-right py-3 px-4 font-medium">SH total</th>
              <th className="text-right py-3 px-4 font-medium">Fights</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => {
              const isTop3 = index < 3;
              const isExpanded = expandedPlayerId === player.playerId;
              const rankBadge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`;

              return (
                <PlayerRow
                  key={player.playerId}
                  player={player}
                  rank={rankBadge}
                  isTop3={isTop3}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpand(player.playerId)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y divide-gray-800/60">
        {players.map((player, index) => {
          const isExpanded = expandedPlayerId === player.playerId;
          const rankBadge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`;

          return (
            <div key={player.playerId}>
              <button
                onClick={() => toggleExpand(player.playerId)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-800/40 transition-colors"
              >
                <span className="text-base">{rankBadge}</span>
                <span className="font-medium text-white flex-1 truncate">{player.playerName}</span>
                <span className="text-xs text-green-400 tabular-nums">+{player.levelGain}</span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Level</div>
                      <div className="text-sm text-white tabular-nums">{player.currentLevel}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">DMG</div>
                      <div className="text-sm text-white tabular-nums font-semibold">{formatCompactNumber(player.totalDamage)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">SH</div>
                      <div className="text-sm text-white tabular-nums">{formatCompactNumber(player.totalShields)}</div>
                    </div>
                  </div>
                  <ExpandedPlayerDetails player={player} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  rank,
  isTop3,
  isExpanded,
  onToggle,
}: {
  player: PlayerSeasonStats;
  rank: string;
  isTop3: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors border-t border-gray-800/60 ${
          isTop3
            ? "bg-gray-800/40 hover:bg-gray-800/60"
            : indexOdd(player.playerId)
            ? "bg-gray-900/50 hover:bg-gray-800/40"
            : "hover:bg-gray-800/40"
        }`}
      >
        <td className="py-3 px-4 text-base">{rank}</td>
        <td className="py-3 px-4 font-medium text-white">{player.playerName}</td>
        <td className="py-3 px-4 text-right tabular-nums">{player.currentLevel}</td>
        <td className="py-3 px-4 text-right tabular-nums text-green-400">
          +{player.levelGain}
        </td>
        <td className="py-3 px-4 text-right tabular-nums font-semibold">
          {formatCompactNumber(player.totalDamage)}
        </td>
        <td className="py-3 px-4 text-right tabular-nums">
          {formatCompactNumber(player.totalShields)}
        </td>
        <td className="py-3 px-4 text-right tabular-nums">{player.fightsPlayed}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-800/30 border-t border-gray-800/60">
          <td colSpan={7} className="px-4 py-3">
            <ExpandedPlayerDetails player={player} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedPlayerDetails({ player }: { player: PlayerSeasonStats }) {
  if (player.fightDetails.length === 0) {
    return <p className="text-gray-500 text-sm italic">Aucun combat cette saison</p>;
  }

  return (
    <div className="sm:ml-6">
      <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        Historique des combats
      </h4>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left py-2 px-3 font-medium">Date</th>
              <th className="text-left py-2 px-3 font-medium">Adversaire</th>
              <th className="text-right py-2 px-3 font-medium">Damage</th>
              <th className="text-right py-2 px-3 font-medium">Bouclier</th>
              <th className="text-right py-2 px-3 font-medium">Level</th>
            </tr>
          </thead>
          <tbody>
            {player.fightDetails.map((fight) => (
              <tr key={fight.fightId} className="border-t border-gray-800/40 hover:bg-gray-800/20">
                <td className="py-2 px-3 tabular-nums">{fight.fightDate}</td>
                <td className="py-2 px-3">{fight.against}</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatCompactNumber(fight.damage)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatCompactNumber(fight.shieldsBroken)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">{fight.levelAtFight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function indexOdd(id: string): boolean {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 2 === 0;
}
