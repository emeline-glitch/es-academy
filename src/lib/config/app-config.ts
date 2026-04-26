import type { createServiceClient } from "@/lib/supabase/server";

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

/**
 * Lit une valeur dans la table app_config.
 * Retourne `fallback` si la clé n'existe pas (pour rester robuste si la migration
 * 032 n'est pas appliquée ou si la valeur a été supprimée par erreur).
 */
export async function getAppConfig(
  supabase: SupabaseService,
  key: string,
  fallback: string
): Promise<string> {
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return data.value || fallback;
}

/**
 * Helper spécifique : calcule le wording paiement (1x, 3x, 4x) depuis app_config.
 *  - installments=1 → app_config.payment_label_one_shot
 *  - installments>1 → app_config.payment_label_multi_template avec {installments} interpolé
 */
export async function getPaymentLabel(
  supabase: SupabaseService,
  installments: number
): Promise<string> {
  if (installments <= 1) {
    return getAppConfig(supabase, "payment_label_one_shot", "998€ en une fois");
  }
  const tpl = await getAppConfig(
    supabase,
    "payment_label_multi_template",
    "{installments}x paiement mensuel"
  );
  return tpl.replace(/\{installments\}/g, String(installments));
}
