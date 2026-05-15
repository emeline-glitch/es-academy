"use server";

import { getCachedUser, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server Action : update de l'objectif annuel. Reservee a Emeline
 * (ADMIN_EMAIL premier email) via verification stricte. Si quelqu'un
 * d'autre essaie d'appeler cette action, on throw.
 */
export async function updateAnnualTarget(formData: FormData): Promise<void> {
  const user = await getCachedUser();
  if (!user) throw new Error("Non authentifie");

  const ownerEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().split(",")[0].trim();
  const userEmail = (user.email || "").toLowerCase();
  if (!ownerEmail || userEmail !== ownerEmail) {
    throw new Error("Reserve a Emeline");
  }

  // Parse helper : accepte "500000", "500 000", "500000.50", "500 000,50" (FR)
  // Retourne null si input vide (= laisser fallback annual/4 cote RPC).
  function parseEur(v: FormDataEntryValue | null): number | null {
    if (typeof v !== "string") return null;
    const cleaned = v.replace(/\s/g, "").replace(",", ".").trim();
    if (cleaned === "") return null;
    const n = parseFloat(cleaned);
    if (!Number.isFinite(n) || n < 0 || n > 100_000_000) {
      throw new Error("Montant invalide");
    }
    return n;
  }

  const targetEur = parseEur(formData.get("target_eur"));
  const q1Eur = parseEur(formData.get("q1_target_eur"));
  const q2Eur = parseEur(formData.get("q2_target_eur"));
  const q3Eur = parseEur(formData.get("q3_target_eur"));
  const q4Eur = parseEur(formData.get("q4_target_eur"));
  const yearRaw = formData.get("year");
  const year = parseInt(typeof yearRaw === "string" ? yearRaw : "", 10);

  if (targetEur === null) {
    throw new Error("L'objectif annuel est obligatoire");
  }
  if (!Number.isInteger(year) || year < 2024 || year > 2099) {
    throw new Error("Annee invalide");
  }

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("finance_targets")
    .upsert(
      {
        year,
        annual_target_cents: Math.round(targetEur * 100),
        q1_target_cents: q1Eur !== null ? Math.round(q1Eur * 100) : null,
        q2_target_cents: q2Eur !== null ? Math.round(q2Eur * 100) : null,
        q3_target_cents: q3Eur !== null ? Math.round(q3Eur * 100) : null,
        q4_target_cents: q4Eur !== null ? Math.round(q4Eur * 100) : null,
        notes: `Mis a jour par Emeline depuis /admin/finance le ${new Date().toLocaleDateString("fr-FR")}`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "year" },
    );

  if (error) {
    throw new Error(`Erreur DB : ${error.message}`);
  }

  revalidatePath("/admin/finance");
}
