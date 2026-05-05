"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

export interface TargetKeyword {
  id: string;
  keyword: string;
  priority: number;
  target_page: string | null;
  current_position: number | null;
  current_impressions: number | null;
  current_clicks: number | null;
  last_checked_at: string | null;
  notes: string | null;
}

const PRIORITY_LABEL: Record<number, { label: string; variant: "error" | "warning" | "info" }> = {
  1: { label: "Haute", variant: "error" },
  2: { label: "Moyenne", variant: "warning" },
  3: { label: "Basse", variant: "info" },
};

export function SeoKeywords({ keywords }: { keywords: TargetKeyword[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ keyword: "", priority: 2, target_page: "", notes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TargetKeyword>>({});
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.keyword.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/seo/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: form.keyword.trim(),
          priority: form.priority,
          target_page: form.target_page.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Echec");
      setForm({ keyword: "", priority: 2, target_page: "", notes: "" });
      setAdding(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Echec");
    } finally {
      setBusy(false);
    }
  }

  async function save(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/seo/keywords", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Echec");
      setEditingId(null);
      setEditForm({});
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Echec");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce mot-cle ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/seo/keywords?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Echec");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Echec");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(k: TargetKeyword) {
    setEditingId(k.id);
    setEditForm({
      keyword: k.keyword,
      priority: k.priority,
      target_page: k.target_page,
      current_position: k.current_position,
      current_impressions: k.current_impressions,
      current_clicks: k.current_clicks,
      notes: k.notes,
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-es-text-muted">
          Renseigne les positions depuis Search Console pour suivre l&apos;evolution.
        </p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm px-3 py-1.5 bg-es-green text-white rounded hover:bg-es-green-light"
          >
            + Ajouter un mot-cle
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={create} className="border border-es-cream-dark rounded-lg p-4 mb-4 bg-es-cream/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-es-text-muted">Mot-cle</label>
              <input
                type="text"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                placeholder="ex: investir locatif sans apport"
                className="w-full mt-1 px-3 py-2 text-sm border border-es-cream-dark rounded"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-es-text-muted">Priorite</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 text-sm border border-es-cream-dark rounded"
              >
                <option value={1}>Haute</option>
                <option value={2}>Moyenne</option>
                <option value={3}>Basse</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-es-text-muted">Page cible</label>
              <input
                type="text"
                value={form.target_page}
                onChange={(e) => setForm({ ...form, target_page: e.target.value })}
                placeholder="ex: /academy"
                className="w-full mt-1 px-3 py-2 text-sm border border-es-cream-dark rounded"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-es-text-muted">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm border border-es-cream-dark rounded"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="text-sm px-4 py-1.5 bg-es-green text-white rounded hover:bg-es-green-light disabled:opacity-50"
            >
              {busy ? "..." : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-sm px-4 py-1.5 bg-es-cream-dark rounded"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-es-cream-dark">
              <th className="py-2 px-2 font-medium text-es-text-muted">Mot-cle</th>
              <th className="py-2 px-2 font-medium text-es-text-muted">Priorite</th>
              <th className="py-2 px-2 font-medium text-es-text-muted">Page cible</th>
              <th className="py-2 px-2 font-medium text-es-text-muted text-right">Position</th>
              <th className="py-2 px-2 font-medium text-es-text-muted text-right">Impr.</th>
              <th className="py-2 px-2 font-medium text-es-text-muted text-right">Clics</th>
              <th className="py-2 px-2 font-medium text-es-text-muted">Notes</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {keywords.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-es-text-muted">
                  Aucun mot-cle suivi. Ajoute-en pour piloter ta strategie SEO.
                </td>
              </tr>
            )}
            {keywords.map((k) =>
              editingId === k.id ? (
                <tr key={k.id} className="border-b border-es-cream-dark bg-es-cream/30">
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={editForm.keyword as string}
                      onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-es-cream-dark rounded"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      value={editForm.priority as number}
                      onChange={(e) => setEditForm({ ...editForm, priority: Number(e.target.value) })}
                      className="px-2 py-1 text-sm border border-es-cream-dark rounded"
                    >
                      <option value={1}>Haute</option>
                      <option value={2}>Moyenne</option>
                      <option value={3}>Basse</option>
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={(editForm.target_page as string) || ""}
                      onChange={(e) => setEditForm({ ...editForm, target_page: e.target.value || null })}
                      className="w-full px-2 py-1 text-sm border border-es-cream-dark rounded"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.1"
                      value={(editForm.current_position as number) ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          current_position: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-20 px-2 py-1 text-sm border border-es-cream-dark rounded text-right"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={(editForm.current_impressions as number) ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          current_impressions: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-20 px-2 py-1 text-sm border border-es-cream-dark rounded text-right"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={(editForm.current_clicks as number) ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          current_clicks: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-20 px-2 py-1 text-sm border border-es-cream-dark rounded text-right"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={(editForm.notes as string) || ""}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value || null })}
                      className="w-full px-2 py-1 text-sm border border-es-cream-dark rounded"
                    />
                  </td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => save(k.id)}
                      disabled={busy}
                      className="text-xs px-2 py-1 bg-es-green text-white rounded mr-1"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditForm({});
                      }}
                      className="text-xs px-2 py-1 bg-es-cream-dark rounded"
                    >
                      X
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={k.id} className="border-b border-es-cream-dark hover:bg-es-cream/20">
                  <td className="py-2 px-2 font-medium">{k.keyword}</td>
                  <td className="py-2 px-2">
                    <Badge variant={PRIORITY_LABEL[k.priority]?.variant || "info"}>
                      {PRIORITY_LABEL[k.priority]?.label || k.priority}
                    </Badge>
                  </td>
                  <td className="py-2 px-2">
                    {k.target_page ? (
                      <code className="text-xs bg-es-cream-dark/50 px-1.5 py-0.5 rounded">{k.target_page}</code>
                    ) : (
                      <span className="text-xs text-es-text-muted italic">non assignee</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {k.current_position !== null ? k.current_position.toFixed(1) : "-"}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{k.current_impressions ?? "-"}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{k.current_clicks ?? "-"}</td>
                  <td className="py-2 px-2 text-xs text-es-text-muted truncate max-w-[200px]">{k.notes || "-"}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(k)}
                      className="text-xs px-2 py-1 bg-es-cream-dark rounded mr-1 hover:bg-es-cream-dark/80"
                    >
                      Editer
                    </button>
                    <button
                      onClick={() => remove(k.id)}
                      className="text-xs px-2 py-1 text-red-700 hover:bg-red-50 rounded"
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
