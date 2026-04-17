"use client";

import { useState, useEffect } from "react";
import { Season, Player } from "@/lib/domain/types";

interface SeasonsData {
  seasons: Season[];
  players: Player[];
}

async function fetchSeasonsData(setData: (d: SeasonsData) => void, setLoading: (l: boolean) => void) {
  setLoading(true);
  const res = await fetch("/api/seasons");
  const json = await res.json();
  setData(json);
  setLoading(false);
}

export default function SeasonManagement() {
  const [data, setData] = useState<SeasonsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSeasonsData(setData, setLoading);
  }, []);

  if (loading || !data) {
    return <div className="text-gray-500 text-sm">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Saisons</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {showForm ? "Annuler" : "Nouvelle saison"}
        </button>
      </div>

      <SeasonsList seasons={data.seasons} onSetActive={() => fetchSeasonsData(setData, setLoading)} />

      {showForm && (
        <NewSeasonForm players={data.players} onCreated={() => { setShowForm(false); fetchSeasonsData(setData, setLoading); }} />
      )}
    </div>
  );
}

function SeasonsList({
  seasons,
  onSetActive,
}: {
  seasons: Season[];
  onSetActive: () => void;
}) {
  if (seasons.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-6 text-center text-gray-500 text-sm">
        Aucune saison créée.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4 font-medium">Nom</th>
              <th className="text-left py-3 px-4 font-medium">Début</th>
              <th className="text-left py-3 px-4 font-medium">Fin</th>
              <th className="text-left py-3 px-4 font-medium">Statut</th>
              <th className="text-right py-3 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => (
              <tr
                key={season.id}
                className="border-t border-gray-800/60 hover:bg-gray-800/40 transition-colors"
              >
                <td className="py-3 px-4 font-medium text-white">{season.name}</td>
                <td className="py-3 px-4 tabular-nums">{season.startDate}</td>
                <td className="py-3 px-4 tabular-nums">{season.endDate}</td>
                <td className="py-3 px-4">
                  {season.isActive ? (
                    <span className="text-green-400 text-xs font-medium bg-green-400/10 px-2 py-0.5 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">Inactive</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {!season.isActive && (
                    <button
                      onClick={async () => {
                        await fetch("/api/seasons", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ seasonId: season.id }),
                        });
                        onSetActive();
                      }}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                    >
                      Activer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y divide-gray-800/60">
        {seasons.map((season) => (
          <div key={season.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-white text-sm">{season.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
                {season.startDate} → {season.endDate}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {season.isActive ? (
                <span className="text-green-400 text-xs font-medium bg-green-400/10 px-2 py-0.5 rounded">
                  Active
                </span>
              ) : (
                <button
                  onClick={async () => {
                    await fetch("/api/seasons", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ seasonId: season.id }),
                    });
                    onSetActive();
                  }}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                >
                  Activer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewSeasonForm({
  players,
  onCreated,
}: {
  players: Player[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set(players.filter((p) => p.isActive).map((p) => p.id))
  );
  const [startLevels, setStartLevels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function togglePlayer(playerId: string) {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  function updateLevel(playerId: string, level: string) {
    setStartLevels((prev) => ({ ...prev, [playerId]: level }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !startDate || !endDate) {
      setError("Tous les champs sont requis");
      return;
    }

    const playerStartLevels = Array.from(selectedPlayers).map((playerId) => {
      const levelStr = startLevels[playerId] || "0";
      return { playerId, startLevel: parseInt(levelStr, 10) || 0 };
    });

    if (playerStartLevels.length === 0) {
      setError("Sélectionnez au moins un joueur");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate, playerStartLevels }),
      });

      if (res.ok) {
        onCreated();
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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 sm:px-6 py-5">
      <h4 className="text-sm font-medium text-white mb-4">Nouvelle saison</h4>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            placeholder="Nom de la saison"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <h5 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Joueurs et niveaux de départ</h5>
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-2 max-h-64 overflow-y-auto">
          {players.map((player) => {
            const isSelected = selectedPlayers.has(player.id);
            return (
              <div
                key={player.id}
                className="flex items-center gap-3"
              >
                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePlayer(player.id)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className={`text-sm ${isSelected ? "text-white" : "text-gray-500"}`}>
                    {player.name}
                  </span>
                </label>
                {isSelected && (
                  <input
                    type="number"
                    placeholder="Level"
                    value={startLevels[player.id] || ""}
                    onChange={(e) => updateLevel(player.id, e.target.value)}
                    className="w-20 sm:w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
        >
          {saving ? "Création..." : "Créer la saison"}
        </button>
      </form>
    </div>
  );
}
