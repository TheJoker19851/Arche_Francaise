"use client";

import { useState, useEffect } from "react";
import { FightSummary, FightEntryDetail } from "@/lib/domain/types";
import { formatCompactNumber } from "@/lib/utils/format";

async function fetchFightsData(setFights: (f: FightSummary[]) => void, setLoading: (l: boolean) => void) {
  setLoading(true);
  const res = await fetch("/api/fights/list");
  const json = await res.json();
  setFights(json);
  setLoading(false);
}

export default function FightEditor() {
  const [fights, setFights] = useState<FightSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFightId, setEditingFightId] = useState<string | null>(null);
  const [deletingFightId, setDeletingFightId] = useState<string | null>(null);

  useEffect(() => {
    fetchFightsData(setFights, setLoading);
  }, []);

  async function handleDelete(fightId: string) {
    await fetch(`/api/fights/${fightId}`, { method: "DELETE" });
    setDeletingFightId(null);
    fetchFightsData(setFights, setLoading);
  }

  function handleEditSaved() {
    setEditingFightId(null);
    fetchFightsData(setFights, setLoading);
  }

  if (loading) {
    return <div className="text-gray-500 text-sm">Chargement...</div>;
  }

  if (fights.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-8 text-center text-gray-500 text-sm">
        Aucun combat à éditer.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fights.map((fight) => {
        if (editingFightId === fight.fightId) {
          return (
            <EditFightForm
              key={fight.fightId}
              fightId={fight.fightId}
              onCancel={() => setEditingFightId(null)}
              onSaved={handleEditSaved}
            />
          );
        }

        return (
          <div
            key={fight.fightId}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <span className="font-medium text-white text-sm truncate">{fight.against}</span>
                <span className="text-gray-500 text-sm tabular-nums hidden sm:inline">{fight.fightDate}</span>
                <span className="text-gray-500 text-xs hidden sm:inline">
                  {fight.participants} joueur{fight.participants !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditingFightId(fight.fightId)}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors px-2 py-1"
                >
                  Éditer
                </button>

                {deletingFightId === fight.fightId ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(fight.fightId)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors px-2 py-1"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setDeletingFightId(null)}
                      className="text-gray-400 hover:text-gray-300 text-xs font-medium transition-colors px-2 py-1"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingFightId(fight.fightId)}
                    className="text-red-400/60 hover:text-red-400 text-xs font-medium transition-colors px-2 py-1"
                  >
                    Suppr.
                  </button>
                )}
              </div>
            </div>
            <div className="sm:hidden px-4 pb-2 text-xs text-gray-500 tabular-nums">
              {fight.fightDate} — {fight.participants} joueur{fight.participants !== 1 ? "s" : ""}
            </div>

            <FightEntriesList entries={fight.entries} />
          </div>
        );
      })}
    </div>
  );
}

function FightEntriesList({ entries }: { entries: FightEntryDetail[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="border-t border-gray-800/60 px-4 py-2">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[350px]">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left py-1.5 px-2 font-medium">Joueur</th>
              <th className="text-center py-1.5 px-2 font-medium">Live</th>
              <th className="text-right py-1.5 px-2 font-medium">Level</th>
              <th className="text-right py-1.5 px-2 font-medium">Damage</th>
              <th className="text-right py-1.5 px-2 font-medium">Bouclier</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.playerId} className="border-t border-gray-800/30">
                <td className="py-1.5 px-2 text-white">{entry.playerName}</td>
                <td className="py-1.5 px-2 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${entry.wasPresentLive === true ? "bg-green-500" : "bg-red-500/60"}`} />
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">{entry.levelAtFight}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{formatCompactNumber(entry.damage)}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{formatCompactNumber(entry.shieldsBroken)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface EditFightData {
  id: string;
  seasonId: string;
  against: string;
  fightDate: string;
  notes: string;
  entries: (FightEntryDetail & { id?: string })[];
}

function EditFightForm({
  fightId,
  onCancel,
  onSaved,
}: {
  fightId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [fight, setFight] = useState<EditFightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/fights/${fightId}`);
      const json = await res.json();
      setFight(json);
      setLoading(false);
    }
    load();
  }, [fightId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fight) return;

    setError("");
    setSaving(true);

    try {
      const entries = fight.entries.map((entry) => ({
        playerId: entry.playerId,
        levelAtFight: entry.levelAtFight,
        damage: entry.damage,
        shieldsBroken: entry.shieldsBroken,
        wasPresentLive: entry.wasPresentLive,
      }));

      const res = await fetch(`/api/fights/${fightId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          against: fight.against,
          fightDate: fight.fightDate,
          notes: fight.notes,
          entries,
        }),
      });

      if (res.ok) {
        onSaved();
      } else {
        const json = await res.json();
        setError(json.error || "Erreur");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !fight) {
    return <div className="text-gray-500 text-sm">Chargement...</div>;
  }

  return (
    <div className="bg-gray-900 border border-blue-800/50 rounded-xl px-4 sm:px-6 py-5">
      <h4 className="text-sm font-medium text-white mb-4">Éditer le combat</h4>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            value={fight.against}
            onChange={(e) => setFight({ ...fight, against: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="date"
            value={fight.fightDate}
            onChange={(e) => setFight({ ...fight, fightDate: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="text"
            placeholder="Notes"
            value={fight.notes}
            onChange={(e) => setFight({ ...fight, notes: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
          <div className="bg-gray-800/50 rounded-lg overflow-hidden min-w-[450px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-2 px-3 font-medium">Joueur</th>
                  <th className="text-right py-2 px-3 font-medium">Level</th>
                  <th className="text-right py-2 px-3 font-medium">Damage</th>
                  <th className="text-right py-2 px-3 font-medium">Bouclier</th>
                  <th className="text-center py-2 px-3 font-medium">LIVE</th>
                </tr>
              </thead>
              <tbody>
                {fight.entries.map((entry, idx) => (
                  <tr key={entry.playerId} className="border-t border-gray-700/50">
                    <td className="py-2 px-3 text-white">{entry.playerName}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={entry.levelAtFight}
                        onChange={(e) => {
                          const updated = [...fight.entries];
                          updated[idx] = { ...updated[idx], levelAtFight: parseInt(e.target.value, 10) || 0 };
                          setFight({ ...fight, entries: updated });
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={entry.damage}
                        onChange={(e) => {
                          const updated = [...fight.entries];
                          updated[idx] = { ...updated[idx], damage: parseInt(e.target.value, 10) || 0 };
                          setFight({ ...fight, entries: updated });
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={entry.shieldsBroken}
                        onChange={(e) => {
                          const updated = [...fight.entries];
                          updated[idx] = { ...updated[idx], shieldsBroken: parseInt(e.target.value, 10) || 0 };
                          setFight({ ...fight, entries: updated });
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={entry.wasPresentLive === true}
                        onChange={() => {
                          const updated = [...fight.entries];
                          updated[idx] = { ...updated[idx], wasPresentLive: updated[idx].wasPresentLive === true ? null : true };
                          setFight({ ...fight, entries: updated });
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
