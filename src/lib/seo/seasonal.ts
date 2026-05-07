import { createServiceClient } from "@/lib/supabase/server";

/**
 * Verifie si un lead_magnet saisonnier est actif.
 *
 * Utilise par les pages saisonnieres pour decider :
 *  - Si oui : indexable, dans le sitemap
 *  - Si non : noindex, exclue du sitemap
 *
 * Le cron seasonal-toggle (migration 035) bascule is_active selon
 * available_from/available_until tous les jours a 5h UTC.
 *
 * Cache 1h (revalidate) pour eviter de hit la DB a chaque generateMetadata.
 */
export async function isSeasonalLeadMagnetActive(slug: string): Promise<boolean> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("lead_magnets")
      .select("is_active")
      .eq("slug", slug)
      .maybeSingle();
    return Boolean(data?.is_active);
  } catch {
    // En cas d'erreur DB, on default a "actif" (mieux indexer accidentellement
    // qu'avoir une page indexable bloquee par un fail DB ponctuel).
    return true;
  }
}

/**
 * Liste les slugs des lead_magnets saisonniers actifs.
 * Utilise par sitemap.ts pour decider quoi inclure.
 */
export async function getActiveSeasonalSlugs(): Promise<string[]> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("lead_magnets")
      .select("slug")
      .eq("is_active", true)
      .not("available_from", "is", null);
    return (data || []).map((r) => r.slug as string);
  } catch {
    return [];
  }
}
