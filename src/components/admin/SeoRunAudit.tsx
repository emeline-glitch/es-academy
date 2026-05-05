"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function SeoRunAudit({ lastAuditAt }: { lastAuditAt: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ recommendations_count: number; pages_scanned: number } | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo/audit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Echec");
      setResult({
        recommendations_count: data.recommendations_count,
        pages_scanned: data.pages_scanned,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Echec");
    } finally {
      setBusy(false);
    }
  }

  const lastAuditLabel = lastAuditAt
    ? new Date(lastAuditAt).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "jamais lance";

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-es-text-muted">
        Dernier audit : <span className="font-medium text-es-text">{lastAuditLabel}</span>
      </div>
      <Button onClick={run} disabled={busy} size="sm" variant="primary">
        {busy ? "Audit en cours..." : "Lancer un audit"}
      </Button>
      {result && (
        <span className="text-sm text-green-700">
          {result.recommendations_count} reco{result.recommendations_count > 1 ? "s" : ""} sur {result.pages_scanned} pages
        </span>
      )}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
