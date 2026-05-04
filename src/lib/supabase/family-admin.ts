import { createClient } from "@supabase/supabase-js";

/**
 * Client service-role pour Supabase Family (project hpcoxtpdsydcrwdudhsk,
 * séparé d'Academy tvkzndkywznaysiqvmsh).
 *
 * Utilisé UNIQUEMENT par le webhook Stripe centralisé (sur emeline-siron.fr)
 * pour propager :
 *  - Les achats Academy → champs `academy_gift_*` sur `profiles` Family
 *  - Les abonnements Family → row `subscriptions` Family + user auth Family
 *
 * NE PAS utiliser ce client côté pages publiques. Il bypass les RLS Family
 * et a tous les droits.
 *
 * Vars d'env requises (cf .env.local Academy) :
 *  SUPABASE_FAMILY_URL=https://hpcoxtpdsydcrwdudhsk.supabase.co
 *  SUPABASE_FAMILY_SERVICE_KEY=<service_role JWT>
 */
export function createFamilyAdminClient() {
  const url = process.env.SUPABASE_FAMILY_URL;
  const key = process.env.SUPABASE_FAMILY_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase Family non configuré : SUPABASE_FAMILY_URL ou SUPABASE_FAMILY_SERVICE_KEY manquant dans l'env."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
