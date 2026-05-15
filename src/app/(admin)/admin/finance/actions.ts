"use server";

import { getCachedUser, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertOwner() {
  const user = await getCachedUser();
  if (!user) throw new Error("Non authentifie");
  const ownerEmails = (process.env.ADMIN_EMAIL || "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const userEmail = (user.email || "").toLowerCase();
  if (ownerEmails.length === 0 || !ownerEmails.includes(userEmail)) {
    throw new Error("Reserve a Emeline");
  }
}

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

/**
 * Server Action : update de l'objectif annuel + trimestriels.
 * Reservee a Emeline (n'importe quel email du csv ADMIN_EMAIL).
 */
export async function updateAnnualTarget(formData: FormData): Promise<void> {
  await assertOwner();

  const targetEur = parseEur(formData.get("target_eur"));
  const q1Eur = parseEur(formData.get("q1_target_eur"));
  const q2Eur = parseEur(formData.get("q2_target_eur"));
  const q3Eur = parseEur(formData.get("q3_target_eur"));
  const q4Eur = parseEur(formData.get("q4_target_eur"));
  const yearRaw = formData.get("year");
  const year = parseInt(typeof yearRaw === "string" ? yearRaw : "", 10);

  if (targetEur === null) throw new Error("L'objectif annuel est obligatoire");
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

  if (error) throw new Error(`Erreur DB : ${error.message}`);
  revalidatePath("/admin/finance");
}

/**
 * Server Action : ajout d'une charge fixe (recurring monthly par defaut).
 */
export async function addExpense(formData: FormData): Promise<void> {
  await assertOwner();

  const label = (formData.get("label") as string | null)?.trim() || "";
  const category = (formData.get("category") as string | null)?.trim() || "Autres";
  const amountEur = parseEur(formData.get("amount_eur"));
  const isRecurring = formData.get("is_recurring") === "on";
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  if (!label || label.length > 200) throw new Error("Label requis (max 200 chars)");
  if (amountEur === null || amountEur === 0) throw new Error("Montant requis");
  if (category.length > 60) throw new Error("Categorie trop longue");

  const supabase = await createServiceClient();
  const { error } = await supabase.from("finance_expenses").insert({
    label,
    category,
    amount_cents: Math.round(amountEur * 100),
    is_recurring_monthly: isRecurring,
    notes,
  });

  if (error) throw new Error(`Erreur DB : ${error.message}`);
  revalidatePath("/admin/finance");
}

/**
 * Server Action : suppression d'une charge fixe par id.
 */
export async function deleteExpense(formData: FormData): Promise<void> {
  await assertOwner();
  const id = (formData.get("id") as string | null)?.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("ID invalide");

  const supabase = await createServiceClient();
  const { error } = await supabase.from("finance_expenses").delete().eq("id", id);
  if (error) throw new Error(`Erreur DB : ${error.message}`);
  revalidatePath("/admin/finance");
}
