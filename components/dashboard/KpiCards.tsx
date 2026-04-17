"use client";

import { KpiCards as KpiCardsType } from "@/lib/domain/types";
import { formatCompactNumber } from "@/lib/utils/format";

export default function KpiCards({ cards }: { cards: KpiCardsType }) {
  const items = [
    { label: "Top Damage", value: `${cards.topDamage.playerName} — ${formatCompactNumber(cards.topDamage.value)}`, accent: "text-red-400" },
    { label: "Top Shield", value: `${cards.topShield.playerName} — ${formatCompactNumber(cards.topShield.value)}`, accent: "text-blue-400" },
    { label: "+Level record", value: `${cards.topLevelGain.playerName} — +${cards.topLevelGain.value}`, accent: "text-green-400" },
    { label: "Combats", value: cards.totalFights.toString(), accent: "text-yellow-400" },
    { label: "Dernier adversaire", value: cards.lastOpponent, accent: "text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
        >
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {item.label}
          </div>
          <div className={`text-sm font-semibold ${item.accent}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
