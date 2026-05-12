"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

export interface KeyLanding {
  path: string;
  label: string;
  severity: "high" | "medium" | "low";
  monitor: boolean;
}

const SEVERITY_VARIANTS: Record<string, "error" | "warning" | "info"> = {
  high: "error",
  medium: "warning",
  low: "info",
};

export function SeoKeyLandings({ landings }: { landings: KeyLanding[] }) {
  const router = useRouter();
  const [items, setItems] = useState<KeyLanding[]>(landings);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<KeyLanding>({ path: "", label: "", severity: "medium", monitor: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: KeyLanding[]) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "key_landings", value: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Echec");
      }
      setItems(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Echec");
    } finally {
      setBusy(false);
    }
  }

  function toggleMonitor(path: string) {
    save(items.map((i) => (i.path === path ? { ...i, monitor: !i.monitor } : i)));
  }

  function remove(path: string) {
    if (!confirm(`Supprimer ${path} de la liste ?`)) return;
    save(items.filter((i) => i.path !== path));
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.path.trim() || !form.label.trim()) return;
    if (items.some((i) => i.path === form.path.trim())) {
      setError("Cette URL est deja dans la liste");
      return;
    }
    save([...items, { ...form, path: form.path.trim(), label: form.label.trim() }]);
    setForm({ path: "", label: "", severity: "medium", monitor: true });
    setAdding(false);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-es-text-muted">
          Pages strategiques monitorees : audit trafic, PageSpeed, indexation. Active/desactive le monitoring sans supprimer.
        </p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm px-3 py-1.5 bg-es-green text-white rounded hover:bg-es-green-light"
          >
            + Ajouter une page
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-700 mb-3">{error}</p>}

      {adding && (
        <form onSubmit={add} className="border border-es-cream-dark rounded-lg p-4 mb-4 bg-es-cream/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-es-text-muted">Path (ex: /academy)</label>
              <input
                type="text"
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
                placeholder="/academy"
                className="w-full mt-1 px-3 py-2 text-sm border border-es-cream-dark rounded"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-es-text-muted">Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Page de vente Academy"
                className="w-full mt-1 px-3 py-2 text-sm border border-es-cream-dark rounded"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-es-text-muted">Severite (recos generees)</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as KeyLanding["severity"] })}
                className="w-full mt-1 px-3 py-2 text-sm border border-es-cream-dark rounded"
              >
                <option value="high">Haute (critique si pas de trafic)</option>
                <option value="medium">Moyenne</option>
                <option value="low">Faible</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.monitor}
                  onChange={(e) => setForm({ ...form, monitor: e.target.checked })}
                />
                Activer le monitoring
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="text-sm px-4 py-1.5 bg-es-green text-white rounded disabled:opacity-50">
              {busy ? "..." : "Ajouter"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-sm px-4 py-1.5 bg-es-cream-dark rounded">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-es-cream-dark">
              <th className="py-2 px-2 font-medium text-es-text-muted">Path</th>
              <th className="py-2 px-2 font-medium text-es-text-muted">Label</th>
              <th className="py-2 px-2 font-medium text-es-text-muted">Severite</th>
              <th className="py-2 px-2 font-medium text-es-text-muted text-center">Monitor</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.path} className={`border-b border-es-cream-dark hover:bg-es-cream/20 ${!i.monitor ? "opacity-50" : ""}`}>
                <td className="py-2 px-2 font-mono text-xs">{i.path}</td>
                <td className="py-2 px-2">{i.label}</td>
                <td className="py-2 px-2">
                  <Badge variant={SEVERITY_VARIANTS[i.severity]}>{i.severity}</Badge>
                </td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => toggleMonitor(i.path)}
                    disabled={busy}
                    className={`text-xs px-2 py-1 rounded ${i.monitor ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {i.monitor ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    onClick={() => remove(i.path)}
                    disabled={busy}
                    className="text-xs px-2 py-1 text-red-700 hover:bg-red-50 rounded"
                  >
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
