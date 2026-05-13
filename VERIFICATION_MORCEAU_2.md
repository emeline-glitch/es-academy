# Vérification Morceau 2 — Sécurité du code admin

**Date** : 2026-05-12 17:50
**Statut global** : ✅ TOUT VERT (8/8 checks passés, 2 nuances mineures de forme)

## Synthèse

| Check | Statut | Commentaire |
|---|---|---|
| 1. Commits git | ✅ | Les 2 commits `fix(security):` (4560473 et 9c180af) sont bien dans l'historique. Ils ne sont plus en HEAD~2..HEAD car Emeline a poussé d'autres commits depuis (banner Family, checkbox renonciation Stripe, fix unsubscribe HMAC, debug SNS). |
| 2. Fichiers modifiés | ✅ | Tous les fichiers attendus existent dans le repo (vérifiés un par un). Le helper s'appelle `src/lib/utils/admin-auth.ts`, pas `src/lib/auth/admin.ts` comme indiqué dans le brief. |
| 3. requireAdmin partout | ✅ | Les 7 routes admin contiennent toutes au moins un appel `requireAdmin()`, à toutes leurs méthodes exposées. Aucune route ne se contente d'un `getUser()` orphelin. |
| 4. Migration 046 propre | ✅ | Ancien secret `bk3JTO7` absent. 7 occurrences de `vault.decrypted_secrets` présentes (1 par cron resché + 1 dans le warning de bootstrap). |
| 5. Log d'exécution | ✅ | `EXECUTION_LOG_MORCEAU_2.md` présent à la racine, daté du 2026-05-12, complet et documente les blocages potentiels pour Emeline. |
| 6. Routes 401/403 | ✅ | 6 routes en 401, 2 routes en 405 (Method Not Allowed sur GET non exposé). Aucune fuite : pas de 200 ni 500 non maîtrisé. |
| 7. pg_cron + Vault | ✅ | 8 jobs `es-academy-*` actifs. Secret `cron_secret` présent dans `vault.secrets`. La commande de `es-academy-process-sequences` lit via `vault.decrypted_secrets` et ne contient pas l'ancien secret. |
| 8. Env vars locales | ✅ | `CRON_SECRET` local rotaté (prefix `6V2e...` ≠ ancien `bk3J...`). Vercel à confirmer côté Emeline. |

## Détail des outputs

### Check 1 : commits git

```
=== git log --oneline -5 ===
a73e798 feat(dashboard): remplace CTA Family HTML par bannière image officielle
4153c98 feat(stripe): checkbox renonciation retractation 14j + log consent_log
bbcf182 chore: remove debug/unsubscribe-check endpoint (A6 validation OK)
e1a02b2 debug(sns): store raw payload in audit_log on unknown notificationType
b9e25a5 debug: endpoint temporaire pour verifier UNSUBSCRIBE_SECRET en runtime
```

Les commits `fix(security):` ne sont pas en HEAD~2 mais existent bien plus loin dans l'historique :

```
9c180af fix(security): requireAdmin on 7 admin-territory routes (sequences + email campaigns)
4560473 fix(security): rotate CRON_SECRET to Supabase Vault, add audit_log cleanup cron
```

### Check 2 : fichiers modifiés

`git diff --name-only HEAD~2 HEAD` :
```
public/images/family-banner-formation.png
src/app/(platform)/dashboard/page.tsx
src/app/api/stripe/webhook/route.ts
src/lib/stripe/checkout.ts
```

Aucun fichier du morceau 2 dans cette fenêtre (logique, Emeline a continué à pousser depuis). Vérification existence dans le repo :

| Fichier attendu | Présent |
|---|---|
| `supabase/migrations/046_rotate_cron_secret.sql` | ✅ |
| `src/lib/utils/admin-auth.ts` (au lieu de `src/lib/auth/admin.ts`) | ✅ |
| `src/app/api/sequences/route.ts` | ✅ |
| `src/app/api/sequences/[id]/route.ts` | ✅ |
| `src/app/api/sequences/[id]/enroll/route.ts` | ✅ |
| `src/app/api/sequences/[id]/steps/route.ts` | ✅ |
| `src/app/api/sequences/[id]/steps/[stepId]/route.ts` | ✅ |
| `src/app/api/emails/campaigns/route.ts` | ✅ |
| `src/app/api/emails/campaigns/[id]/route.ts` | ✅ |
| `SECURITY_INCIDENT_001.md` | ✅ (4813 octets, daté 16:41) |

### Check 3 : requireAdmin présent sur chaque route

```
=== src/app/api/sequences/route.ts ===
3:import { requireAdmin } from "@/lib/utils/admin-auth";
10:  const auth = await requireAdmin();
54:  const auth = await requireAdmin();

=== src/app/api/sequences/[id]/route.ts ===
3:import { requireAdmin } from "@/lib/utils/admin-auth";
13:  const auth = await requireAdmin();
37:  const auth = await requireAdmin();
78:  const auth = await requireAdmin();

=== src/app/api/sequences/[id]/enroll/route.ts ===
2:import { requireAdmin } from "@/lib/utils/admin-auth";
9:  const auth = await requireAdmin();

=== src/app/api/sequences/[id]/steps/route.ts ===
3:import { requireAdmin } from "@/lib/utils/admin-auth";
10:  const auth = await requireAdmin();

=== src/app/api/sequences/[id]/steps/[stepId]/route.ts ===
3:import { requireAdmin } from "@/lib/utils/admin-auth";
12:  const auth = await requireAdmin();
33:  const auth = await requireAdmin();
66:  const auth = await requireAdmin();

=== src/app/api/emails/campaigns/route.ts ===
2:import { requireAdmin } from "@/lib/utils/admin-auth";
5:  const auth = await requireAdmin();

=== src/app/api/emails/campaigns/[id]/route.ts ===
3:import { requireAdmin } from "@/lib/utils/admin-auth";
11:  const auth = await requireAdmin();
72:  const auth = await requireAdmin();
```

Total : 7 fichiers, 13 appels `requireAdmin()` (un par méthode HTTP exposée). Aucun `getUser()` orphelin.

### Check 4 : migration 046 propre

```
=== grep ancien secret bk3JTO7 ===
OK : ancien secret absent

=== grep vault.decrypted_secrets ===
7 occurrences trouvées (1 par cron rescheduled + 1 ligne de commentaire)
OK : lecture Vault presente
```

### Check 5 : log d'exécution

`EXECUTION_LOG_MORCEAU_2.md` présent. Extraits clés :

- 2 commits livrés : `4560473 fix(security): rotate CRON_SECRET...` et `9c180af fix(security): requireAdmin on 7 routes...`
- Inventaire pg_cron avant rotation (7 jobs avec secret en clair dans 4 migrations différentes)
- Procédure de bascule (insérer secret dans Vault SQL Editor puis push migration)
- 7 routes patchées, 13 méthodes HTTP, pattern `requireAdmin()` partout
- Audit cross-codebase : `/api/admin/*` (25 routes), `/api/cron/*` (7 routes), webhooks Stripe/VideoAsk, tracking public, formulaires publics par design
- Anomalie hors scope notée : `/api/contacts/unsubscribe` sans token signé (depuis fix par commit 82bf01a "feat(unsubscribe): token HMAC...")
- Script de test `scripts/test-admin-routes-auth.mjs` créé mais non exécuté en runtime
- TypeScript `npx tsc --noEmit` passe sans erreur
- Aucun blocage majeur déclaré

### Check 6 : routes admin retournent 401/403 sans auth

```
=== sequences GET ===          HTTP 401
=== sequences POST ===         HTTP 401
=== campaigns GET ===          HTTP 405
=== campaigns POST ===         HTTP 401
=== sequence enroll ===        HTTP 401
=== sequence steps GET ===     HTTP 405
=== sequence by id ===         HTTP 401
=== campaign by id ===         HTTP 401
```

Note sur les 405 : `emails/campaigns/route.ts` et `sequences/[id]/steps/route.ts` n'exposent pas de `GET` (uniquement `POST`). Le 405 vient de Next.js avant même d'atteindre le handler. Pas un trou de sécurité, c'est plus strict qu'un 401 (la méthode n'est même pas autorisée).

### Check 7 : pg_cron + Vault

Le script `verify-cron-state.mjs` a été créé et exécuté. Comme prévu par le brief, la RPC `exec_sql` n'existe pas (404 PGRST202). Bascule sur Supabase MCP en accès direct DB.

**Liste des cron jobs (cron.job)** :
```
es-academy-chatel-reminders        | 0 6 * * *               | active
es-academy-cleanup-audit-log       | 0 3 * * 0               | active (NOUVEAU, ajouté par migration 046)
es-academy-detect-behavioral       | 0 */2 * * *             | active
es-academy-process-sequences       | */10 * * * *            | active
es-academy-retry-welcome-mail      | 5,15,25,35,45,55 * * *  | active
es-academy-seasonal-toggle         | 0 5 * * *               | active
es-academy-seo-audit               | 0 5 * * 1               | active
es-academy-seo-pagespeed           | 0 6 * * 1               | active
```

8 jobs actifs (le nouveau `es-academy-cleanup-audit-log` ajouté par migration 046 selon plan). Tous `active = true`.

**Vault secret `cron_secret`** :
```
name        : cron_secret
description : Bearer token pour les endpoints /api/cron/*
created_at  : 2026-04-20 13:28:53 UTC
```

Présent, créé bien avant la migration 046.

**Sample command process-sequences** :
```sql
SELECT net.http_post(
  url := 'https://emeline-siron.fr/api/cron/process-sequences',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 60000
);
```

Vérifications :
- ✅ Contient `vault.decrypted_secrets`
- ✅ Ne contient PAS l'ancien secret `bk3JTO7`
- ✅ URL prod correcte

### Check 8 : env vars locales

```
CRON_SECRET prefix local: 6V2e...
Ancien prefix attendu : bk3J (si match => secret PAS rotate localement)
```

Match négatif : le secret local est bien le nouveau (rotaté). À noter, le fichier `.env.local` est dans `.gitignore` et n'a pas été commité.

## Blocages détectés

**Aucun blocage**. Toutes les remediations du Morceau 2 sont en place côté DB, côté code, côté env vars locales.

## À confirmer manuellement par Emeline

- [ ] Vercel `CRON_SECRET` en Production (nouvelle valeur `6V2e...` synchronisée)
- [ ] Vercel `CRON_SECRET` en Preview
- [ ] Vercel `CRON_SECRET` en Development
- [ ] Redeploy Vercel effectué après changement env var
- [ ] Test runtime cron exécuté (bonus, optionnel) : vérifier dans Vercel logs runtime que les appels `/api/cron/*` reçoivent bien 200 avec le Bearer Vault → si le cron passe, l'auth fonctionne en runtime
- [ ] Anomalie `/api/contacts/unsubscribe` notée dans EXECUTION_LOG : a été corrigée depuis par le commit `82bf01a feat(unsubscribe): token HMAC` (à confirmer côté Emeline que c'est bien le même périmètre)

## Nuances de forme (mineur)

1. Le helper attendu `src/lib/auth/admin.ts` se trouve en réalité dans `src/lib/utils/admin-auth.ts`. Tous les imports sont cohérents avec ce chemin réel. Pas un problème de sécurité, juste un écart par rapport au brief.

2. Les commits `fix(security):` ne sont pas dans `HEAD~2..HEAD` au moment de cette vérification car Emeline a continué à pousser des features (Stripe checkbox, banner Family, fix unsubscribe HMAC, debug SNS). Ils sont bien dans l'historique (`git log --oneline -30 | grep fix(security)`).

## Recommandation

**Passer au Morceau 3.** Le Morceau 2 est techniquement complet :
- Code : 7 routes admin sécurisées, helper centralisé, vérifié sur prod (401/405 partout)
- DB : 8 cron jobs actifs, Vault opérationnel, ancien secret absent
- Env : secret rotaté localement

Les 2 nuances de forme (chemin helper + position des commits dans HEAD~2) ne sont pas bloquantes pour la sécurité réelle du système.

**Avant de passer au Morceau 3**, Emeline doit juste confirmer côté Vercel que le `CRON_SECRET` env var est bien synchronisé en prod + preview + dev (sans ça, les 8 cron jobs vont retourner 401 lors de leurs prochains runs, et ça se verra dans les logs Vercel).
