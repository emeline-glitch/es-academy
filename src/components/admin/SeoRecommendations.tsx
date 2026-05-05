"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

export interface Recommendation {
  id: string;
  type: string;
  severity: "high" | "medium" | "low";
  page_path: string | null;
  title: string;
  description: string;
  fix_action: string | null;
  status: "open" | "done" | "dismissed";
  created_at: string;
  done_at: string | null;
}

const SEVERITY_LABEL: Record<string, { label: string; variant: "error" | "warning" | "info" }> = {
  high: { label: "Critique", variant: "error" },
  medium: { label: "Moyenne", variant: "warning" },
  low: { label: "Faible", variant: "info" },
};

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function SeoRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"open" | "done" | "dismissed" | "all">("open");
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { open: 0, done: 0, dismissed: 0, all: recommendations.length };
    for (const r of recommendations) c[r.status]++;
    return c;
  }, [recommendations]);

  const filtered = useMemo(() => {
    const list = filter === "all" ? recommendations : recommendations.filter((r) => r.status === filter);
    return [...list].sort((a, b) => {
      const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (s !== 0) return s;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [recommendations, filter]);

  async function update(id: string, status: "open" | "done" | "dismissed") {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/seo/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Echec");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Echec");
    } finally {
      setBusyId(null);
    }
  }

  const tabs = [
    { key: "open", label: `Ouvertes (${counts.open})` },
    { key: "done", label: `Faites (${counts.done})` },
    { key: "dismissed", label: `Ignorees (${counts.dismissed})` },
    { key: "all", label: `Toutes (${counts.all})` },
  ] as const;

  return (
    <div>
      <div className="flex gap-1 mb-4 border-b border-es-cream-dark">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              filter === t.key
                ? "border-b-2 border-es-green text-es-green"
                : "text-es-text-muted hover:text-es-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-es-text-muted py-8 text-center">
          {filter === "open"
            ? "Aucune recommandation ouverte. Bravo !"
            : "Rien dans cette categorie."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`border border-es-cream-dark rounded-lg p-4 ${
                r.status === "done" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={SEVERITY_LABEL[r.severity].variant}>
                      {SEVERITY_LABEL[r.severity].label}
                    </Badge>
                    {r.page_path && (
                      <code className="text-xs bg-es-cream-dark/50 px-2 py-0.5 rounded font-mono">
                        {r.page_path}
                      </code>
                    )}
                    <span className="text-xs text-es-text-muted">{r.type}</span>
                  </div>
                  <h4 className="font-medium text-es-text">{r.title}</h4>
                  <p className="text-sm text-es-text-muted mt-1">{r.description}</p>
                  {r.fix_action && (
                    <p className="text-sm mt-2 bg-es-cream/40 border-l-2 border-es-green pl-3 py-1">
                      <span className="font-medium">Action :</span> {r.fix_action}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {r.status === "open" && (
                    <>
                      <button
                        onClick={() => update(r.id, "done")}
                        disabled={busyId === r.id}
                        className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Faite
                      </button>
                      <button
                        onClick={() => update(r.id, "dismissed")}
                        disabled={busyId === r.id}
                        className="text-xs px-3 py-1 bg-es-cream-dark text-es-text rounded hover:bg-es-cream-dark/80"
                      >
                        Ignorer
                      </button>
                    </>
                  )}
                  {r.status !== "open" && (
                    <button
                      onClick={() => update(r.id, "open")}
                      disabled={busyId === r.id}
                      className="text-xs px-3 py-1 bg-es-cream-dark rounded hover:bg-es-cream-dark/80"
                    >
                      Reouvrir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
