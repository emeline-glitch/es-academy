import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Settings SEO stockes en DB (table seo_settings), editables depuis /admin/seo.
 * Remplacent les anciens hardcodes dans audit.ts.
 *
 * 3 settings principaux :
 *  - key_landings : pages strategiques a monitorer
 *  - audit_thresholds : seuils utilises par l'auditeur (longueurs meta, etc.)
 *  - google_search_url : URL pour estimer indexation
 *
 * Cache react.cache() pour eviter d'appeler la DB plusieurs fois dans la meme requete.
 */

export interface KeyLanding {
  path: string;
  label: string;
  severity: "high" | "medium" | "low";
  monitor: boolean;
}

export interface AuditThresholds {
  title_min: number;
  title_max: number;
  desc_min: number;
  desc_max: number;
  article_stale_days: number;
  key_landing_min_views_30d: number;
  article_low_views_30d: number;
  publish_recent_days: number;
}

// Defaults (fallback si DB indispo, identiques au seed migration 044)
const DEFAULT_KEY_LANDINGS: KeyLanding[] = [
  { path: "/", label: "Homepage", severity: "high", monitor: true },
  { path: "/academy", label: "Page de vente Academy", severity: "high", monitor: true },
  { path: "/family", label: "Page de vente Family", severity: "high", monitor: true },
  { path: "/cahier-preview", label: "Cahier preview (lead magnet)", severity: "medium", monitor: true },
  { path: "/podcast", label: "Page podcast", severity: "medium", monitor: true },
  { path: "/a-propos", label: "A propos", severity: "medium", monitor: true },
  { path: "/blog", label: "Listing blog", severity: "medium", monitor: true },
  { path: "/glossaire", label: "Glossaire", severity: "medium", monitor: true },
  { path: "/outils-gratuits", label: "Outils gratuits", severity: "medium", monitor: true },
];

const DEFAULT_THRESHOLDS: AuditThresholds = {
  title_min: 30,
  title_max: 60,
  desc_min: 70,
  desc_max: 160,
  article_stale_days: 365,
  key_landing_min_views_30d: 30,
  article_low_views_30d: 5,
  publish_recent_days: 30,
};

export const getKeyLandings = cache(async (): Promise<KeyLanding[]> => {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("seo_settings")
      .select("value")
      .eq("key", "key_landings")
      .maybeSingle();
    if (!data?.value || !Array.isArray(data.value)) return DEFAULT_KEY_LANDINGS;
    return data.value as KeyLanding[];
  } catch {
    return DEFAULT_KEY_LANDINGS;
  }
});

export const getAuditThresholds = cache(async (): Promise<AuditThresholds> => {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("seo_settings")
      .select("value")
      .eq("key", "audit_thresholds")
      .maybeSingle();
    if (!data?.value || typeof data.value !== "object") return DEFAULT_THRESHOLDS;
    return { ...DEFAULT_THRESHOLDS, ...(data.value as Partial<AuditThresholds>) };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
});

export async function updateSetting(
  key: string,
  value: unknown,
  userId?: string
): Promise<void> {
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("seo_settings")
    .upsert(
      { key, value, ...(userId ? { updated_by: userId } : {}) },
      { onConflict: "key" }
    );
  if (error) throw new Error(`Failed to update setting ${key}: ${error.message}`);
}
