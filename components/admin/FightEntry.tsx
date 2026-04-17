"use client";

import { useState, useEffect } from "react";

interface SeasonPlayer {
  playerId: string;
  playerName: string;
  startLevel: number;
}

interface PlayerEntry {
  playerId: string;
  playerName: string;
  included: boolean;
  levelAtFight: string;
  damage: string;
  shieldsBroken: string;
}

export default function FightEntry() {
  const [players, setPlayers] = useState<SeasonPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [against, setAgainst] = useState("");
  const [fightDate, setFightDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [playerEntries, setPlayerEntries] = useState<PlayerEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/fights");
      const json = await res.json();
      setPlayers(json.players || []);
      setPlayerEntries(
        (json.players || []).map((p: SeasonPlayer) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          included: true,
          levelAtFight: "",
          damage: "",
          shieldsBroken: "",
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  function togglePlayer(index: number) {
    setPlayerEntries((prev) =>
      prev.map((e, i) =>
        i === index ? { ...e, included: !e.included } : e
      )
    );
  }

  function updateField(index: number, field: "levelAtFight" | "damage" | "shieldsBroken", value: string) {
    setPlayerEntries((prev) =>
      prev.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      )
    );
  }

  function resetForm() {
    setAgainst("");
    setFightDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setPlayerEntries(
      players.map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        included: true,
        levelAtFight: "",
        damage: "",
        shieldsBroken: "",
      }))
    );
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!against || !fightDate) {
      setError("Adversaire et date sont requis");
      return;
    }

    const entries = playerEntries
      .filter((pe) => pe.included)
      .map((pe) => ({
        playerId: pe.playerId,
        levelAtFight: parseInt(pe.levelAtFight, 10) || 0,
        damage: parseInt(pe.damage, 10) || 0,
        shieldsBroken: parseInt(pe.shieldsBroken, 10) || 0,
      }));

    if (entries.length === 0) {
      setError("Au moins un joueur doit participer");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/fights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ against, fightDate, notes, entries }),
      });

      if (res.ok) {
        setSuccess(true);
        resetForm();
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

  if (loading) {
    return <div className="text-gray-500 text-sm">Chargement...</div>;
  }

  if (players.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-8 text-center text-gray-500 text-sm">
        Aucun joueur dans la saison active.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 sm:px-6 py-5">
      <h4 className="text-sm font-medium text-white mb-4">Nouveau combat</h4>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      {success && <p className="text-sm text-green-400 mb-3">Combat enregistré avec succès.</p>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            placeholder="Adversaire"
            value={against}
            onChange={(e) => setAgainst(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="date"
            value={fightDate}
            onChange={(e) => setFightDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="text"
            placeholder="Notes (optionnel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <h5 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Joueurs</h5>

        <div className="hidden sm:block bg-gray-800/50 rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left py-2 px-3 font-medium">Présent</th>
                <th className="text-left py-2 px-3 font-medium">Joueur</th>
                <th className="text-right py-2 px-3 font-medium">Level</th>
                <th className="text-right py-2 px-3 font-medium">Damage</th>
                <th className="text-right py-2 px-3 font-medium">Bouclier</th>
              </tr>
            </thead>
            <tbody>
              {playerEntries.map((entry, idx) => (
                <tr key={entry.playerId} className="border-t border-gray-700/50">
                  <td className="py-2 px-3">
                    <input
                      type="checkbox"
                      checked={entry.included}
                      onChange={() => togglePlayer(idx)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50"
                    />
                  </td>
                  <td className={`py-2 px-3 ${entry.included ? "text-white" : "text-gray-500"}`}>
                    {entry.playerName}
                  </td>
                  <td className="py-2 px-3">
                    {entry.included && (
                      <input
                        type="number"
                        placeholder="0"
                        value={entry.levelAtFight}
                        onChange={(e) => updateField(idx, "levelAtFight", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {entry.included && (
                      <input
                        type="number"
                        placeholder="0"
                        value={entry.damage}
                        onChange={(e) => updateField(idx, "damage", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {entry.included && (
                      <input
                        type="number"
                        placeholder="0"
                        value={entry.shieldsBroken}
                        onChange={(e) => updateField(idx, "shieldsBroken", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden space-y-2 mb-4">
          {playerEntries.map((entry, idx) => (
            <div
              key={entry.playerId}
              className={`bg-gray-800/50 rounded-lg p-3 ${!entry.included ? "opacity-50" : ""}`}
            >
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={entry.included}
                  onChange={() => togglePlayer(idx)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50"
                />
                <span className={`text-sm font-medium ${entry.included ? "text-white" : "text-gray-500"}`}>
                  {entry.playerName}
                </span>
              </label>
              {entry.included && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Level</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={entry.levelAtFight}
                      onChange={(e) => updateField(idx, "levelAtFight", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">DMG</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={entry.damage}
                      onChange={(e) => updateField(idx, "damage", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">SH</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={entry.shieldsBroken}
                      onChange={(e) => updateField(idx, "shieldsBroken", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-right tabular-nums text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
        >
          {saving ? "Enregistrement..." : "Enregistrer le combat"}
        </button>
      </form>
    </div>
  );
}
