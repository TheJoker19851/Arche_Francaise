"use client";

import { useState } from "react";

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        setError("Mot de passe incorrect");
        setPassword("");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-8">
        <h2 className="text-xl font-semibold text-white mb-1">Admin</h2>
        <p className="text-sm text-gray-500 mb-6">Entrez le mot de passe admin</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            autoFocus
          />

          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading ? "Vérification..." : "Connexion"}
          </button>
        </form>
      </div>
    </div>
  );
}
