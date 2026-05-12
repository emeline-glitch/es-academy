# Audit RLS, ES Academy

**Date** : 2026-05-12
**Auditor** : Claude Code (Morceau 3)
**Verdict global** : 🟠 (1 trou critique + 7 majeurs, aucune table sans RLS)

## Synthèse

- **38 tables** auditées, schéma `public`
- **25 policies** analysées
- **11 fonctions SECURITY DEFINER** auditées
- **1 view** auditée, 0 materialized view
- **Findings** : 1 🔴 / 7 🟠 / 4 🟡

Bonne nouvelle : RLS est activée sur toutes les tables `public`. La migration 044 a fermé les trous critiques d'origine. Les trous résiduels sont surtout du "fragile" (tables RLS-on-zero-policy qui marchent uniquement parce que le code utilise `createServiceClient()`) et une fonction RPC mal protégée.

## Tables, statut RLS

| Table | RLS | Pol. | Sévérité | Action requise |
|---|---|---|---|---|
| app_config | ✅ | 1 | 🟢 | RAS (data publique : prix, labels) |
| audit_log | ✅ | 1 | 🟠 | Ajouter INSERT policy pour cohérence |
| billing_reminders | ✅ | 1 | 🟢 | RAS (couvert par 044) |
| coaching_notes | ✅ | 1 | 🟢 | RAS |
| consent_log | ✅ | 1 | 🟢 | RAS (couvert par 044) |
| contact_events | ✅ | 1 | 🟢 | RAS (couvert par 044) |
| contact_list_folders | ✅ | 1 | 🟢 | RAS |
| contact_lists | ✅ | 1 | 🟢 | RAS |
| contact_notes | ✅ | 1 | 🟢 | RAS |
| **contacts** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **email_campaigns** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **email_sends** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **email_sequence_enrollments** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **email_sequence_steps** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **email_sequences** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| email_templates | ✅ | 1 | 🟢 | RAS (couvert par 044) |
| enrollments | ✅ | 1 | 🟢 | RAS |
| **family_subscriptions** | ✅ | **0** | 🟠 | Ajouter SELECT user_id + admin ALL |
| forms | ✅ | 1 | 🟡 | Ajouter admin ALL pour cohérence (mineur) |
| lead_magnets | ✅ | 1 | 🟢 | RAS (publique par design) |
| processed_dunning_invoices | ✅ | 1 | 🟢 | RAS (couvert par 044) |
| **processed_sns_messages** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **processed_stripe_events** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| profiles | ✅ | 3 | 🟠 | Ajouter policy admin ALL (manque INSERT/DELETE) |
| progress | ✅ | 3 | 🟢 | RAS |
| quiz_options | ✅ | 1 | 🟢 | RAS |
| quiz_questions | ✅ | 1 | 🟢 | RAS |
| quiz_responses | ✅ | 1 | 🟢 | RAS (couvert par 044) |
| quiz_results | ✅ | 2 | 🟢 | RAS |
| **rate_limits** | ✅ | **0** | 🟠 | Ajouter policy admin SELECT + service_role |
| **seasonal_enrollments** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **seo_audits** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **seo_keyword_history** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **seo_page_views** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **seo_pagespeed_history** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **seo_recommendations** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **seo_settings** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |
| **seo_target_keywords** | ✅ | **0** | 🟠 | Ajouter policy admin ALL |

## Findings critiques 🔴

### F1 : remove_tag_from_all_contacts, RPC SECURITY DEFINER ouverte à tous

**Sévérité** : 🔴

**Description** : la fonction `public.remove_tag_from_all_contacts(text)` est `SECURITY DEFINER`, sans `SET search_path`, sans contrôle d'identité, et avec `EXECUTE` accordé à `PUBLIC` (donc anon + authenticated). Le code de la fonction :

```sql
UPDATE public.contacts
  SET tags = array_remove(tags, tag_to_remove)
  WHERE tag_to_remove = ANY(tags);
```

**Risque concret** : n'importe quel visiteur du site (même non authentifié) peut appeler

```js
supabase.rpc('remove_tag_from_all_contacts', { tag_to_remove: 'membre-academy' })
```

via le client public et flush n'importe quel tag des 35 000 contacts. Vecteur de sabotage trivial (segmentation des séquences mail détruite, perte de l'historique de tagging).

**Fix proposé** (migration 048) :

```sql
REVOKE EXECUTE ON FUNCTION public.remove_tag_from_all_contacts(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_tag_from_all_contacts(text) TO service_role;

CREATE OR REPLACE FUNCTION public.remove_tag_from_all_contacts(tag_to_remove text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) AND current_setting('role') <> 'service_role' THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  UPDATE public.contacts
    SET tags = array_remove(tags, tag_to_remove)
    WHERE tag_to_remove = ANY(tags);
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;
```

**Référence migration** : `048_fix_rls_critical.sql` bloc F1.

## Findings majeurs 🟠

### F2 : 12 tables RLS-on-zero-policy (donnees sensibles)

**Sévérité** : 🟠

**Description** : 12 tables ont RLS activée mais aucune policy. Postgres bloque alors tout accès via les rôles `anon` et `authenticated` (et donc via le client cookie/anon). En pratique, le code utilise `createServiceClient()` qui bypass RLS, donc tout marche. Mais c'est fragile :

- Si un dev passe par `createClient()` (client cookie) par mégarde pour ces tables, accès silencieusement bloqué.
- Si une policy permissive (`USING true`) est ajoutée par erreur lors d'une future migration, les 35 000 emails ou tous les sends sortent.
- Pas de défense en profondeur : une fuite de la `service_role` key expose tout.

Tables concernées : `contacts`, `email_campaigns`, `email_sends`, `email_sequence_enrollments`, `email_sequence_steps`, `email_sequences`, `processed_sns_messages`, `processed_stripe_events`, `rate_limits`, `seasonal_enrollments`, plus les 7 tables `seo_*`.

**Risque concret** : pour `contacts`, la table contient 35 000 emails opt-in du dump Brevo. Une mauvaise migration ouvre fuite massive.

**Fix proposé** : ajouter pour chacune une policy `FOR ALL TO authenticated USING (is_admin)`. Le service_role continue de bypass.

**Référence migration** : `048_fix_rls_critical.sql` blocs F2.

### F3 : family_subscriptions, user ne voit pas sa propre souscription

**Sévérité** : 🟠

**Description** : `family_subscriptions` RLS activée, 0 policy. Les abonnés Family qui voudraient consulter leur souscription (statut, période, prochain paiement) depuis le client cookie n'ont aucun accès. Tout le code passe par les routes API server-side avec service_role pour l'instant, mais c'est limitant pour le futur (page profil Family lit la subscription).

**Fix proposé** : policy `SELECT WHERE user_id = auth.uid()` + admin ALL.

**Référence migration** : `048_fix_rls_critical.sql` bloc F3.

### F4 : cleanup_old_audit_log et cleanup_rate_limits exposees a anon

**Sévérité** : 🟠

**Description** : ces deux fonctions `SECURITY DEFINER` font `DELETE` sur leurs tables respectives et sont accessibles via `EXECUTE TO PUBLIC` (donc anon + authenticated). Pas de `SET search_path`.

**Risque concret** : un attaquant authentifié (ou même anon) peut appeler `supabase.rpc('cleanup_old_audit_log')` à volonté pour purger l'audit_log antérieur à 90 jours, et `cleanup_rate_limits` pour wipe les rate limits historiques. Ne casse pas la sécurité immédiate mais détruit les traces.

**Fix proposé** : `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` + `GRANT TO service_role` + `SET search_path = public, pg_temp`. Les pg_cron jobs continueront à fonctionner via service_role.

**Référence migration** : `048_fix_rls_critical.sql` bloc F4.

### F5 : handle_new_user et sync_email_to_profile sans search_path

**Sévérité** : 🟠

**Description** : ces deux triggers `SECURITY DEFINER` n'ont pas `SET search_path`. Théoriquement, un attaquant qui contrôlerait le `search_path` au moment du trigger pourrait piéger les références non qualifiées. En pratique, les références sont qualifiées (`public.profiles`), mais la défense en profondeur est manquante.

**Fix proposé** : ajouter `SET search_path = public, pg_temp` sur les deux fonctions.

**Référence migration** : `048_fix_rls_critical.sql` bloc F5.

### F6 : audit_log, pas de policy INSERT

**Sévérité** : 🟠

**Description** : `audit_log` n'a qu'une policy `SELECT admin`. Les INSERT depuis `createClient()` (rôle authenticated) ne fonctionneraient pas. Aujourd'hui tous les logs passent par service_role donc OK, mais c'est fragile.

**Fix proposé** : ajouter `INSERT TO authenticated WITH CHECK (is_admin)` (admin peut logguer ses propres actions) et garder le bypass service_role.

**Référence migration** : `048_fix_rls_critical.sql` bloc F6.

### F7 : profiles, admin ne peut pas lire les autres profils

**Sévérité** : 🟠

**Description** : `profiles` a 3 policies : SELECT/UPDATE user own + UPDATE admin coaching credits. Pas de policy admin SELECT/INSERT/DELETE. Donc un admin via cookie ne peut pas lister/créer/supprimer des profils. Aujourd'hui les routes admin passent par service_role, mais cohérence faible.

**Fix proposé** : ajouter policy `FOR ALL TO authenticated USING (is_admin)`.

**Référence migration** : `048_fix_rls_critical.sql` bloc F7.

### F8 : View contact_lists_with_count en SECURITY DEFINER par defaut

**Sévérité** : 🟠

**Description** : la vue `contact_lists_with_count` lit `contact_lists` et `contacts`. Par défaut Postgres, une vue s'exécute avec les permissions du créateur (souvent postgres), donc elle peut contourner les RLS de `contacts`. Si jamais une policy `SELECT TO anon` est ajoutée à `contact_lists`, la vue exposerait aussi des counts de tags des contacts.

**Fix proposé** : `ALTER VIEW public.contact_lists_with_count SET (security_invoker = true)`. À partir de Postgres 15, le mode invoker fait que la vue s'exécute avec les permissions de l'appelant, donc les RLS de `contacts` s'appliquent.

**Référence migration** : `048_fix_rls_critical.sql` bloc F8.

## Findings mineurs 🟡

### M1 : Pattern admin check repete 11 fois

**Sévérité** : 🟡

`EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` est inliné dans 11 policies. Une fonction `public.is_admin()` SECURITY DEFINER, STABLE, SET search_path déduplicrait et améliorerait les plans (cached per-statement).

**Non fixé dans 048** : refactor à coordonner sur l'ensemble des policies existantes (risque casse), à traiter au morceau 4 si validé.

### M2 : forms, pas de policy admin ALL

**Sévérité** : 🟡

`forms` a seulement une policy `SELECT WHERE status = 'published'`. Admin doit créer/éditer via service_role. Cohérent mais sous-documenté.

**Non fixé dans 048** : ajouter une policy admin ALL serait propre, mais pas critique car flux contrôlé.

### M3 : seo_* fonctions EXECUTE PUBLIC

**Sévérité** : 🟡

Les 6 fonctions `seo_dashboard_stats`, `seo_keyword_history_chart`, `seo_latest_pagespeed`, `seo_top_campaigns`, `seo_top_pages`, `seo_top_sources` sont `SECURITY DEFINER + SET search_path` (OK) mais accessibles à `PUBLIC`. Les données SEO (top pages, pagespeed scores) ne sont pas confidentielles. Risque faible mais propre serait de revoke + grant service_role uniquement.

**Non fixé dans 048** : à traiter au morceau 4 si confirmation que les routes admin SEO passent toujours par service_role (vérifié : oui, `src/app/(admin)/admin/seo/page.tsx` utilise `createServiceClient()`).

### M4 : app_config policy USING true

**Sévérité** : 🟡 (initialement classé 🔴, requalifié après inspection du contenu)

`app_config` policy `[SELECT] anon_select_app_config USING true`. Contenu actuel : prix Academy (998€), labels paiement, prix Family standard/alumni, deadline offre, mois trial. Tout est destiné à l'affichage public sur les landings, donc OK.

**Non fixé dans 048** : noter "ne jamais ajouter de feature flag privé ou clé d'API dans `app_config`". Si besoin un jour, créer une table `app_config_admin` avec policy admin-only.

## Fonctions SECURITY DEFINER, recap

| Fonction | search_path | check auth | EXECUTE public | Sévérité initiale | Action 048 |
|---|---|---|---|---|---|
| remove_tag_from_all_contacts | ❌ | ❌ | ✅ | 🔴 F1 | REVOKE + check admin + search_path |
| cleanup_old_audit_log | ❌ | ❌ | ✅ | 🟠 F4 | REVOKE + search_path |
| cleanup_rate_limits | ❌ | ❌ | ✅ | 🟠 F4 | REVOKE + search_path |
| handle_new_user (trigger) | ❌ | ❌ | ✅ | 🟠 F5 | search_path |
| sync_email_to_profile (trigger) | ❌ | ❌ | ✅ | 🟠 F5 | search_path |
| seo_dashboard_stats | ✅ | ❌ | ✅ | 🟡 M3 | rien (data non sensible) |
| seo_keyword_history_chart | ✅ | ❌ | ✅ | 🟡 M3 | rien |
| seo_latest_pagespeed | ✅ | ❌ | ✅ | 🟡 M3 | rien |
| seo_top_campaigns | ✅ | ❌ | ✅ | 🟡 M3 | rien |
| seo_top_pages | ✅ | ❌ | ✅ | 🟡 M3 | rien |
| seo_top_sources | ✅ | ❌ | ✅ | 🟡 M3 | rien |

## Tables sans RLS detectees

Aucune. Toutes les 38 tables `public` ont RLS activée.

## Views et materialized views

| Type | Nom | Sécurité | Action |
|---|---|---|---|
| view | contact_lists_with_count | DEFINER (bypass RLS contacts) | ALTER SET security_invoker (F8) |

Pas de materialized view.

## Recommandations

1. **Push migration 048** dès que possible. Le fix F1 est urgent (vandalisme trivial possible sur les tags).
2. **Convention équipe** : pour toute nouvelle table sensible, créer en même temps : RLS enabled, policy user own (SELECT WHERE user_id = auth.uid()) si pertinent, policy admin ALL. Bannir le pattern "RLS on + zero policy".
3. **Convention fonctions SECURITY DEFINER** : toujours `SET search_path = public, pg_temp` + REVOKE EXECUTE FROM PUBLIC + GRANT explicitement aux rôles légitimes.
4. **Morceau 4 candidate** : créer la fonction helper `public.is_admin()` STABLE SECURITY DEFINER et migrer les 11 policies existantes vers ce pattern (gain perf + lisibilité).
5. **Morceau 4 candidate** : revoke EXECUTE PUBLIC sur les 6 fonctions seo_* (M3) une fois la migration de tout consommateur confirmée sur service_role.

## Tests post-migration

À exécuter par Emeline dans Supabase SQL Editor après push migration 048 :

```sql
-- Test 1 : un user non-admin ne peut plus appeler remove_tag_from_all_contacts
-- (doit lever permission denied)
SET LOCAL ROLE authenticated;
SELECT public.remove_tag_from_all_contacts('test-tag');
-- Attendu : ERREUR "permission denied for function remove_tag_from_all_contacts"
RESET ROLE;

-- Test 2 : un user authentifie ne peut pas lire contacts (RLS bloque, pas de policy)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
SELECT count(*) FROM public.contacts;
-- Attendu : 0 (RLS bloque)
RESET ROLE;

-- Test 3 : un admin authentifie peut lire contacts (nouvelle policy admin ALL)
-- Remplace <ADMIN_USER_UUID> par un vrai UUID admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<ADMIN_USER_UUID>';
SELECT count(*) FROM public.contacts;
-- Attendu : nombre reel de contacts
RESET ROLE;

-- Test 4 : un user Family peut lire sa souscription
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<USER_FAMILY_UUID>';
SELECT * FROM public.family_subscriptions;
-- Attendu : ses lignes seulement (filtre user_id = auth.uid())
RESET ROLE;

-- Test 5 : verifier que cleanup_* ne sont plus appelables par anon/authenticated
SET LOCAL ROLE authenticated;
SELECT public.cleanup_old_audit_log();
-- Attendu : ERREUR permission denied
RESET ROLE;

-- Test 6 : verifier que service_role peut toujours
SET LOCAL ROLE service_role;
SELECT public.cleanup_old_audit_log();
-- Attendu : OK (retourne nombre de lignes supprimees)
RESET ROLE;
```

À tester aussi depuis le client TypeScript (Next.js dev local ou prod) :

```ts
// Doit echouer (rate limit + permission)
const client = createClient(...); // client public, role anon
const { error } = await client.rpc('remove_tag_from_all_contacts', { tag_to_remove: 'membre' });
console.assert(error?.code === '42501', 'Devrait etre permission denied');
```
