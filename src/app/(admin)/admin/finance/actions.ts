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

  const targetRaw = formData.get("target_eur");
  const yearRaw = formData.get("year");

  // Accepte "500000", "500 000", "500000.50", "500 000,50" (FR notation)
  const targetStr = typeof targetRaw === "string"
    ? targetRaw.replace(/\s/g, "").replace(",", ".")
    : "";
  const targetEur = parseFloat(targetStr);
  const year = parseInt(typeof yearRaw === "string" ? yearRaw : "", 10);

  if (!Number.isFinite(targetEur) || targetEur < 0 || targetEur > 100_000_000) {
    throw new Error("Montant invalide");
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
