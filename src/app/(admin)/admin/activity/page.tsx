"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatRelative, formatDateTime } from "@/lib/utils/format";

interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  pipeline_stage_change: { label: "Changement d'étape pipeline", icon: "🔄" },
  contact_promoted: { label: "Contact basculé en élève", icon: "🎓" },
};

const ACTION_FILTERS = [
  { key: "", label: "Toutes actions" },
  { key: "pipeline_stage_change", label: "Changements pipeline" },
  { key: "contact_promoted", label: "Bascules élève" },
];

const SINCE_FILTERS = [
  { key: "", label: "Toujours" },
  { key: "1d", label: "24 dernières heures" },
  { key: "7d", label: "7 derniers jours" },
  { key: "30d", label: "30 derniers jours" },
];

function sinceToISO(k: string): string {
  if (!k) return "";
  const n = parseInt(k);
  const unit = k.replace(/\d+/g, "");
  const ms = unit === "d" ? n * 24 * 60 * 60 * 1000 : 0;
  return new Date(Date.now() - ms).toISOString();
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [sinceKey, setSinceKey] = useState("");
  const [page, setPage] = useState(1);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (action) params.set("action", action);
    const since = sinceToISO(sinceKey);
    if (since) params.set("since", since);
    const res = await fetch(`/api/admin/activity?${params}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, [action, sinceKey, page]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Journal d&apos;activité</h1>
        <p className="text-sm text-gray-500 mt-1">
          Qui a fait quoi, quand. {total} entrée{total > 1 ? "s" : ""} au total · rétention 90 jours.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          {ACTION_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        <select
          value={sinceKey}
          onChange={(e) => { setSinceKey(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          {SINCE_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Liste */}
      <Card padding="none">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin mx-auto" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Aucune activité pour ces filtres. Les mouvements pipeline et bascules élève apparaissent ici automatiquement.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map((e) => {
              const meta = ACTION_LABELS[e.action] || { label: e.action, icon: "✏️" };
              return (
                <div key={e.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-es-green/10 flex items-center justify-center text-lg shrink-0">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                      <span className="text-xs text-gray-400">{formatRelative(e.created_at)}</span>
                    </div>
                    {e.action === "pipeline_stage_change" && (
                      <p className="text-xs text-gray-600 mt-1">
                        {(e.before as Record<string, string> | null)?.pipeline_stage || "?"} →{" "}
                        <span className="font-semibold text-es-green">
                          {(e.after as Record<string, string> | null)?.pipeline_stage || "?"}
                        </span>
                      </p>
                    )}
                    {e.action === "contact_promoted" && (
                      <p className="text-xs text-gray-600 mt-1">
                        Produit : <span className="font-semibold">{(e.after as Record<string, string> | null)?.product_name}</span> ·{" "}
                        Coachings : {(e.after as Record<string, number> | null)?.coaching_credits ?? 0}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {e.entity_type} ·{" "}
                      {e.entity_id && e.entity_type === "contact" && (
                        <Link href={`/admin/contacts/${e.entity_id}`} className="text-es-green hover:underline">
                          voir fiche →
                        </Link>
                      )}{" "}
                      · {formatDateTime(e.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-500 hover:text-es-green disabled:opacity-30"
            >
              ← Précédent
            </button>
            <span className="text-xs text-gray-400">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-sm text-gray-500 hover:text-es-green disabled:opacity-30"
            >
              Suivant →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
