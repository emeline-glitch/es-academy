"use client";

import { useState } from "react";

interface CoachingCreditsCellProps {
  userId: string;
  initialTotal: number;
  initialUsed: number;
}

export function CoachingCreditsCell({ userId, initialTotal, initialUsed }: CoachingCreditsCellProps) {
  const [total, setTotal] = useState(initialTotal);
  const [used, setUsed] = useState(initialUsed);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(total - used, 0);

  async function save(nextTotal: number, nextUsed: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coaching-credits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          credits_total: nextTotal,
          credits_used: nextUsed,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur serveur");
      }
      const body = await res.json();
      setTotal(body.profile?.coaching_credits_total ?? nextTotal);
      setUsed(body.profile?.coaching_credits_used ?? nextUsed);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={total}
          onChange={(e) => setTotal(Math.max(0, Number(e.target.value)))}
          className="w-12 px-1.5 py-1 border border-gray-300 rounded text-xs text-center"
          aria-label="Total"
        />
        <span className="text-gray-400 text-xs">total</span>
        <span className="text-gray-300">·</span>
        <input
          type="number"
          min={0}
          value={used}
          onChange={(e) => setUsed(Math.max(0, Number(e.target.value)))}
          className="w-12 px-1.5 py-1 border border-gray-300 rounded text-xs text-center"
          aria-label="Utilisés"
        />
        <span className="text-gray-400 text-xs">utilisés</span>
        <button
          onClick={() => save(total, used)}
          disabled={saving}
          className="text-xs px-2 py-1 bg-es-green text-white rounded hover:bg-es-green-light disabled:opacity-50"
        >
          {saving ? "…" : "OK"}
        </button>
        <button
          onClick={() => {
            setTotal(initialTotal);
            setUsed(initialUsed);
            setEditing(false);
            setError(null);
          }}
          disabled={saving}
          className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
        >
          Annuler
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-2 text-sm hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors cursor-pointer"
      title="Cliquer pour modifier"
    >
      <span
        className={`inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-full text-xs font-semibold ${
          remaining > 0
            ? "bg-es-green/10 text-es-green"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {remaining}
      </span>
      <span className="text-xs text-gray-400">/ {total} total</span>
      <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}
