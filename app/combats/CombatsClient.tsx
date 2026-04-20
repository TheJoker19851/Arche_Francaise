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
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-white">Combats — {seasonName}</h2>
      </div>
      {fights.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-8 text-center text-gray-500">
          Aucun combat enregistré cette saison.
        </div>
      ) : (
        <CombatsList fights={fights} />
      )}
    </div>
  );
}

function CombatsList({ fights }: { fights: FightSummary[] }) {
  const [expandedFightId, setExpandedFightId] = useState<string | null>(null);

  function toggleExpand(fightId: string) {
    setExpandedFightId((prev) => (prev === fightId ? null : fightId));
  }

  return (
    <>
      <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
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
      </div>

      <div className="sm:hidden space-y-3">
        {fights.map((fight) => {
          const isExpanded = expandedFightId === fight.fightId;
          return (
            <div
              key={fight.fightId}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(fight.fightId)}
                className="w-full text-left px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-semibold text-white text-base">{fight.against}</div>
                    <div className="text-xs text-gray-500 tabular-nums mt-0.5">{formatDate(fight.fightDate)}</div>
                  </div>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded flex-shrink-0">
                    {fight.participants} joueur{fight.participants !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-800/50 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-[10px] text-gray-500 uppercase">DMG</div>
                    <div className="text-sm text-white font-semibold tabular-nums">{formatCompactNumber(fight.totalDamage)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-[10px] text-gray-500 uppercase">Bouclier</div>
                    <div className="text-sm text-white tabular-nums">{formatCompactNumber(fight.totalShields)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg px-2 py-1.5 text-center">
                    <div className="text-[10px] text-gray-500 uppercase">MVP</div>
                    <div className="text-sm text-yellow-400 font-medium truncate">{fight.mvpPlayerName}</div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-800/60 px-4 py-3">
                  <MobileFightDetails fight={fight} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
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
            <DesktopFightDetails fight={fight} />
          </td>
        </tr>
      )}
    </>
  );
}

function MobileFightDetails({ fight }: { fight: FightSummary }) {
  if (fight.entries.length === 0) {
    return <p className="text-gray-500 text-sm italic">Aucune donnée de joueur</p>;
  }

  return (
    <div>
      <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        Détail des joueurs
      </h4>
      <div className="space-y-2">
        {fight.entries.map((entry, idx) => (
          <div
            key={entry.playerId}
            className="bg-gray-800/40 rounded-lg px-3 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {idx === 0 && <span className="text-yellow-400 text-sm">★</span>}
              <span className="text-sm text-white font-medium truncate">{entry.playerName}</span>
              <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.wasPresentLive === true ? "bg-green-500" : "bg-red-500/60"}`} />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 text-xs">
              <span className="text-gray-400">Lv{entry.levelAtFight}</span>
              <span className="text-white tabular-nums font-semibold w-14 text-right">{formatCompactNumber(entry.damage)}</span>
              <span className="text-gray-400 tabular-nums w-12 text-right">{formatCompactNumber(entry.shieldsBroken)} SH</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopFightDetails({ fight }: { fight: FightSummary }) {
  if (fight.entries.length === 0) {
    return <p className="text-gray-500 text-sm italic">Aucune donnée de joueur</p>;
  }

  return (
    <div className="ml-6">
      <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        Détail des joueurs
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wider">
            <th className="text-left py-2 px-3 font-medium">Joueur</th>
            <th className="text-center py-2 px-3 font-medium">Live</th>
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
              <td className="py-2 px-3 text-center">
                <span className={`inline-block w-2 h-2 rounded-full ${entry.wasPresentLive === true ? "bg-green-500" : "bg-red-500/60"}`} />
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
  );
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
