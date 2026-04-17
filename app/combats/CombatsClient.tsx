"use client";

import { FightSummary } from "@/lib/domain/types";
import { formatCompactNumber } from "@/lib/utils/format";
import { useState } from "react";

export default function CombatsClient({
  seasonName,
  fights,
}: {
  seasonName: string | null;
  fights: FightSummary[];
}) {
  if (!seasonName) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-gray-400">Aucune saison active</h2>
        <p className="text-gray-500 mt-2">Créez une saison depuis l&apos;admin pour commencer.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Combats — {seasonName}</h2>
      </div>
      {fights.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-8 text-center text-gray-500">
          Aucun combat enregistré cette saison.
        </div>
      ) : (
        <CombatsTable fights={fights} />
      )}
    </div>
  );
}

function CombatsTable({ fights }: { fights: FightSummary[] }) {
  const [expandedFightId, setExpandedFightId] = useState<string | null>(null);

  function toggleExpand(fightId: string) {
    setExpandedFightId((prev) => (prev === fightId ? null : fightId));
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4 font-medium">Adversaire</th>
              <th className="text-left py-3 px-4 font-medium">Date</th>
              <th className="text-right py-3 px-4 font-medium">Total Damage</th>
              <th className="text-right py-3 px-4 font-medium">Total Bouclier</th>
              <th className="text-right py-3 px-4 font-medium">Participants</th>
              <th className="text-left py-3 px-4 font-medium">MVP</th>
            </tr>
          </thead>
          <tbody>
            {fights.map((fight) => {
              const isExpanded = expandedFightId === fight.fightId;
              return (
                <FightRow
                  key={fight.fightId}
                  fight={fight}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpand(fight.fightId)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y divide-gray-800/60">
        {fights.map((fight) => {
          const isExpanded = expandedFightId === fight.fightId;
          return (
            <div key={fight.fightId}>
              <button
                onClick={() => toggleExpand(fight.fightId)}
                className="w-full text-left px-4 py-3 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white text-sm">{fight.against}</span>
                  <span className="text-gray-500 text-xs tabular-nums">{formatDate(fight.fightDate)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-white tabular-nums">{formatCompactNumber(fight.totalDamage)} DMG</span>
                  <span className="text-gray-400 tabular-nums">{formatCompactNumber(fight.totalShields)} SH</span>
                  <span className="text-yellow-400">★ {fight.mvpPlayerName}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3">
                  <ExpandedFightDetails fight={fight} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FightRow({
  fight,
  isExpanded,
  onToggle,
}: {
  fight: FightSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer transition-colors border-t border-gray-800/60 hover:bg-gray-800/40"
      >
        <td className="py-3 px-4 font-medium text-white">{fight.against}</td>
        <td className="py-3 px-4 tabular-nums">{formatDate(fight.fightDate)}</td>
        <td className="py-3 px-4 text-right tabular-nums font-semibold">
          {formatCompactNumber(fight.totalDamage)}
        </td>
        <td className="py-3 px-4 text-right tabular-nums">
          {formatCompactNumber(fight.totalShields)}
        </td>
        <td className="py-3 px-4 text-right tabular-nums">{fight.participants}</td>
        <td className="py-3 px-4 text-yellow-400 font-medium">{fight.mvpPlayerName}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-800/30 border-t border-gray-800/60">
          <td colSpan={6} className="px-4 py-3">
            <ExpandedFightDetails fight={fight} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedFightDetails({ fight }: { fight: FightSummary }) {
  if (fight.entries.length === 0) {
    return <p className="text-gray-500 text-sm italic">Aucune donnée de joueur</p>;
  }

  return (
    <div className="sm:ml-6">
      <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        Détail des joueurs
      </h4>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[350px]">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left py-2 px-3 font-medium">Joueur</th>
              <th className="text-right py-2 px-3 font-medium">Level</th>
              <th className="text-right py-2 px-3 font-medium">Damage</th>
              <th className="text-right py-2 px-3 font-medium">Bouclier</th>
            </tr>
          </thead>
          <tbody>
            {fight.entries.map((entry, idx) => (
              <tr key={entry.playerId} className="border-t border-gray-800/40 hover:bg-gray-800/20">
                <td className="py-2 px-3 font-medium">
                  {idx === 0 && <span className="text-yellow-400 mr-1">★</span>}
                  {entry.playerName}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">{entry.levelAtFight}</td>
                <td className="py-2 px-3 text-right tabular-nums font-semibold">
                  {formatCompactNumber(entry.damage)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatCompactNumber(entry.shieldsBroken)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
