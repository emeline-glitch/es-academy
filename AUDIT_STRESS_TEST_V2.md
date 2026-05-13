# Audit Stress Test V2, ES Academy

**Date** : 2026-05-12 22:30
**Auditor** : Claude Code (audit V2 post-sprint, lecture seule)
**Sessions auditées** : Morceaux 2 à 7 (sprint du 2026-05-12, ~10h de dev)
**Verdict global** : 🟠 PARTIEL, RISQUES NOTÉS

Sprint très productif. Les 14 items colonne A de l'audit initial sont à 12 sur 14 (1 absent : A7 Brevo, 2 à confirmer runtime : A13 Test Clock, A14 DNS). Build, types, lint : tous verts. Mais plusieurs trous de qualité subsistent (audit_log non systématique, captcha absent, CSP/HSTS absent, tests automatisés absent) et seront couverts par les morceaux 8 à 13 si le calendrier tient.

---

## 1. Résumé exécutif

**Top 3 risques bloquants restants** :
1. 🔴 **Aucun script de migration Brevo** (A7) ne pull les 35K alumni. Si Emeline doit pousser une campagne aux alumni le jour J, elle passe par l'import CSV manuel. À arbitrer cette semaine.
2. 🔴 **Absence de monitoring opérationnel** (Sentry installé mais pas BetterStack/uptime/status page, /api/health absent). Si un cron ou la prod tombe, Emeline le découvre par les tickets clients.
3. 🟠 **Audit log non exhaustif** : 1 seul appel au helper `writeAuditLog` (sur `contacts/[id]` pipeline stage), 10 routes utilisent `audit_log.insert` direct, et aucune sur les routes admin CRUD (sequences, campaigns, templates, forms, lists). Si une campagne part par erreur, traçabilité partielle.

**Top 3 succès de la journée** :
1. Webhook SNS SES complet avec vérif crypto signature RSA SHA256 + idempotence (`processed_sns_messages`) + handlers bounce/complaint qui marquent `contacts.status` proprement.
2. Refonte espace élève complète : dashboard dynamique avec stats hebdo / next lesson / coaching credits / banner Family, profil RGPD-ready (article 15 + 17 endpoints fonctionnels), page module intermédiaire ajoutée, 13 composants `platform/` réutilisables.
3. Sécurité admin durcie : 7 routes sequences + campaigns protégées par `requireAdmin()`, CRON_SECRET rotaté vers Supabase Vault sur 8 jobs, audit RLS complet (38 tables, 25 policies, migration 048 corrige 1 critique et 7 majeurs).

**Reco** : softlauncher le 14 mai uniquement si Emeline accepte de tourner sans monitoring (M8) et sans Calendly sync (M10) la première semaine. Sinon décaler de 7 jours pour caler M8 + M10. M9, M11, M12, M13 peuvent attendre J+30.

---

## 2. État des morceaux exécutés aujourd'hui

| Morceau | Périmètre | Statut | Preuves |
|---|---|---|---|
| M2 | Sécurité admin | ✅ FAIT | Migration 046 (vault.decrypted_secrets x7), 7 routes patchées (`grep requireAdmin src/app/api/sequences/` 9 hits, `src/app/api/emails/campaigns/` 3 hits), `SECURITY_INCIDENT_001.md` (115 lignes), tests admin écrits non exécutés |
| M3 | RLS + Zod | ✅ FAIT | Migration 048 (38 tables auditées, 1 critique + 7 majeurs corrigés), `src/lib/validators/` (10 fichiers, `.strict()` partout sauf Stripe webhook), 8 routes publiques validées via `validateBody`, `RLS_AUDIT.md` (320 lignes), Upstash REPORTÉ (Chantier C) |
| M4 | SES + HMAC + audit | 🟡 PARTIEL | Webhook `src/app/api/aws/sns/webhook/route.ts` complet avec verif crypto, `src/lib/utils/unsubscribe-token.ts` HMAC SHA256 + `timingSafeEqual`, idempotence SNS via migration 047. MAIS : `writeAuditLog` quasi inutilisé (1 fichier), inserts directs `audit_log` dans 10 fichiers seulement (pas couverture admin CRUD), pas de table `ses_suppression_list` (le check passe par `contacts.status='bounced'` filtré dans RPC, design fonctionnel mais différent du brief) |
| M5 | Documentation | 🟡 PARTIEL | 6 fichiers sur 7. Renommages : `ONBOARDING.md` (au lieu d'ONBOARDING_DEV), `OPERATIONS_RUNBOOK.md` (au lieu d'OPERATIONS_PLAYBOOK), `SECURITY_RUNBOOK.md` (au lieu de SECURITY). MIGRATION_NOTES.md ABSENT. ARCHITECTURE.md (562 lignes) contient 1 réf mermaid (à compter rigoureusement). OPERATIONS a bien les 4 cadences (quotidien/hebdo/mensuel/trimestriel L9/60/135/157). Pas d'EXECUTION_LOG_MORCEAU_5.md (mais logs M2, M3, M7 présents) |
| M6 | Frontend élève | ✅ FAIT | Refonte complète commit 762d052 (27 fichiers, +2360/-415 lignes). Dashboard fetch enrollments réels (`dashboard/page.tsx:47, 88-98`), page module intermédiaire (`cours/[courseSlug]/[moduleSlug]/page.tsx`, 165 lignes), profil avec 6 composants (`AvatarUpload`, `ProfileInfoForm`, `NotificationPrefsForm`, `SecuritySection`, `PaymentsList`, `RgpdActions`), endpoints RGPD `/api/rgpd/export` et `/api/rgpd/delete` fonctionnels (commit bd87e81), migration 050 (city/bio/notification_prefs) et 051 (bucket avatars, 4 policies storage) |
| M7 | Perf + SEO | ✅ FAIT | Sitemap dynamique via `getPublishedArticles` (`src/app/sitemap.ts`), robots disallow étendu (admin/api/dashboard/cours/profil/ressources/coaching), `/api/og` via `ImageResponse` 3 variants, `src/lib/seo/schemas.ts` (10 factory functions), JsonLd composant, metadata sur 5 pages publiques sur 6 (coaching public absent, c'est `(platform)/coaching` qui existe), `next.config.ts:14-39` remotePatterns (S3 + Notion + Bunny + Unsplash), 0 `<img>` restant dans les pages publiques crawlées, `EXECUTION_LOG_MORCEAU_7.md` (289 lignes) présent |

Note transverse : le commit `84940b1 perf(public)` est en réalité le commit Chantier B du M3 (validators Zod) capturé par une session parallèle qui a fait un `git add -A`. Le contenu est correct, le message ne reflète pas le scope réel. Documenté dans `EXECUTION_LOG_MORCEAU_3.md`.

---

## 3. Findings de l'audit initial, statut détaillé

### 3.1 Findings 🔴 colonne A (bloquants lancement)

| # | Finding initial | Statut | Preuve |
|---|---|---|---|
| A1 | `FAMILY_LAUNCH_PENDING = true` en dur, bloque tout checkout Family | ✅ FAIT | `src/lib/utils/constants.ts:24` : `export const FAMILY_LAUNCH_PENDING = process.env.FAMILY_LAUNCH_PENDING === "true"`. Default = ouvert si env var absente, commit 97d7d16 |
| A2 | Dashboard placeholder complet | ✅ FAIT | `src/app/(platform)/dashboard/page.tsx:39-72` fetch real `getActiveEnrollments` + `getLearnerStats` + `getFullCourseStructure`. EmptyDashboard si 0 enrollment. Banner Family + ReviewCta + Suspense. Commit 762d052 |
| A3 | 8 routes admin sans `requireAdmin` | ✅ FAIT (7 sur 8) | 7 routes sequences/campaigns patchées (`src/lib/utils/admin-auth.ts` exporté, 13 appels `requireAdmin()`). 8e route `/api/contacts/unsubscribe` traitée séparément via HMAC token (voir A6). Helper en `src/lib/utils/admin-auth.ts` (et non `src/lib/auth/admin.ts` comme dans le brief) |
| A4 | Pas de pipeline SES bounce/complaint | ✅ FAIT | `src/app/api/aws/sns/webhook/route.ts` (370 lignes) : whitelist TopicArn, verif crypto signature SHA1/SHA256, `SubscriptionConfirmation` auto, idempotence via `processed_sns_messages` (migration 047), `handleBounce` (Permanent = contacts.status='bounced' + consent_log) et `handleComplaint` (status='unsubscribed' + consent_log). Cron sync AWS suppression list quotidien (`src/app/api/cron/sync-ses-suppression/`). Différent du brief (pas de table `ses_suppression_list` dédiée) mais fonctionnel : le RPC `get_pending_sequence_sends` filtre déjà sur `status='active'` |
| A5 | Examen final scoring client-side | ✅ FAIT | `src/lib/evaluation/data.ts` marqué `server-only`, le client reçoit les questions SANS le champ `correct`. `src/app/api/evaluation/submit/route.ts:40-56` recalcule le score côté serveur strict. Commit 9b9b2bc |
| A6 | Unsubscribe email-only sans token | ✅ FAIT | `src/lib/utils/unsubscribe-token.ts` HMAC SHA256 + `crypto.timingSafeEqual`, vérif format hex 64 chars. `src/app/api/contacts/unsubscribe/route.ts:39-124` exige token OU `source='manual'`. `buildUnsubscribeUrl` utilisé dans `welcome-academy.ts`, `welcome-family.ts`, et `process-sequences/route.ts`. Page `/desabonnement` fait l'auto-confirm en cas de token valide. Commit 82bf01a |
| A7 | Pas de script migration Brevo | ❌ NON FAIT | `ls scripts/ \| grep -i brevo` = 0 résultat. Aucun script `migrate-brevo*`, `import-alumni*`, `pull-brevo*`. Si campagne alumni le jour J, fallback : export Brevo CSV + import admin (RPC `import_contact_with_consent` migration 034 atomique, donc faisable mais manuel sans logs). |
| A8 | OG images JPG absentes | ✅ FAIT (alternatif) | `/api/og` via `ImageResponse` next/og avec 3 variants (default, blog, product), branché en metadata fallback layout root. Les fichiers statiques `og-default.jpg` / `og-family.jpg` sont remplacés par cette route dynamique (plus puissant : titre/sous-titre custom par page). À confirmer en runtime que LinkedIn/Twitter scrape bien l'URL `/api/og?title=...` |
| A9 | `src/app/error.tsx` racine absent | ✅ FAIT | `src/app/error.tsx` et `src/app/global-error.tsx` présents (commit 38724ab) |
| A10 | Checkbox renonciation rétractation 14j sur checkout | ✅ FAIT | Commit 4153c98 : Stripe metadata trace consent, log dans `consent_log` consent_basis='waiver_l221-28-13'. `src/app/api/stripe/webhook/route.ts:409-428` enregistre la preuve |
| A11 | Rotate CRON_SECRET hors git history | ✅ FAIT | Migration 046 : Vault `cron_secret`, 7 jobs rotated, ancien secret `bk3JTO7` absent partout (sauf migrations 023/027/035/045_seo qui sont l'historique, c'est leur rôle, et `SECURITY_INCIDENT_001.md` documente l'arbitrage option A = pas de filter-repo). Vercel env var à confirmer par Emeline (section 9) |
| A12 | Sentry absent | ✅ FAIT | `@sentry/nextjs@10.53.0` dans package.json, `sentry.server.config.ts` + `sentry.edge.config.ts` à la racine, debug endpoint supprimé après validation prod (commits 24c9e42, 2d923ad, 4c63da0). 5 issues remontées en prod selon commit message |
| A13 | Test Clock 3x/4x Stripe avant LIVE | ❓ RUNTIME | Hors lecture code. À faire par Emeline avant bascule LIVE Stripe |
| A14 | DKIM/SPF/DMARC + sandbox SES | ❓ RUNTIME | Configuration DNS + AWS console. À confirmer par Emeline |

### 3.2 Findings 🟠 colonne B (importants 30j)

| # | Finding initial | Statut | Preuve |
|---|---|---|---|
| B1 | Calendly webhook | ❌ NON FAIT | `src/app/api/webhooks/` contient uniquement `videoask/`. Pas de `calendly/`. Prévu M10 |
| B2 | Notion retry + circuit breaker + cache | ❌ NON FAIT | `src/lib/notion/queries.ts:20-40` : `fetch()` simple, `try/catch` return `[]`, `next.revalidate: 3600`. Pas de retry, pas de backoff, pas de circuit breaker. Prévu M10 |
| B3 | Cron cleanup_old_audit_log | ✅ FAIT | Migration 046 ajoute `es-academy-cleanup-audit-log` dimanche 3h UTC. Vérifié dans `VERIFICATION_MORCEAU_2.md:154` (job actif côté Supabase) |
| B4 | Bunny URL 6h trop longue + watermark | 🟡 PARTIEL | `src/lib/bunny/signed-url.ts:14` : `expiresInHours = 6` inchangé. Pas de watermark. Prévu M9 |
| B5 | `/api/progress` validation enrollment | 🟡 PARTIEL | `src/app/api/progress/route.ts:13-16` valide `lesson_id` + `course_id` requis (basique), mais pas de check explicite `EXISTS enrollments WHERE user_id=auth.uid() AND course_id=$1`. L'RLS sur progress devrait bloquer un user qui POST avec un course_id auquel il n'est pas enrollé, mais à confirmer dans la migration RLS |
| B6 | Audit log writeAuditLog systématique | 🟡 PARTIEL | Helper `src/lib/utils/audit.ts` existe et est correct. MAIS 1 seule occurrence d'appel `writeAuditLog(` dans `src/app/api/contacts/[id]/route.ts:2`. 10 fichiers utilisent `supabase.from("audit_log").insert(...)` direct (contacts/unsubscribe, contacts/[id]/promote, admin/enrollments/[id]/resend-welcome-mail, admin/import-contacts, aws/sns/webhook, cron/seasonal-toggle, stripe/webhook, ses/client, welcome-academy). Routes admin CRUD (sequences, campaigns, templates, lists, forms, lead-magnets, tunnels, settings, eleves/[userId]) **n'ont pas d'audit log**. Très loin du "writeAuditLog exhaustif" annoncé dans le brief M4 |
| B7 | Pipeline Kanban channel.unsubscribe() | ❓ NON VÉRIFIÉ | Hors scope cette session, pas modifié dans le sprint |
| B8 | CSP + HSTS headers | ❌ NON FAIT | `next.config.ts` headers (X-Frame, X-Content-Type, Referrer-Policy, Permissions-Policy) inchangés. Pas de `Strict-Transport-Security` ni `Content-Security-Policy`. Prévu M13 |
| B9 | RGPD article 15 (export) + 17 (delete) | ✅ FAIT | Commit bd87e81 : `src/app/api/rgpd/export/route.ts` (GET, JSON profile + enrollments + progress + quiz_results + family_subs + contacts + consent_log + métadonnées légales), `src/app/api/rgpd/delete/route.ts` (POST envoie mail support + log dans consent_log avec consent_basis='gdpr_article_17_self_service'). Composant `RgpdActions.tsx` branché dans `/profil` |
| B10 | Captcha/honeypot forms publics | ❌ NON FAIT | 0 occurrence `turnstile|recaptcha|honeypot|hcaptcha` dans le repo. Pas couvert par M8-M13 prévus, **trou de planning**. Rate limit in-memory existant uniquement |
| B11 | Validation Zod centralisée | ✅ FAIT | `src/lib/validators/` 10 fichiers + helper `validateBody/validateQuery`, 8 routes publiques migrées avec `.strict()` (sauf Stripe webhook justifié) |
| B12 | JsonLd Article sur blog | ✅ FAIT | `src/app/blog/[slug]/page.tsx` utilise `articleSchema` + composant `JsonLd`, vérifié par agent |
| B13 | Cookies banner granular CNIL | ❌ NON FAIT | `src/components/ui/CookieConsent.tsx` reste binaire accept/decline. Prévu M13 (cookies TCF 2.2) |
| B14 | SES retry exponentiel sur Throttling | ❌ NON FAIT | `src/lib/ses/client.ts` : pas de retry sur exception, return success=false direct |
| B15 | Notif mail Emeline si cron fail | ❓ NON VÉRIFIÉ | Pas modifié dans le sprint |
| B16 | Stripe checkout customer_email pré-remplit | ❓ NON VÉRIFIÉ | Pas dans le sprint |
| B17 | Page module intermédiaire | ✅ FAIT | `src/app/(platform)/cours/[courseSlug]/[moduleSlug]/page.tsx` 165 lignes (M6) |
| B18 | Healthcheck `/api/health` | ❌ NON FAIT | `src/app/api/health/` absent. Prévu M8 |
| B19 | Lighthouse + Core Web Vitals | ❓ RUNTIME | Mesure à faire après mise en prod, à confirmer par Emeline |
| B20 | Tests de charge k6/autocannon | ❌ NON FAIT | Aucun fichier `k6`, pas de `autocannon` dans package.json. Prévu C non priorisé |

### 3.3 Findings 🟡 et 🟢 (moindre priorité)

Synthèse : la plupart sont des items "polish" non bloquants.

- 🟡 Lead magnets saisonniers actifs hors saison via URL directe : ❓ pas re-vérifié, probablement inchangé
- 🟡 Cookies banner non-granular : voir B13
- 🟡 Doublon `/simulateur` vs `/simulateurs` : ❓ non vérifié
- 🟢 Validation email regex basique : ✅ remplacée par Zod (B11)
- 🟡 Variables `{{prenom}}` non échappées dans templates email : ❓ non vérifié
- 🟡 Import contacts pas de check doublons DB : ❓ non vérifié
- 🟡 Forms `redirect_url` non validée : ❓ non vérifié
- 🟢 Webhook Stripe idempotent : ✅ confirmé (migration 041 `processed_stripe_events`)

---

## 4. Régressions détectées

Lancés en background :

```
npm run build       → exit code 0 ✅
npx tsc --noEmit    → exit code 0 ✅
npm run lint        → exit code 0 ✅
```

**Aucune régression compile/lint/types détectée.**

Quelques notes opérationnelles :

- Le commit `84940b1` (intitulé `perf(public): next/image, fonts, lazy loading composants lourds`) inclut en réalité aussi le Chantier B du M3 (validators Zod + helper validate). Pas une régression au sens technique, mais la lisibilité git history est dégradée. Documenté dans `EXECUTION_LOG_MORCEAU_3.md`. Pour éviter le problème, sessions Claude Code en parallèle devraient utiliser `git worktree`.

- Sur `/api/og?title=...` (route dynamique remplaçant les fichiers statiques `og-default.jpg`) : si LinkedIn/Twitter scrapers refusent l'URL dynamique pour OG (rare mais possible si Vercel cold start > timeout du crawler), les previews restent cassées. À tester runtime par Emeline (LinkedIn Post Inspector, Twitter Card Validator).

- Migration numbering : doublons `044_` (044_fix_rls_critical + 044_seo_advanced) et `045_` (045_quiz_questions + 045_seo_pg_cron_jobs) hérités d'avant. Pas de doublon créé pendant le sprint mais la migration `049` est sautée (047 → 048 → 050 → 051). Pas grave (Supabase trie lexicalement), mais à surveiller.

- Endpoint debug `/api/debug/sentry-test` créé pour valider Sentry (commit 0260d43) puis supprimé (commits 2d923ad, 4c63da0). Code propre, pas de leak en prod.

---

## 5. Coulent de source, checklist mise à jour

| Item | Statut | Preuve |
|---|---|---|
| Page 404 custom branding | ✅ | `src/app/not-found.tsx` (déjà présent V1) |
| Page 500 custom `error.tsx` | ✅ | Présent en racine (commit 38724ab) |
| `global-error.tsx` root layout crash | ✅ | Présent |
| Sitemap.xml dynamique | ✅ | `src/app/sitemap.ts` fetch Notion |
| Robots.txt disallow zones privées | ✅ | `src/app/robots.ts` admin/api/dashboard/cours/profil/ressources/coaching |
| Schema JSON-LD Organization + Website | ✅ | `src/lib/seo/schemas.ts` 10 factories |
| Schema JSON-LD Article par blog post | ✅ | `src/app/blog/[slug]/page.tsx` (commit 8956a93) |
| Schema JSON-LD Product /academy | ✅ | `productSchema` exporté + utilisé |
| OG image default | ✅ alternatif | `/api/og` dynamique (commit 9e0cff2). Risque scraper LinkedIn à valider runtime |
| OG image Family | ✅ alternatif | Même route dynamique avec subtitle custom |
| Twitter card meta | ✅ | Layout |
| Favicon + Apple touch | ✅ | Inchangé |
| Manifest PWA | ❌ | Absent, pas de `public/manifest.json` ni `src/app/manifest.ts`. Pas couvert M8-M13 |
| Canonical URLs | ✅ | metadataBase configuré |
| HTTPS via Vercel | ✅ | Par défaut |
| HSTS header | ❌ | Absent, prévu M13 |
| CSP header | ❌ | Absent, prévu M13 |
| X-Frame, X-Content, Referrer, Permissions | ✅ | `next.config.ts` |
| Rate limiting in-memory | ✅ | `@/lib/utils/rate-limit` sur /contacts /forms |
| Rate limiting distribué Upstash | ❌ | Reporté M3 Chantier C, dépendant de provisioning Upstash |
| Captcha/honeypot forms publics | ❌ | Absent, **trou de planning** pas couvert M8-M13 |
| Validation Zod côté serveur | ✅ | `src/lib/validators/` |
| CSRF tokens admin | ❌ | Pas de token explicite. SameSite=Lax par défaut Supabase. Pas couvert M8-M13 |
| `requireAdmin()` sur API admin | 🟡 | 7 routes sequences/campaigns patchées + 25 routes `/api/admin/*` déjà OK (vérifié dans EXECUTION_LOG_M2). Mais B6 audit log toujours partiel |
| Session admin idle timeout | ❌ | Pas de middleware d'inactivité. Pas couvert M8-M13 |
| Anti-énumération magic link | ✅ | Inchangé OK |
| Site password protection | ✅ | middleware.ts |
| Liens unsubscribe avec token signé | ✅ | HMAC `buildUnsubscribeUrl` utilisé dans welcome-academy, welcome-family, process-sequences |
| CGV rétractation 14j + renonciation expresse | ✅ | + checkbox checkout (A10) |
| Mentions légales + politique conf | ✅ | Inchangé |
| Cookies banner | 🟡 | Binaire (B13), TCF 2.2 prévu M13 |
| Consent log table + RPC | ✅ | Migration 034 inchangée, alimentée par sns webhook, rgpd/delete, unsubscribe, stripe webhook |
| Article 15 export | ✅ | `/api/rgpd/export` GET fonctionnel |
| Article 17 suppression | ✅ | `/api/rgpd/delete` POST envoie mail support + consent_log preuve |
| Article 21 opt-out | ✅ | unsubscribe HMAC |
| DKIM/SPF/DMARC | ❓ | Runtime, hors code |
| Sentry erreurs front+back | ✅ | `@sentry/nextjs` installé + configs |
| Uptime monitoring (BetterStack) | ❌ | Prévu M8 |
| Status page publique | ❌ | Prévu M8 |
| `/api/health` endpoint | ❌ | Absent, prévu M8 |
| Backups Supabase PITR | ❓ | Runtime, dépend du plan Supabase Pro |
| Logs centralisés | ❌ | Sentry oui mais pas Datadog/BetterStack |
| next/image partout | ✅ | 0 `<img>` restant pages publiques (commit 84940b1) |
| Fonts display:swap | ✅ | Inchangé |
| Compression | ✅ | next.config |
| ISR sur blog | ✅ | revalidate 3600 |
| Lazy loading composants lourds | ✅ | Calendly iframe en `loading="lazy"` natif |
| Lighthouse score | ❓ | Mesure runtime, A confirmer |
| Alt sur images | ❓ | Pas re-audité, M11 a11y prévue |
| Labels form fields | ❓ | M11 |
| Navigation clavier / focus-visible | ❓ | M11, EXECUTION_LOG_M7 note focus-visible à auditer |
| Contrastes WCAG AA | ❓ | M11 |
| Responsive mobile | ❓ | Runtime |
| Stripe mode live/test distingué | ✅ | env vars `_LIVE` / `_TEST` (inchangé) |
| Webhook Stripe signature + idempotence | ✅ | constructEvent + `processed_stripe_events` (migration 041) |
| Customer Portal Stripe | ✅ | `src/app/api/stripe/portal/route.ts` existe (inchangé) |
| Refund flow admin UI | ❌ | Absent `/admin/eleves/[userId]`. Prévu M10 |
| Test Clock 3x/4x | ❓ | A faire runtime |
| Tests Vitest + Playwright | ❌ | Pas de `vitest.config.ts`, pas de `playwright.config.ts`, pas de répertoire `tests/`. Prévu M12 |
| Axe-core a11y | ❌ | Pas dans package.json. Prévu M11 |
| Recherche dans contenu cours | ❌ | Absent. Pas couvert M8-M13 |
| Téléchargement ressources protégé URL signée | ❌ | `src/app/(platform)/ressources/page.tsx` sert URLs Notion directes (1h validité Notion). Pas couvert M8-M13 |
| Mode dégradé documenté Notion/Bunny/Stripe/SES/Supabase | 🟡 | ARCHITECTURE.md mentionne fallback Notion et webhook, à compléter |

---

## 6. Nouveaux findings (découverts pendant cet audit V2)

Items qui ne figuraient pas dans l'audit V1 et qui ne sont pas explicitement prévus pour les morceaux 8-13.

| # | Finding | Sévérité | Détail |
|---|---|---|---|
| N1 | `MIGRATION_NOTES.md` absent | 🟡 | Le brief M5 le listait comme attendu. Ni renommé, ni présent. À créer ou rayer du plan |
| N2 | Renommages doc M5 vs brief | 🟢 | ONBOARDING.md (au lieu d'ONBOARDING_DEV), OPERATIONS_RUNBOOK.md (au lieu d'OPERATIONS_PLAYBOOK), SECURITY_RUNBOOK.md (au lieu de SECURITY). Cosmétique, mais désaligne la lecture croisée du brief |
| N3 | `writeAuditLog` helper sous-utilisé | 🟠 | 1 fichier en dépendance. 10 fichiers font `audit_log.insert` direct, et routes admin CRUD (sequences, campaigns, templates, lists, forms, lead-magnets, tunnels, settings, eleves) n'ont aucun audit. Trace réelle sur 5 % des actions admin sensibles |
| N4 | Helper `requireAdmin` chemin divergent | 🟢 | `src/lib/utils/admin-auth.ts` au lieu de `src/lib/auth/admin.ts`. Tous les imports cohérents, juste un écart au brief |
| N5 | Lib SNS signature inline route | 🟢 | `verifySnsSignature` est dans `src/app/api/aws/sns/webhook/route.ts:319` au lieu de `src/lib/aws/sns-signature.ts`. Code correct, mais pas réutilisable et non testable unitairement |
| N6 | Tests scripts admin/validation non exécutés | 🟡 | `scripts/test-admin-routes-auth.mjs` (M2) et `scripts/audits/test-validation.mjs` (M3) créés mais jamais lancés en runtime (la consigne "ne pas killer les ports" a bloqué le dev local). Statut "passe `tsc`" est insuffisant pour valider le comportement HTTP |
| N7 | `audit_log` insert direct ne supporte pas le rollback | 🟢 | Si la table audit grossit, les inserts directs ne sont pas batchés. Performance acceptable pour le volume actuel, à surveiller au-delà de 100k inserts/jour |
| N8 | Pas de `EXECUTION_LOG_MORCEAU_4.md` ni `_5.md` ni `_6.md` | 🟡 | Seuls M2, M3, M7 ont leur log. M4 (SES + HMAC + audit) et M5 (doc) et M6 (frontend élève) ont fait beaucoup mais sans log structuré, donc traçabilité partielle. Le travail est dans le code, mais l'arbre des décisions est en clair seulement pour M2/M3/M7 |
| N9 | Test Clock 3x/4x toujours pas joué | 🔴 si J | Rappel mémoire utilisateur : 3 tests obligatoires avant LIVE. Statut ❓ |
| N10 | Email transactionnel `welcome-academy.ts` modifié inclut bien `buildUnsubscribeUrl` | ✅ bonne nouvelle | Pas un trou, juste à confirmer que c'est dans le HTML final et pas seulement importé |
| N11 | Cron `seasonal-toggle` log `audit_log` direct | 🟢 | OK comportement, pattern à uniformiser avec writeAuditLog quand on étend |
| N12 | OG dynamique vs scrapers LinkedIn/Twitter | 🟡 | À tester runtime : certains scrapers ne suivent pas les redirects ou les requêtes lentes. Si le rendering `/api/og` dépasse 2-3s cold start, preview cassée |
| N13 | `/api/contacts/[id]` DELETE absent | 🟠 | Pour appliquer RGPD article 17 admin-side (suppression demandée par utilisateur), passage SQL nécessaire. L'endpoint `/api/rgpd/delete` côté élève envoie mail support, donc work normal jusqu'à 50 demandes/an, mais pas scalable |
| N14 | `/api/contacts/[id]/export` admin RGPD absent | 🟡 | Même logique : impossible d'aider un demandeur sans passer par SQL. Pas grave si volume faible |
| N15 | Bulk delete contacts absent | 🟡 | Seulement bulk-add-tags présent. Pour purger une cohorte test, manuel via SQL |
| N16 | Famile_subscriptions toujours sans policy SELECT user_id | ❓ | Vérifier dans migration 048 si la policy a été ajoutée (RLS_AUDIT.md F3 marqué fixé, à recouper) |
| N17 | `process-sequences` ne re-vérifie pas `status='unsubscribed'` | ❓ | Le RPC `get_pending_sequence_sends` doit le faire (migration 022) mais non re-vérifié dans le sprint |

---

## 7. Mapping morceaux 8-13 vs findings restants

| Morceau prévu | Périmètre attendu | Findings audit V1 couverts | Findings restants à traiter ailleurs |
|---|---|---|---|
| M8 | Sentry + BetterStack + status page + /api/health | Sentry ✅ déjà fait. Reste : BetterStack uptime, status publique, `/api/health`, alerting downtime | B15 notif Emeline cron fail |
| M9 | Examen scoring serveur ✅ déjà fait + Bunny token 30 min + watermark | B4 Bunny durée + watermark | Toujours pas de tests de fraude end-to-end |
| M10 | Calendly webhook + Stripe refund admin + Notion wrapper retry/circuit/cache | B1 Calendly + B2 Notion + Refund UI admin + Customer Portal teaser depuis profil | B14 SES retry, B16 stripe email pré-rempli |
| M11 | Accessibilité WCAG AA | Alt, labels, focus, contraste | Recherche cours, manifest PWA |
| M12 | Tests E2E Playwright + Vitest | B20 tests charge + tests automatisés | Coverage minimum à viser |
| M13 | CSP + HSTS + cookies TCF 2.2 | B8 CSP/HSTS + B13 cookies granular | CSRF tokens, idle timeout |

**Trous de planning, non couverts par M8 à M13 si on suit le brief littéral** :

- A7 Brevo migration script (urgent si campagne alumni au lancement)
- B10 captcha/honeypot forms publics (rate limit in-memory uniquement)
- B6 writeAuditLog exhaustif routes admin CRUD (partiellement seulement)
- N1 MIGRATION_NOTES.md
- N3 audit log routes admin CRUD
- N13 DELETE /api/contacts/[id] admin
- N14 export RGPD admin per-contact
- N15 bulk delete contacts
- Recherche dans contenu cours
- Téléchargement ressources protégé via URL signée
- Manifest PWA
- CSRF tokens admin sensitive actions
- Session admin idle timeout
- Mode dégradé exhaustif documenté

**Verdict** : la trajectoire 8-13 traite l'essentiel mais une dizaine d'items se retrouvent en orphelins. À glisser en backlog J+30 ou redécouper M10 et M13.

---

## 8. Plan d'action priorisé V2

### Colonne A V2, bloquant lancement (à faire avant J)

Estimation : **8 à 12h dev + 2h runtime Emeline**.

| # | Item | Effort | Origine |
|---|---|---|---|
| A1v2 | Décider Brevo : (a) écrire script migrate-brevo.mjs, (b) export Brevo CSV et utiliser import admin, (c) reporter campagne post-lancement | 4h ou 0 si décision (b)/(c) | V1 A7 |
| A2v2 | Test Clock Stripe 1x + 3x + 4x sur PaymentIntent test | 1h runtime | V1 A13 |
| A3v2 | DNS DKIM/SPF/DMARC + sortir SES sandbox | 2h runtime + 24h propagation | V1 A14 |
| A4v2 | Confirmer Vercel env vars sync : `CRON_SECRET` (nouveau), `UNSUBSCRIBE_SECRET`, `AWS_SNS_TOPIC_ARN_BOUNCES`, `AWS_SNS_TOPIC_ARN_COMPLAINTS`, `SES_FROM_EMAIL`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | 30 min | runtime |
| A5v2 | Test runtime SNS : subscription confirmation reçue, premier bounce processé, audit_log écrit | 30 min runtime | V1 A4 confirmer |
| A6v2 | Test runtime cron rotaté : un job a tourné avec succès post-rotation | 15 min Vercel logs | V1 A11 confirmer |
| A7v2 | Test runtime LinkedIn Post Inspector + Twitter Card Validator sur /api/og?title=...&variant=blog | 15 min | N12 |
| A8v2 | Backup Supabase Pro + PITR activé | 30 min runtime | V1 monitoring |
| A9v2 | Décider M8 (monitoring) avant J ou en J+7. Si J : provisioner BetterStack + page d'état | 4h dev | M8 |

### Colonne B V2, important J+7 à J+30

| # | Item | Effort | Origine |
|---|---|---|---|
| B1v2 | M8 : `/api/health`, status page, BetterStack uptime, alerts cron | 1 journée | V1 monitoring |
| B2v2 | M10 : Calendly webhook + Notion retry/backoff/circuit + Stripe refund admin | 1 journée | V1 B1, B2, refund |
| B3v2 | writeAuditLog systématique sur 15 routes admin CRUD (sequences, campaigns, templates, forms, lists, lead-magnets, tunnels, settings, contacts crud, eleves) | 4h | V1 B6 + N3 |
| B4v2 | M9 : Bunny token 30 min + watermark | 3h | V1 B4 |
| B5v2 | M13 : CSP + HSTS + cookies TCF 2.2 + CSRF tokens admin sensibles + idle timeout admin | 1 journée | V1 B8, B13 + N |
| B6v2 | M11 : axe-core, skip-to-content, ARIA landmarks, focus-visible, heading hierarchy | 1 journée | V1 a11y |
| B7v2 | Captcha Cloudflare Turnstile forms publics | 2h | V1 B10 |
| B8v2 | DELETE /api/contacts/[id], bulk delete, export per-contact, recherche admin | 4h | N13, N14, N15 |
| B9v2 | Mode dégradé documenté par dépendance, alerting si Notion down | 2h | section 7 V1 |
| B10v2 | Tests Playwright parcours critiques + Vitest unit pour validators/audit/unsubscribe-token | 1 journée | V1 B20 + N6 |
| B11v2 | MIGRATION_NOTES.md ou suppression du brief | 30 min | N1 |
| B12v2 | EXECUTION_LOG_MORCEAU_4/5/6.md rétrospectifs (1 page chacun) | 1h | N8 |

### Colonne C V2, nice to have J+30 à J+90

| # | Item | Effort |
|---|---|---|
| C1v2 | Refacto SNS signature en `src/lib/aws/sns-signature.ts` + tests unit | 2h |
| C2v2 | Manifest PWA + service worker offline ressources | 4h |
| C3v2 | Recherche dans contenu cours (Notion full-text) | 8h |
| C4v2 | Téléchargement ressources via URL signée /api/resources/[id] | 4h |
| C5v2 | Refacto admin layout : sidebar + commandPalette étendue + dashboard CA/MRR | 8h |
| C6v2 | Visualisation séquences en arbre | 8h |
| C7v2 | Rate limit distribué Upstash (M3 Chantier C) | 2h |
| C8v2 | SES retry exponentiel sur Throttling | 1h |

---

## 9. À confirmer manuellement par Emeline (runtime)

Ces points ne peuvent pas être validés en lecture seule du code. Cocher au fur et à mesure.

- [ ] **Vercel env vars sync sur Production + Preview + Development** :
  - [ ] `CRON_SECRET` (nouvelle valeur `6V2e...` post-rotation)
  - [ ] `UNSUBSCRIBE_SECRET` (min 32 chars hex)
  - [ ] `AWS_SNS_TOPIC_ARN_BOUNCES`
  - [ ] `AWS_SNS_TOPIC_ARN_COMPLAINTS`
  - [ ] `SES_FROM_EMAIL` (vérifié dans SES identities)
  - [ ] `SES_FROM_NAME`
  - [ ] `SENTRY_DSN` + `SENTRY_ORG` + `SENTRY_PROJECT=javascript-nextjs` + `SENTRY_AUTH_TOKEN`
  - [ ] `FAMILY_LAUNCH_PENDING=false` (ou absente) pour ouvrir checkout Family
- [ ] **Supabase Pro plan actif** + PITR activé (es-academy prod + family prod)
- [ ] **DKIM signing actif** sur l'identité SES emeline-siron.fr
- [ ] **SPF** dans DNS de emeline-siron.fr inclut `amazonses.com`
- [ ] **DMARC** policy au moins `p=quarantine`
- [ ] **SES sorti du sandbox** (account-level production access AWS)
- [ ] **Subscription SNS confirmée** sur les 2 topics (bounce + complaint) côté AWS console
- [ ] **Stripe webhook live actif et signé** (endpoint URL prod en mode `live`, secret `whsec_...` synchronisé)
- [ ] **Test runtime du cron rotaté** : ouvrir Vercel logs sur `/api/cron/process-sequences` à la prochaine exécution, attendu 200
- [ ] **Test runtime du webhook SNS** : déclencher un bounce de test (envoyer à `bounce@simulator.amazonses.com`), vérifier `audit_log` entry `sns_bounce_hard` apparait
- [ ] **Test runtime achat 1x** avec promo code test (Stripe Test Mode)
- [ ] **Test runtime achat 3x** via Stripe Test Clock (advance +30j +60j +90j)
- [ ] **Test runtime achat 4x** via Stripe Test Clock
- [ ] **Lighthouse 95+** sur 5 pages clés (/, /academy, /family, /blog, /cahier-preview)
- [ ] **Mozilla Observatory** grade sur emeline-siron.fr (post M13 CSP/HSTS uniquement, sinon C ou D)
- [ ] **LinkedIn Post Inspector** sur https://emeline-siron.fr/academy : preview OG charge sans erreur
- [ ] **Twitter Card Validator** sur https://emeline-siron.fr/blog/[un article]
- [ ] **Lancement scripts test non exécutés** : `BASE_URL=https://emeline-siron.fr node scripts/test-admin-routes-auth.mjs` (401/403 sur toutes routes admin pour un user non admin) et `BASE_URL=http://localhost:3001 node scripts/audits/test-validation.mjs` (16 assertions Zod)
- [ ] **6 requêtes SQL de validation RLS** listées dans `RLS_AUDIT.md` (post-migration 048)
- [ ] **Décision Brevo** : (a) écrire script migrate-brevo, (b) import CSV manuel, (c) reporter

---

## 10. Recommandation finale

Mon arbitrage est conditionnel. Trois scenarii.

### Scenario 1, soft launch le 14 mai comme prévu

Faisable si Emeline accepte de tourner sans Calendly auto-sync, sans status page, sans `/api/health`, sans Notion retry. La plateforme tient en charge légère (1 à 50 acheteurs jour J grâce à `processed_stripe_events` solide et webhook SES idempotent). Risque principal : si Notion API a un blip, les pages cours/leçons retournent vide pendant 1h cache de récup. Acceptable pour un soft launch lent.

Pré-requis avant J :
1. Cocher la section 9 à 100 %, en particulier DKIM/SPF/DMARC + Stripe Test Clock + Vercel env vars
2. Décider sur Brevo (a/b/c). Si campagne alumni au lancement = option (a) requiert 4h dev, option (b) acceptable jusqu'à 1k contacts
3. Lancer les 2 scripts de tests admin/validation en runtime au moins une fois

### Scenario 2, décaler de 7 jours pour M8 + M10

Bonus de stabilité élevé pour 1 semaine de glissement. M8 + M10 = monitoring complet + Calendly sync + Notion retry + refund admin. Élimine 4 des 5 trous P0 restants. Recommandé si Emeline veut "lancer une fois proprement".

### Scenario 3, décaler de 21 jours pour M8 à M13 complet

Lancement carré WCAG-conforme avec tests automatisés et CSP/HSTS. Probablement excessif pour un soft launch. Plus pertinent pour la com publique non-warm.

**Ma reco** : Scenario 1 si Brevo est traité par option (b) ou (c) et que tu acceptes les zones grises monitoring/Calendly une semaine. Sinon Scenario 2.

Le code livré aujourd'hui est solide. Build/lint/types green, sécurité admin durcie, RLS audité, RGPD article 15/17 fonctionnel, espace élève réel. La dette restante est traçable et le plan 8-13 la couvre à 75 %. Les 25 % restants (Brevo, captcha, audit log admin exhaustif, manifest PWA, recherche cours, ressources URL signées) sont des items J+30 acceptables.

Honest et brutal : si la promesse marketing du 14 mai inclut "campagne alumni Evermind à 35K contacts", **on n'est pas prêt**. Si la promesse est "ouverture des inscriptions chaude par le réseau warm (1k contacts dans le sprint Solstice + Family alumni)", **on est prêt**.
