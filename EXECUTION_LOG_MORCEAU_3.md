# EXECUTION LOG MORCEAU 3, Audit RLS + Validation Zod

**Date** : 2026-05-12
**Reference** : AUDIT_STRESS_TEST.md sections 6 (securite Supabase) et 5.3 (validation)
**Branche** : main
**Hebergement** : Vercel

## Commits livres

1. `cc3af7e` fix(rls): audit complet et migration corrective des trous critiques
2. `84940b1` perf(public): next/image, fonts, lazy loading composants lourds

**ATTENTION** : le commit 2 a ete cree par une session Claude Code parallele
qui a fait `git add -A` ou similaire. Il contient effectivement le travail
du Chantier B (validators Zod + application sur 7 routes publiques + script
de test) AUSSI BIEN QUE des changements perf(public) qui ne sont pas a moi.
Le message commit ne reflete donc pas le scope reel.

Files du Chantier B reellement inclus dans 84940b1 :
- src/lib/validators/* (10 nouveaux fichiers)
- src/app/api/auth/send-magic-link/route.ts (modifie)
- src/app/api/contacts/unsubscribe/route.ts (modifie)
- src/app/api/forms/[slug]/submit/route.ts (modifie)
- src/app/api/site-auth/route.ts (modifie)
- src/app/api/stripe/checkout/route.ts (modifie)
- src/app/api/stripe/checkout-family/route.ts (modifie)
- src/app/api/stripe/webhook/route.ts (modifie, validation light apres signature)
- src/app/api/track/page-view/route.ts (modifie)
- scripts/audits/test-validation.mjs (nouveau)

Recommandation pour Emeline : si tu veux pouvoir retrouver ces changements
dans le log, considere `git log --follow src/lib/validators/index.ts` pour
voir que c est bien le commit 84940b1.

## CHANTIER A : Audit RLS complet

### A.1 : Cartographie

Script `scripts/audits/audit-rls.mjs` cree pour interroger Supabase via
la Management API. Extrait :

- 38 tables `public` (toutes ont RLS activee, 0 sans RLS)
- 25 policies
- 11 fonctions SECURITY DEFINER
- 1 view (`contact_lists_with_count`), 0 materialized view

### A.2-A.4 : Classification + rapport

`RLS_AUDIT.md` produit avec verdict global 🟠 :

**1 critique 🔴** : `remove_tag_from_all_contacts` (SECURITY DEFINER + EXECUTE
TO PUBLIC + UPDATE contacts + pas de check admin), exploitable par
n importe quel anon via supabase.rpc().

**7 majeurs 🟠** :
- F2 : 17 tables RLS-on-zero-policy (donnees sensibles)
- F3 : family_subscriptions ne permet pas a son user de lire sa souscription
- F4 : cleanup_old_audit_log et cleanup_rate_limits exposees a anon
- F5 : handle_new_user et sync_email_to_profile sans SET search_path
- F6 : audit_log pas de policy INSERT
- F7 : profiles pas de policy admin SELECT/INSERT/DELETE
- F8 : view contact_lists_with_count en SECURITY DEFINER par defaut

**4 mineurs 🟡** :
- M1 : pattern admin check repete 11x (refactor is_admin())
- M2 : forms sans policy admin ALL
- M3 : seo_* fonctions EXECUTE PUBLIC mais data non sensible
- M4 : app_config policy USING true (requalifie OK car data publique)

### A.5 : Migration 048_fix_rls_critical.sql

Cree, appliquee en prod via `bash scripts/apply-migration.sh` (HTTP 201).
Re-audit post-migration : 0 table zero-policy, tous SECURITY DEFINER ont
search_path, RPC sensibles limitees a service_role.

Note importante : 049 n etait pas pris mais 050_platform_profile_extra.sql
existe deja en untracked dans une autre session, donc j ai numerote 048.

Mineurs M1-M4 notes dans RLS_AUDIT.md, **non fixes** dans 048 selon brief.
A traiter morceau 4 si valide.

### A.6 : Tests post-migration

6 requetes SQL fournies dans RLS_AUDIT.md a executer par Emeline depuis
Supabase SQL Editor (test RPC bloque pour anon, lecture admin OK, etc.).

## CHANTIER B : Validation Zod centralisee

### B.1 : Inventaire routes publiques

Routes publiques effectivement identifiees (8) :
- `/api/auth/send-magic-link` POST
- `/api/contacts/unsubscribe` POST (cas special, refine token OR source=manual)
- `/api/forms/[slug]/submit` POST
- `/api/site-auth` POST
- `/api/stripe/checkout` POST (Academy)
- `/api/stripe/checkout-family` GET + POST
- `/api/stripe/webhook` POST (cas special, signature d abord)
- `/api/track/page-view` POST

Routes publiques NON wrappees (par decision motivee) :
- `/api/og` GET : deja robuste via `.slice(0, N)` + `pickVariant` whitelist.
  Wrapper Zod doublonnerait sans gain.
- `/api/track/click` GET et `/api/track/open` GET : query params triviaux
  (sid + url), guards existants suffisants. A traiter morceau 4 si besoin.
- `/api/aws/sns/webhook` et `/api/webhooks/videoask` : signatures externes
  + payloads heterogenes. Defense en profondeur Zod non prioritaire.

Routes attendues mais inexistantes (mentionnees au brief) :
- `/api/leads`, `/api/newsletter`, `/api/contact` : pas dans le codebase
  Academy. Probablement confusion avec d autres projets (Solstice).

### B.2 : Structure validators

`src/lib/validators/` avec :
- `common.ts` : EmailSchema, FrenchPhoneSchema, NameSchema, TextareaSchema,
  UrlSchema, UuidSchema, SlugSchema
- `auth.ts` : MagicLinkRequestSchema, SiteAuthSchema
- `unsubscribe.ts` : UnsubscribeRequestSchema (.refine token OR source=manual)
- `form-submission.ts` : FormSubmissionSchema (.strict + literal(true) consent)
- `stripe-checkout.ts` : AcademyCheckoutSchema (1x/3x/4x),
  FamilyCheckoutSchema, FamilyCheckoutQuerySchema
- `stripe-webhook.ts` : StripeWebhookEventSchema (sans .strict, defense en
  profondeur uniquement)
- `tracking.ts` : TrackPageViewSchema (strict, tous champs optionnels),
  TrackClickQuerySchema, TrackOpenQuerySchema
- `og.ts` : OgQuerySchema (laxiste)
- `validate.ts` : helpers validateBody() et validateQuery()
- `index.ts` : barrel re-exports

Zod v4 utilise (`zod@4.3.6` deja installe).

### B.3-B.4 : Application

Pattern AVANT → APRES applique partout :
```ts
// AVANT
const body = await request.json();
if (!body.email || typeof body.email !== "string") return 400;

// APRES
const v = await validateBody(request, SomeSchema);
if (!v.ok) return v.response;
const { email, ... } = v.data; // typees + trim + tolowercase deja faits
```

`.strict()` partout pour refuser les champs en plus (anti-injection).
Exception : `StripeWebhookEventSchema` (les events Stripe ont des champs
variables selon le type).

Cas special Stripe webhook : validation AJOUTEE apres `constructEvent()`
(signature Stripe reste la garde principale). Si shape inconnu, 400.

Cas special unsubscribe : `.refine()` exige `token` OU `source: "manual"`.
Toute autre forme (email seul) est rejetee avec 400. Note : la verification
HMAC du token (`verifyUnsubscribeToken`) est DEJA implementee dans le code,
le brief mentionnait morceau 4 mais c est deja fait.

### B.5 : Tests

`scripts/audits/test-validation.mjs` cree avec 16 assertions sur :
- /api/site-auth (4 tests)
- /api/auth/send-magic-link (4 tests)
- /api/contacts/unsubscribe (5 tests)
- /api/stripe/checkout (3 tests)
- /api/track/page-view (3 tests)

**Non execute en local** : conformement a la consigne "ne pas killer les
ports/process", je n ai pas demarre `npm run dev`. Le script est lance par
Emeline via :
```
BASE_URL=http://localhost:3001 node scripts/audits/test-validation.mjs
```
ou contre prod (avec prudence : ca cree des leads tests et envoie un mail).

### Validation TypeScript

`npx tsc --noEmit` passe sans erreur apres tous les changements.

## CHANTIER C : Rate limit Upstash

**Reporte** : Upstash Redis n est PAS configure dans .env.local
(aucune variable `UPSTASH_REDIS_REST_URL` ou `UPSTASH_REDIS_REST_TOKEN`).
`@upstash/ratelimit` n est pas non plus dans `package.json`.

Action requise par Emeline :
1. Creer un Redis Upstash gratuit sur https://upstash.com
2. Ajouter dans `.env.local` + Vercel env vars :
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=AYx...
   ```
3. `npm install @upstash/ratelimit @upstash/redis`
4. Re-lancer le morceau 3 sur la partie Chantier C uniquement.

En attendant, le rate limit in-memory existant via `@/lib/utils/rate-limit`
(buckets en RAM, perdu au redeploy) protege `/api/forms/[slug]/submit`
et `/api/contacts/route.ts`. C est suffisant pour le launch low-traffic.

## Blocages rencontres

### Blocage 1 : commit Chantier B capture par une session concurrente

Le commit `84940b1 perf(public)` a ete cree par une autre session Claude
Code en parallele, qui a fait un `git add -A` (ou equivalent) et a inclus
les changements Chantier B (validators + 8 routes + test script) en plus
de son propre scope (next/image, fonts, lazy loading). Resultat : mes
changements sont dans le repo mais sous un message commit qui ne les decrit
pas.

Mitigation : ce log les documente exhaustivement. `git log --follow
src/lib/validators/index.ts` retrouve le commit reel.

A faire pour eviter le probleme :
- Coordination des sessions paralleles via worktrees `git worktree add`.
- OU verrouillage explicite "main est a moi pour le moment".

### Blocage 2 : pas de test runtime des validators

Le script `scripts/audits/test-validation.mjs` necessite un dev server qui
ecoute, donc Emeline doit le lancer manuellement. La validation TypeScript
(`tsc --noEmit`) confirme que les types sont coherents mais ne teste pas le
comportement HTTP reel.

### Blocage 3 : Upstash non configure

Voir Chantier C ci-dessus.

## Verifications systematiques par commit

Chantier A (commit cc3af7e) :
- ✅ Migration 048 appliquee sur prod (HTTP 201)
- ✅ Re-audit : 0 table zero-policy
- ✅ Tous SECURITY DEFINER ont search_path

Chantier B (commit 84940b1 sur ses parts) :
- ✅ `npx tsc --noEmit` sans erreur
- ✅ Tous les validators ont `.strict()` sauf Stripe webhook (justifie)
- ✅ Script de test cree pour validation runtime ulterieure

## Recommandations pour morceau 4

1. **Securite (continuite morceau 3)** :
   - Fixer les mineurs M1-M4 du RLS_AUDIT.md
   - Configurer Upstash et faire Chantier C
   - Supprimer l endpoint debug `/api/debug/sentry-test/route.ts`
     (commit 0260d43 dit "A SUPPRIMER apres test")

2. **Validation** :
   - Etendre Zod aux routes admin (deja `requireAdmin` protegees, mais
     valider les bodies serait propre)
   - Ajouter rate limit per-email sur send-magic-link (anti-spam mail)
   - Pour /api/og : ajouter validateQuery() avec OgQuerySchema si tu veux
     uniformiser (deja robuste sans)

3. **Tests** :
   - Lancer scripts/audits/test-validation.mjs en local pour valider runtime
   - Lancer les 6 SQL tests post-migration de RLS_AUDIT.md dans Supabase
     SQL Editor

4. **Process** :
   - Le partage de `main` entre plusieurs sessions Claude Code en
     parallele a cause un commit mixte. Considerer `git worktree` pour
     isoler les sessions futures.

## Fichiers livres

```
RLS_AUDIT.md                                              (nouveau, cc3af7e)
supabase/migrations/048_fix_rls_critical.sql              (nouveau, cc3af7e)
scripts/audits/audit-rls.mjs                              (nouveau, cc3af7e)

src/lib/validators/                                       (nouveau, 84940b1)
  auth.ts, common.ts, form-submission.ts, index.ts, og.ts,
  stripe-checkout.ts, stripe-webhook.ts, tracking.ts,
  unsubscribe.ts, validate.ts

src/app/api/auth/send-magic-link/route.ts                 (modifie, 84940b1)
src/app/api/contacts/unsubscribe/route.ts                 (modifie, 84940b1)
src/app/api/forms/[slug]/submit/route.ts                  (modifie, 84940b1)
src/app/api/site-auth/route.ts                            (modifie, 84940b1)
src/app/api/stripe/checkout/route.ts                      (modifie, 84940b1)
src/app/api/stripe/checkout-family/route.ts               (modifie, 84940b1)
src/app/api/stripe/webhook/route.ts                       (modifie, 84940b1)
src/app/api/track/page-view/route.ts                      (modifie, 84940b1)
scripts/audits/test-validation.mjs                        (nouveau, 84940b1)

EXECUTION_LOG_MORCEAU_3.md                                (ce fichier)
```
