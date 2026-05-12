"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PageSpeedRow {
  page_path: string;
  score_performance: number | null;
  score_accessibility: number | null;
  score_best_practices: number | null;
  score_seo: number | null;
  lcp_ms: number | null;
  inp_ms: number | null;
  cls: number | null;
  fetched_at: string | null;
}

const SCORE_COLORS: Array<{ min: number; cls: string }> = [
  { min: 90, cls: "bg-green-100 text-green-800" },
  { min: 50, cls: "bg-amber-100 text-amber-800" },
  { min: 0, cls: "bg-red-100 text-red-800" },
];

function scoreColor(s: number | null): string {
  if (s == null) return "bg-gray-100 text-gray-500";
  return SCORE_COLORS.find((c) => s >= c.min)?.cls || SCORE_COLORS[2].cls;
}

function vitalColor(v: number | null, good: number, needsImprovement: number): string {
  if (v == null) return "text-gray-400";
  if (v <= good) return "text-green-700";
  if (v <= needsImprovement) return "text-amber-700";
  return "text-red-700";
}

export function SeoPageSpeed({
  rows,
  monitoredPaths,
}: {
  rows: PageSpeedRow[];
  monitoredPaths: string[];
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ ok: number; failed: number; total: number } | null>(null);

  async function runAll() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo/pagespeed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "all", strategy: "mobile" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Echec");
      setLastResult({ ok: data.ok, failed: data.failed, total: data.total });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Echec");
    } finally {
      setRunning(false);
    }
  }

  // Group by path (rows are already sorted desc, on prend la derniere = la plus recente)
  const latestByPath = new Map<string, PageSpeedRow>();
  for (const r of rows) if (!latestByPath.has(r.page_path)) latestByPath.set(r.page_path, r);
  const sorted = monitoredPaths
    .map((p) => latestByPath.get(p))
    .filter((r): r is PageSpeedRow => Boolean(r));
  const noData = monitoredPaths.filter((p) => !latestByPath.has(p));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-es-text-muted">
          Lighthouse mobile, donnees CrUX (real user) si trafic suffisant sinon lab data. Cron hebdo automatique.
        </p>
        <button
          onClick={runAll}
          disabled={running}
          className="text-sm px-3 py-1.5 bg-es-green text-white rounded hover:bg-es-green-light disabled:opacity-50"
        >
          {running ? "Audit en cours (~3-5 min)..." : "Lancer un audit maintenant"}
        </button>
      </div>

      {lastResult && (
        <p className="text-xs text-es-text-muted mb-3">
          Dernier audit : {lastResult.ok} pages OK, {lastResult.failed} echecs sur {lastResult.total}
        </p>
      )}
      {error && <p className="text-sm text-red-700 mb-3">{error}</p>}

      {sorted.length === 0 ? (
        <p className="text-sm text-es-text-muted py-6 text-center">
          Aucune mesure encore. Click &laquo; Lancer un audit &raquo; ou attends le cron hebdo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-es-cream-dark">
                <th className="py-2 px-2 font-medium text-es-text-muted">Page</th>
                <th className="py-2 px-2 font-medium text-es-text-muted text-center">Perf.</th>
                <th className="py-2 px-2 font-medium text-es-text-muted text-center">A11y</th>
                <th className="py-2 px-2 font-medium text-es-text-muted text-center">Best Pr.</th>
                <th className="py-2 px-2 font-medium text-es-text-muted text-center">SEO</th>
                <th className="py-2 px-2 font-medium text-es-text-muted text-right">LCP</th>
                <th className="py-2 px-2 font-medium text-es-text-muted text-right">INP</th>
                <th className="py-2 px-2 font-medium text-es-text-muted text-right">CLS</th>
                <th className="py-2 px-2 font-medium text-es-text-muted text-right">Mesure</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.page_path} className="border-b border-es-cream-dark/50">
                  <td className="py-2 px-2">
                    <code className="text-xs">{r.page_path}</code>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${scoreColor(r.score_performance)}`}>
                      {r.score_performance ?? "-"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${scoreColor(r.score_accessibility)}`}>
                      {r.score_accessibility ?? "-"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${scoreColor(r.score_best_practices)}`}>
                      {r.score_best_practices ?? "-"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${scoreColor(r.score_seo)}`}>
                      {r.score_seo ?? "-"}
                    </span>
                  </td>
                  <td className={`py-2 px-2 text-right text-xs tabular-nums ${vitalColor(r.lcp_ms, 2500, 4000)}`}>
                    {r.lcp_ms != null ? `${(r.lcp_ms / 1000).toFixed(1)}s` : "-"}
                  </td>
                  <td className={`py-2 px-2 text-right text-xs tabular-nums ${vitalColor(r.inp_ms, 200, 500)}`}>
                    {r.inp_ms != null ? `${r.inp_ms}ms` : "-"}
                  </td>
                  <td className={`py-2 px-2 text-right text-xs tabular-nums ${vitalColor(r.cls != null ? r.cls * 1000 : null, 100, 250)}`}>
                    {r.cls != null ? r.cls.toFixed(2) : "-"}
                  </td>
                  <td className="py-2 px-2 text-right text-[10px] text-es-text-muted">
                    {r.fetched_at
                      ? new Date(r.fetched_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {noData.length > 0 && (
        <p className="text-xs text-amber-700 mt-3">
          ⚠ {noData.length} page{noData.length > 1 ? "s" : ""} non encore mesuree{noData.length > 1 ? "s" : ""} : {noData.slice(0, 3).join(", ")}
          {noData.length > 3 && "..."}
        </p>
      )}

      <div className="mt-4 text-[10px] text-es-text-muted">
        <strong>Seuils Google :</strong> LCP &lt; 2.5s (vert) / &lt; 4s (orange). INP &lt; 200ms / &lt; 500ms. CLS &lt; 0.10 / &lt; 0.25.
      </div>
    </div>
  );
}
