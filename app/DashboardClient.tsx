"use client";

import { DashboardData } from "@/lib/domain/types";
import KpiCards from "@/components/dashboard/KpiCards";
import DashboardTable from "@/components/dashboard/DashboardTable";

export default function DashboardClient({ data }: { data: DashboardData | null }) {
  if (!data) {
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
        <h2 className="text-lg sm:text-xl font-semibold text-white truncate">{data.season.name}</h2>
      </div>
      <KpiCards cards={data.kpiCards} />
      <DashboardTable players={data.players} />
    </div>
  );
}
