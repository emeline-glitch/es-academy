"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

/**
 * Section RGPD : export des données (article 15) + demande de suppression
 * (article 17). Les endpoints API peuvent ne pas exister encore : on degrade
 * gracieusement avec un message "service a venir".
 *
 * La suppression de compte n'est PAS instantanee : on envoie une demande au
 * support qui traite manuellement apres vérification d'identité. Obligatoire
 * cote legal pour eviter qu'un attaquant ayant vole un cookie efface le compte.
 */
export function RgpdActions() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/rgpd/export", { method: "GET" });
      if (res.status === 404) {
        setExportError("Service en cours de mise en place. Écris-nous a contact@emeline-siron.fr en attendant.");
        return;
      }
      if (!res.ok) {
        setExportError("Erreur lors de l'export. Réessaie ou contacte le support.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-emeline-siron-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Erreur reseau. Réessaie.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleteState("sending");
    try {
      const res = await fetch("/api/rgpd/delete", { method: "POST" });
      if (res.status === 404) {
        setDeleteState("error");
        return;
      }
      if (!res.ok) {
        setDeleteState("error");
        return;
      }
      setDeleteState("sent");
      setConfirmOpen(false);
    } catch {
      setDeleteState("error");
    }
  }

  return (
    <Card className="border-red-200">
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-1">Mes données et RGPD</h2>
      <p className="text-sm text-gray-500 mb-5">
        Articles 15 et 17 du RGPD : tu peux récupérer toutes tes données ou demander leur suppression a tout moment.
      </p>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">Télécharger mes données</p>
            <p className="text-xs text-gray-500 mt-0.5">
              JSON contenant ton profil, tes enrollments, ta progression et tes paiements.
            </p>
            {exportError && <p className="text-xs text-red-700 mt-2">{exportError}</p>}
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-es-green hover:text-es-green transition-colors disabled:opacity-50 cursor-pointer"
          >
            {exporting ? "Preparation..." : "Télécharger"}
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-red-100">
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-900">Supprimer mon compte</p>
            <p className="text-xs text-red-700 mt-0.5">
              Action irréversible. On te répondra sous 30 jours pour confirmér la suppression et indiquer ce qui doit etre conserve (factures comptables).
            </p>
            {deleteState === "sent" && (
              <p className="text-xs text-green-800 mt-2">
                Demande envoyée. Tu recevras un mail de confirmation sous 48h.
              </p>
            )}
            {deleteState === "error" && (
              <p className="text-xs text-red-800 mt-2">
                Service en cours de mise en place. Écris-nous a contact@emeline-siron.fr en attendant.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="shrink-0 inline-flex items-center px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
          >
            Demander suppression
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-gray-900">Confirmér la suppression</h3>
            <p className="text-sm text-gray-600 mt-2">
              Tu vas envoyer une demande de suppression de ton compte. Cette action est irréversible une fois traitée.
              Si tu as encore une formation en cours, tu ne pourras plus y acceder.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Annulér
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteState === "sending"}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                {deleteState === "sending" ? "Envoi..." : "Confirmér la demande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
