"use client";

import { useState, useEffect } from "react";
import { formatCompactNumber } from "@/lib/utils/format";

interface SeasonPlayer {
  playerId: string;
  playerName: string;
  startLevel: number;
}

interface ParsedEntry {
  playerName: string;
  levelAtFight: number;
  damage: number;
  shieldsBroken: number;
  matchedPlayerId: string | null;
  isNew: boolean;
}

interface ParsedFight {
  against: string;
  fightDate: string;
  entries: ParsedEntry[];
  valid: boolean;
  errors: string[];
}

export default function JsonImport() {
  const [players, setPlayers] = useState<SeasonPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [jsonText, setJsonText] = useState("");
  const [parsed, setParsed] = useState<ParsedFight | null>(null);
  const [parseError, setParseError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/fights");
      const json = await res.json();
      setPlayers(json.players || []);
      setLoading(false);
    }
    load();
  }, []);

  function handleParse() {
    setParseError("");
    setParsed(null);
    setSuccess(false);

    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch {
      setParseError("JSON invalide — vérifiez la syntaxe");
      return;
    }

    const result = validateAndParse(raw, players);
    setParsed(result);
  }

  async function handleImport() {
    if (!parsed || !parsed.valid) return;

    setSaving(true);
    setSuccess(false);

    try {
      const entries = parsed.entries.map((e) => ({
        playerName: e.playerName,
        levelAtFight: e.levelAtFight,
        damage: e.damage,
        shieldsBroken: e.shieldsBroken,
      }));

      const res = await fetch("/api/fights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          against: parsed.against,
          fightDate: parsed.fightDate,
          entries,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setJsonText("");
        setParsed(null);
      } else {
        const json = await res.json();
        setParseError(json.error || "Erreur lors de l'import");
      }
    } catch {
      setParseError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500 text-sm">Chargement...</div>;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
      <h4 className="text-sm font-medium text-white mb-4">Import JSON</h4>

      {parseError && <p className="text-sm text-red-400 mb-3">{parseError}</p>}
      {success && <p className="text-sm text-green-400 mb-3">Combat importé avec succès.</p>}

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder={'{\n  "against": "iGerX 2",\n  "fightDate": "2026-04-11",\n  "entries": [\n    {\n      "playerName": "Israr",\n      "levelAtFight": 487,\n      "damage": 465060,\n      "shieldsBroken": 0\n    }\n  ]\n}'}
        rows={12}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y mb-3"
      />

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleParse}
          disabled={!jsonText.trim()}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Prévisualiser
        </button>
      </div>

      {parsed && (
        <FightPreview
          parsed={parsed}
          onImport={handleImport}
          saving={saving}
        />
      )}
    </div>
  );
}

function FightPreview({
  parsed,
  onImport,
  saving,
}: {
  parsed: ParsedFight;
  onImport: () => void;
  saving: boolean;
}) {
  const newCount = parsed.entries.filter((e) => e.isNew).length;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800/50 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-white font-medium text-sm">{parsed.against}</span>
          <span className="text-gray-500 text-sm ml-3">{parsed.fightDate}</span>
          {newCount > 0 && (
            <span className="text-yellow-400 text-xs ml-3">
              {newCount} nouveau{xnew(newCount)} joueur{newCount > 1 ? "x" : ""}
            </span>
          )}
        </div>
        <button
          onClick={onImport}
          disabled={!parsed.valid || saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors"
        >
          {saving ? "Import..." : "Confirmer l'import"}
        </button>
      </div>

      {parsed.errors.length > 0 && (
        <div className="px-4 py-2 bg-red-900/20 border-t border-red-800/30">
          {parsed.errors.map((err, i) => (
            <p key={i} className="text-sm text-red-400">{err}</p>
          ))}
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wider">
            <th className="text-left py-2 px-4 font-medium">Joueur</th>
            <th className="text-right py-2 px-3 font-medium">Level</th>
            <th className="text-right py-2 px-3 font-medium">Damage</th>
            <th className="text-right py-2 px-3 font-medium">Bouclier</th>
            <th className="text-left py-2 px-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {parsed.entries.map((entry, i) => (
            <tr key={i} className="border-t border-gray-800/40">
              <td className="py-2 px-4 font-medium text-white">{entry.playerName}</td>
              <td className="py-2 px-3 text-right tabular-nums">{entry.levelAtFight}</td>
              <td className="py-2 px-3 text-right tabular-nums">{formatCompactNumber(entry.damage)}</td>
              <td className="py-2 px-3 text-right tabular-nums">{entry.shieldsBroken}</td>
              <td className="py-2 px-3">
                {entry.isNew ? (
                  <span className="text-yellow-400 text-xs">Sera créé</span>
                ) : (
                  <span className="text-green-400 text-xs">OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function xnew(n: number): string {
  return n > 1 ? "x" : "";
}

function validateAndParse(raw: unknown, knownPlayers: SeasonPlayer[]): ParsedFight {
  const errors: string[] = [];

  if (!raw || typeof raw !== "object") {
    return { against: "", fightDate: "", entries: [], valid: false, errors: ["Format invalide"] };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.against !== "string" || !obj.against.trim()) {
    errors.push('"against" requis (string)');
  }
  if (typeof obj.fightDate !== "string" || !obj.fightDate.trim()) {
    errors.push('"fightDate" requis (string YYYY-MM-DD)');
  }
  if (!Array.isArray(obj.entries)) {
    errors.push('"entries" requis (array)');
    return { against: String(obj.against ?? ""), fightDate: String(obj.fightDate ?? ""), entries: [], valid: false, errors };
  }

  const playerMap = new Map(knownPlayers.map((p) => [p.playerName.toLowerCase().trim(), p.playerId]));
  const seenNames = new Map<string, { index: number; normalized: string }>();

  const entries: ParsedEntry[] = (obj.entries as unknown[]).map((entry, i) => {
    const e = entry as Record<string, unknown>;
    const entryErrors: string[] = [];

    const playerName = String(e.playerName ?? "").trim();
    const normalized = playerName.toLowerCase();
    const levelAtFight = e.levelAtFight;
    const damage = e.damage;
    const shieldsBroken = e.shieldsBroken;

    if (!playerName) entryErrors.push(`Entry ${i + 1}: playerName requis`);

    const prev = seenNames.get(normalized);
    if (prev && playerName) {
      entryErrors.push(`Entry ${i + 1}: "${playerName}" apparaît aussi en entry ${prev.index + 1}`);
    } else if (playerName) {
      seenNames.set(normalized, { index: i, normalized });
    }

    if (typeof levelAtFight !== "number" || !Number.isInteger(levelAtFight) || levelAtFight < 0) {
      entryErrors.push(`Entry ${i + 1}: levelAtFight doit être un entier positif`);
    }
    if (typeof damage !== "number" || !Number.isInteger(damage) || damage < 0) {
      entryErrors.push(`Entry ${i + 1}: damage doit être un entier positif`);
    }
    if (typeof shieldsBroken !== "number" || !Number.isInteger(shieldsBroken) || shieldsBroken < 0) {
      entryErrors.push(`Entry ${i + 1}: shieldsBroken doit être un entier positif`);
    }

    if (typeof damage === "string") {
      entryErrors.push(`Entry ${i + 1}: damage ne doit pas être une chaîne (ex: "465k")`);
    }

    errors.push(...entryErrors);

    const matchedPlayerId = playerMap.get(playerName.toLowerCase()) ?? null;
    const isNew = !matchedPlayerId && playerName.length > 0;

    return {
      playerName,
      levelAtFight: typeof levelAtFight === "number" ? levelAtFight : 0,
      damage: typeof damage === "number" ? damage : 0,
      shieldsBroken: typeof shieldsBroken === "number" ? shieldsBroken : 0,
      matchedPlayerId,
      isNew,
    };
  });

  return {
    against: String((obj.against ?? "")).trim(),
    fightDate: String((obj.fightDate ?? "")).trim(),
    entries,
    valid: errors.length === 0,
    errors,
  };
}
