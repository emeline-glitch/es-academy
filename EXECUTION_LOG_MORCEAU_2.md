# EXECUTION LOG MORCEAU 2 - Sécurité du code admin

**Date** : 2026-05-12
**Référence** : AUDIT_STRESS_TEST.md sections 5.1 et 6.5
**Hébergement** : Vercel (pas Netlify)
**Branche** : main

## Commits livrés

1. `4560473` fix(security): rotate CRON_SECRET to Supabase Vault, add audit_log cleanup cron
2. `9c180af` fix(security): requireAdmin on 7 admin-territory routes (sequences + email campaigns)

(Un commit intermédiaire `6ec0462` provient d'un autre process : cron sync SES suppression, hors scope.)

## FIX 1 : Rotation CRON_SECRET vers Supabase Vault

### Inventaire pg_cron avant rotation

Le secret `bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U` était hardcodé dans 4 migrations :

- `023_pg_cron_setup.sql` : jobs process-sequences, detect-behavioral, chatel-reminders
- `027_welcome_mail_retry.sql` : job retry-academy-welcome-mail
- `035_seasonal_toggle_cron.sql` : job seasonal-toggle
- `045_seo_pg_cron_jobs.sql` : jobs seo-audit, seo-pagespeed

Total : 7 jobs pg_cron actifs avec secret en clair.

### Actions effectuées

1. **Migration `046_rotate_cron_secret.sql` créée** :
   - Active `CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault`
   - Warning si secret manquant dans Vault au moment de l'apply
   - Unschedule des 7 jobs existants (plus le nouveau cleanup, idempotent)
   - Re-schedule de chaque job avec `Authorization: Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)`
   - Ajout du cron manquant `es-academy-cleanup-audit-log` (dimanche 3h UTC, audit section 5.2)

2. **Endpoints `/api/cron/*/route.ts` audités (7 endpoints)** :
   - Tous utilisent déjà le pattern strict `process.env.CRON_SECRET` avec comparaison directe `provided !== expectedSecret`
   - 401 sur missing/invalid, 500 sur env var manquante
   - **Aucun patch code requis côté Next.js**

3. **`SECURITY_INCIDENT_001.md` créé** : documente l'incident, la rotation, la procédure de bascule (SQL Editor + Vercel env vars), et la recommandation Option A (ne pas force-push, repo privé + ancien secret révoqué = risque résiduel faible).

### Procédure de bascule (à exécuter par Emeline)

```sql
-- Dans Supabase SQL Editor (prod), avant push migration 046 :
SELECT vault.create_secret(
  '<NOUVEAU_SECRET_CRON>',
  'cron_secret',
  'CRON_SECRET pour authentification des jobs pg_cron via /api/cron/*'
);
```

Puis push migration via `./scripts/apply-migration.sh` ou `supabase db push`,
et mettre à jour `CRON_SECRET` côté Vercel env vars (redeploy auto).

## FIX 2 : requireAdmin sur 7 routes admin-territory

### Helper `requireAdmin` (src/lib/utils/admin-auth.ts)

Existait déjà avec `userId` retourné. Étendu pour :
- Support csv pour `ADMIN_EMAIL` (Emeline + futurs comptes admin)
- Retourne désormais `supabase` et `user` en plus de `userId` (champs ajoutés, n'impacte pas les 25 autres call sites existants)

### Routes patchées

| Route | Méthodes |
|---|---|
| `src/app/api/sequences/route.ts` | GET, POST |
| `src/app/api/sequences/[id]/route.ts` | GET, PATCH, DELETE |
| `src/app/api/sequences/[id]/enroll/route.ts` | POST |
| `src/app/api/sequences/[id]/steps/route.ts` | POST |
| `src/app/api/sequences/[id]/steps/[stepId]/route.ts` | GET, PATCH, DELETE |
| `src/app/api/emails/campaigns/route.ts` | POST |
| `src/app/api/emails/campaigns/[id]/route.ts` | GET, PATCH |

Total : 7 routes, 13 méthodes HTTP. Pattern remplacé partout :

```ts
// AVANT
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

// APRÈS
const auth = await requireAdmin();
if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
const supabase = auth.supabase;
```

### Audit cross-codebase des autres routes

Grep récursif effectué sur `src/app/api/**` pour repérer les routes qui touchent aux tables sensibles (contacts, contact_lists, forms, contact_notes, audit_log, email_sequences, email_campaigns, lead_magnets) sans `requireAdmin`.

**Résultat** : tous les autres endpoints sont déjà protégés correctement :

- `/api/admin/*` (25 routes) : `requireAdmin` déjà appliqué
- `/api/cron/*` (7 routes) : Bearer `CRON_SECRET`
- `/api/automations` : Bearer `REVALIDATION_SECRET` (cron-like, OK)
- `/api/revalidate` : Bearer `REVALIDATION_SECRET`
- `/api/webhooks/videoask` : header X-VideoAsk-Secret
- `/api/webhooks/stripe` : signature Stripe (hors scope par règle)
- `/api/track/click`, `/api/track/open`, `/api/track/page-view` : tracking public par design
- `/api/forms/[slug]` (GET) et `/api/forms/[slug]/submit` (POST) : public par design + rate limit
- `/api/quiz` et `/api/quiz/submit` : user authentifié sur ses propres données

### Anomalie hors scope

`/api/contacts/unsubscribe` (POST) : ne vérifie aucun token signé. N'importe qui peut désinscrire n'importe quel email en POSTant `{email: "victim@example.com"}`. Pas un trou critique (pas de PII exposée, RGPD-friendly côté désinscription), mais devrait à terme utiliser un token HMAC signé par mail. **Hors scope du morceau 2, à traiter dans un morceau dédié.**

### Test d'intégration

`scripts/test-admin-routes-auth.mjs` créé :
- Crée un user test via `auth.admin.createUser` (service role)
- Upsert profile avec `role = 'user'` (pas admin)
- Sign-in pour récupérer un JWT
- Tape les 13 endpoints en POST/PATCH/DELETE/GET avec le JWT en cookie ET en header Authorization
- Vérifie que chaque appel retourne 403 ou 401 (jamais 2xx)
- Cleanup automatique du user test (signal SIGINT inclus)

**Non exécuté en réel** :
- Dev server local non démarré (consigne Emeline : ne jamais kill un port sans OK explicite)
- Création d'un vrai user en prod Supabase = action visible / coût
- Le script reste utilisable manuellement : `BASE_URL=https://emeline-siron.fr node scripts/test-admin-routes-auth.mjs`

### Validation TypeScript

`npx tsc --noEmit` : passe sans erreur (run effectué deux fois pendant l'exécution).

## Blocages rencontrés

Aucun blocage majeur.

Points d'attention pour Emeline :

1. **Avant de push la migration 046** : insérer le nouveau CRON_SECRET dans Vault via Supabase SQL Editor (cf. SECURITY_INCIDENT_001.md). Sinon les 7 cron jobs vont retourner 401 jusqu'à insertion.

2. **Côté Vercel** : mettre à jour la variable d'env `CRON_SECRET` sur production + preview branches, déclencher un redeploy. Les endpoints continueront à fonctionner avec l'ancien secret tant que Vercel n'est pas rebuild.

3. **`automations/route.ts`** utilise `REVALIDATION_SECRET` (et non `CRON_SECRET`) pour son auth Bearer. Le code apparaît legacy (concurrence avec `process-sequences`). À évaluer : suppression complète ou alignement sur `CRON_SECRET`. Hors scope morceau 2.

4. **Décision purge git history** : Option A retenue par défaut (repo privé + secret révoqué = risque résiduel faible). Si Emeline veut Option B (filter-repo + force-push), à arbitrer ensuite.

5. **Test d'intégration non exécuté** : le script doit tourner contre un environnement live (local ou prod). Recommandation : le tester d'abord en local en démarrant manuellement le dev server, puis valider en prod après push migration.

## Fichiers livrés

```
SECURITY_INCIDENT_001.md                                              (nouveau)
supabase/migrations/046_rotate_cron_secret.sql                        (nouveau)
src/lib/utils/admin-auth.ts                                           (étendu)
src/app/api/sequences/route.ts                                        (modifié)
src/app/api/sequences/[id]/route.ts                                   (modifié)
src/app/api/sequences/[id]/enroll/route.ts                            (modifié)
src/app/api/sequences/[id]/steps/route.ts                             (modifié)
src/app/api/sequences/[id]/steps/[stepId]/route.ts                    (modifié)
src/app/api/emails/campaigns/route.ts                                 (modifié)
src/app/api/emails/campaigns/[id]/route.ts                            (modifié)
scripts/test-admin-routes-auth.mjs                                    (nouveau)
EXECUTION_LOG_MORCEAU_2.md                                            (ce fichier)
```
