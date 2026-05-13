# ARCHITECTURE : ES Academy + ES Family

Vue d'ensemble du système. À lire avant tout dev structurant. À mettre à jour après tout refacto majeur.

- **Stack principale :** Next.js 16 (App Router, React 19), Supabase (Postgres + Auth), Stripe, AWS SES, Notion API, Bunny.net (vidéo), Vercel (host).
- **Repos :** `~/es-academy` (port dev 3001, prod `emeline-siron.fr`), `~/es-family` (port dev 3002, prod sur Vercel), `~/solstice` (port dev 3000, indépendant), `~/otb-podcast-site` (statique HTML).
- **Comptes infra :**
  - Stripe : 1 seul compte (ES Academy SASU `acct_1TPIxG6LFQ0ZMm1e`), prends en charge Academy + Family.
  - Supabase : **2 projets séparés**, pas de SSO. Academy `tvkzndkywznaysiqvmsh`, Family `hpcoxtpdsydcrwdudhsk`.
  - Vercel : 1 team `es-academy`, 2 projects (Academy + Family).
  - AWS : 1 account, identité SES `emeline-siron.fr` verified region `eu-west-3`.

## Plan du document

1. Diagramme dépendances (texte ASCII).
2. Repo `es-academy` : structure App Router.
3. Repo `es-family` : structure + Capacitor.
4. Webhook Stripe centralisé.
5. Email infra (SES + sequences + tracking).
6. CMS Notion (cours + blog + ressources).
7. Bridge Academy ↔ Family.
8. Auth model.
9. Cron jobs.
10. Cache et ISR.
11. Décisions architecturales (ADR-style).

---

## 1. Diagramme dépendances (textuel)

```
                          ┌──────────────────┐
                          │   Utilisateurs   │
                          └────────┬─────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │  emeline-    │   │  es-family   │   │  iOS app     │
        │  siron.fr    │   │  .vercel.app │   │  Capacitor   │
        │  (Academy)   │   │  (Family)    │   │  (Family)    │
        └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
               │                  │                  │
               └─────────┬────────┴──────────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │     Vercel CDN     │
              │     (edge global)  │
              └─────────┬──────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
  ┌────────┐      ┌──────────┐     ┌──────────┐
  │ Stripe │      │ Supabase │     │ Supabase │
  │  1 cpt │      │ Academy  │     │  Family  │
  └────────┘      └──────────┘     └──────────┘
                        │                │
                        └────────┬───────┘
                                 │
                                 ▼
                       ┌──────────────────┐
                       │   pg_cron jobs   │
                       └────────┬─────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
          ┌─────────┐     ┌─────────┐     ┌─────────┐
          │ AWS SES │     │ Bunny   │     │  Notion │
          │ eu-w-3  │     │  CDN    │     │   API   │
          └─────────┘     └─────────┘     └─────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │  OneSignal  │
                                        │  (iOS push) │
                                        └─────────────┘
```

Notes :
- Le webhook Stripe est **centralisé sur Academy** (`emeline-siron.fr/api/stripe/webhook`). Les events Family sont aussi traités par Academy, qui pousse vers Supabase Family via le bridge HMAC.
- Pas de SSO entre Academy et Family. Un utilisateur a un compte Supabase Academy distinct de son compte Supabase Family.
- Bunny.net signe les URLs vidéo via `BUNNY_TOKEN_AUTH_KEY`. Le token est généré server-side avant rendu de la page cours.

---

## 2. Repo `es-academy`, structure App Router

### Route groups

`src/app/` utilise les Next 16 route groups pour séparer les espaces logiques :

```
src/app/
├── (admin)/admin/              # Espace admin (protégé par RLS + session admin)
├── (auth)/                     # Pages auth (login, callback, etc.)
├── (platform)/                 # Espace élève authentifié
│   ├── dashboard/
│   ├── cours/[slug]/
│   ├── coaching/
│   ├── evaluation/
│   ├── profil/
│   └── ressources/
├── (public)/                   # Pages légales et publiques sans nav main
│   ├── cgv/
│   ├── mentions-legales/
│   ├── politique-confidentialite/
│   └── desabonnement/
├── academy/                    # Landing principale
├── family/                     # Landing Family (paywall)
├── blog/                       # Blog Notion-backed
├── masterclass/                # Landing masterclass + sequence
├── quiz-investisseur/          # Quiz texte/visuel
├── simulateur/, simulateurs/   # Calculatrices
├── outils-gratuits/, ressources/
├── cahier-preview/             # LA landing référence design
├── chasse-oeufs/, calendrier-avent/  # Lead magnets saisonniers
├── glossaire/, a-propos/, podcast/
├── form/                       # Pages publiques de formulaires custom
├── merci/, merci-outils/       # Post-checkout
├── site-password/              # Si SITE_PASSWORD set
├── api/                        # Endpoints API (voir ci-dessous)
├── error.tsx, global-error.tsx, not-found.tsx
├── layout.tsx, page.tsx        # Layout racine + accueil
├── globals.css
├── robots.ts, sitemap.ts       # SEO
├── icon.svg, favicon.ico
```

### API routes principales

```
src/app/api/
├── admin/                      # Routes admin (protégées par session)
│   ├── activity/
│   ├── coaching-credits/
│   ├── contacts/
│   ├── eleves/
│   ├── email-templates/
│   ├── enrollments/
│   ├── forms/
│   ├── import-contacts/
│   ├── lead-magnets/
│   ├── lists/
│   ├── migrate/
│   ├── seo/
│   └── upload-image/
├── auth/                       # Magic link + callback
├── automations/                # Triggers automation
├── aws/                        # Webhook SNS (bounces/complaints SES)
├── contacts/                   # Inscription newsletter (public)
├── cron/                       # Endpoints appelés par pg_cron
│   ├── chatel-reminders/
│   ├── detect-behavioral-triggers/
│   ├── process-sequences/
│   ├── retry-academy-welcome-mail/
│   ├── seasonal-toggle/
│   ├── seo-audit/
│   ├── seo-pagespeed-audit/
│   └── sync-ses-suppression/
├── emails/                     # Webhook tracking ouvertures/clics
├── evaluation/                 # Quiz scoring
├── forms/                      # Endpoint public formulaires custom
├── og/                         # Génération OG images dynamiques
├── progress/                   # Tracking progression cours
├── quiz/                       # Quiz public submit
├── revalidate/                 # Webhook Notion → revalidate ISR
├── sequences/                  # Tracking step-level mail
├── site-auth/                  # POST password (si SITE_PASSWORD set)
├── stripe/
│   ├── checkout/               # Init session Academy
│   ├── checkout-family/        # Init session Family
│   ├── portal/                 # Customer portal (gestion sub)
│   └── webhook/                # Endpoint webhook Stripe centralisé
├── track/                      # Tracking events (pixels, etc.)
└── webhooks/                   # Webhooks externes (VideoAsk, etc.)
```

### Middleware

`middleware.ts` à la racine :
1. Vérifie session Supabase (cookies) et la rafraîchit (`updateSession`).
2. Si `SITE_PASSWORD` non vide, protège toutes les routes sauf liste blanche (API publiques, tracking, webhooks, formulaires, légal).
3. Pas de rate limiting custom au moment de l'écriture, à confirmer.

### Lib

```
src/lib/
├── alerts/                     # Notifications (Slack, WhatsApp, mail) internes
├── analytics/                  # GA4 server-side, UTM
├── bunny/                      # Génération token URL vidéo
├── config/                     # app_config DB-backed (sequences, templates, lead magnets)
├── drive/                      # Helpers Google Drive (ressources)
├── email/
│   ├── newsletter-template.ts
│   ├── render-template.ts
│   ├── templates.ts            # Catalogue templates (welcome, chatel, etc.)
│   ├── tracking.ts             # Pixels ouverture + lien clic
│   ├── welcome-academy.ts
│   └── welcome-family.ts
├── evaluation/                 # Logique quiz, scoring
├── notion/                     # Client Notion + queries + renderer (rich text → HTML)
├── seo/                        # Sitemap, robots, keywords tracking
├── sequences/                  # Moteur sequences mail (process step, advance)
├── ses/                        # Wrapper SES SDK + suppression list mgmt
├── stripe/
│   ├── checkout.ts             # Création session checkout
│   ├── client.ts               # Stripe SDK singleton
│   └── family-gift-code.ts     # Génération du code Family offert
├── supabase/
│   ├── client.ts               # Client navigateur (anon)
│   ├── server.ts               # Client serveur (anon ou service role selon contexte)
│   ├── middleware.ts           # Helper session middleware
│   ├── family-admin.ts         # Client service role pour le bridge Family
│   └── quiz.ts                 # Queries quiz
├── sync/                       # Sync helpers cross-systems
├── utils/                      # Helpers génériques
└── ressources-manifest.ts      # Catalogue ressources
```

### Schéma Supabase Academy

Migrations dans `supabase/migrations/`. État au 2026-05-12 :

Tables principales :
- `contacts` : tout prospect / élève (clé email unique).
- `enrollments` : achat Academy (1x, 3x, 4x).
- `family_subscriptions` : abonnement Family (réplique côté Academy pour reporting et bridge gift code).
- `email_sequences` + `email_sequence_steps` + `email_sequence_enrollments` : moteur sequences.
- `email_step_events` (ou nom équivalent) : tracking ouverture + clic par step.
- `email_templates` : catalogue templates HTML.
- `forms` + `form_fields` + `form_submissions` : moteur formulaires custom.
- `lead_magnets` : config des lead magnets (PDF gratuits, etc.).
- `lists` : segments de contacts pour broadcast.
- `consent_log` : registre RGPD.
- `audit_log` : trace des actions critiques.
- `processed_stripe_events` : idempotence webhook Stripe (migration 041).
- `processed_sns_messages` : idempotence webhook SNS (migration 047).
- `ses_suppression_list` : miroir local de la suppression list AWS SES.
- `app_config` : config dynamique (lead magnets, sequences, templates en DB, migration 032).
- `quiz_questions` (migration 045) : questions du quiz investisseur.
- `seo_keywords` + `seo_positions` (migration 042) : tracking SEO.
- `page_views` : analytics interne.
- `coaching_credits` : crédits coaching consommés.
- `admin_users` : rôles admin.

RLS sur toutes ces tables (sauf tables strictement publiques en lecture). Audit avec `scripts/audit-rls.mjs`.

### Schéma Supabase Family

Plus simple :
- `subscriptions` : abonnements Family.
- `users` (auth.users Supabase Family, distincts d'Academy).
- `posts`, `comments`, `reactions` : feed communautaire.
- `notifications` : queue OneSignal.
- `chatel_reminders` : rappels J-15 et J-7 de fin d'année (loi Chatel).
- `family_app_config` : config app.

Lecture cross-project depuis Academy via `ACADEMY_SUPABASE_*` côté Family (lecture seule pour vérifier l'éligibilité gift code, alumni, etc.).

---

## 3. Repo `es-family`, structure + Capacitor

- Next.js 16 + Capacitor pour iOS.
- Build web sert `es-family.vercel.app`.
- Build iOS = `npx cap sync ios && open ios/App/App.xcworkspace` puis Xcode archive + TestFlight + App Store.
- Push notif via OneSignal (SDK natif iOS + helper côté Next).
- Stripe checkout côté Vercel Family, webhook côté Vercel Family aussi (séparé d'Academy). Le webhook Family ne fait que mettre à jour Supabase Family.

---

## 4. Webhook Stripe centralisé

### Vue d'ensemble

Tous les events Stripe (Academy + Family) arrivent sur **`POST https://emeline-siron.fr/api/stripe/webhook`**.

Pourquoi centralisé : un seul compte Stripe, plus simple à monitorer, idempotence dans une seule DB.

### Events traités

- `checkout.session.completed`
  - scope=academy (déterminé par `metadata.product` ou par les line items) → row dans `enrollments`, tag `academy`, mail welcome, génération coupon Family enfant `FAMILYXXXX`.
  - scope=family → row dans `family_subscriptions`, tag `family + family:fondateur|standard`, mail welcome Family, push vers Supabase Family via bridge HMAC.
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted` → status `canceled` sur la table concernée.
- `invoice.payment_succeeded` → ack, log.
- `invoice.payment_failed` → déclencher dunning custom (template dans `email_templates`, séquence dédiée).
- `payment_intent.succeeded` → fallback si pas de checkout.
- `promotion_code.created` → ack (créé par notre propre code pour FAMILY...).

### Idempotence

Table `processed_stripe_events` (migration 041). Avant tout traitement, on insert l'event_id. Si conflict, on ack et on skip.

### Code

`src/app/api/stripe/webhook/route.ts` (~900 lignes au moment de la rédaction). Logique métier extraite dans `src/lib/stripe/` + `src/lib/email/welcome-academy.ts` / `welcome-family.ts`.

---

## 5. Email infra

### SES

- Identité verified : `emeline-siron.fr`.
- From : `emeline@emeline-siron.fr` (variable `SES_FROM_EMAIL`).
- Region : `eu-west-3` (Paris).
- Configuration set (à confirmer si configurée) pour le tracking bounces + complaints via SNS.
- Production access activé (sortie du sandbox).

### Webhook SNS bounces/complaints

`POST /api/aws` (route Webhook SNS). Confirme la subscription au premier appel, puis :
- Bounce → ajoute à `ses_suppression_list` + sync vers AWS Suppression list.
- Complaint → idem + désinscrit le contact (`unsubscribed_at = now()`).

Idempotence via `processed_sns_messages` (migration 047).

### Sequences

Moteur custom DB-backed.

Tables :
- `email_sequences` : id, slug, name, status (draft/active/paused), description.
- `email_sequence_steps` : id, sequence_id, order, template_id, delay_minutes, conditions (jsonb).
- `email_sequence_enrollments` : id, contact_id, sequence_id, status, current_step, started_at.
- `email_step_events` (à confirmer nom) : tracking ouverture + clic par step.

Cron `/api/cron/process-sequences` toutes les 5 min :
- Sélectionne les enrollments `active` dont le prochain step est dû.
- Pour chaque, render le template, envoie via SES, log dans audit_log.
- Avance `current_step`.
- Si dernier step → status `completed`.

Cron `/api/cron/retry-academy-welcome-mail` toutes les 10 min :
- Retente les envois post-achat qui ont fail (3 tentatives max, puis status `giveup`).

### Tracking

- Pixel ouverture : `/api/emails/track-open?token=...` (route tracking).
- Lien clic : tous les liens sont réécrits en `/api/emails/track-click?token=...&url=...`.
- Tokens signés HMAC pour empêcher la falsification.

### Templates

- HTML stockés dans `email_templates` table (DB-backed, éditables via `/admin/email-templates`).
- Pas de hardcoding du contenu dans le code (cf. feedback `zero_hardcoding`).
- Render via `src/lib/email/render-template.ts` : Handlebars-like substitutions + helpers (lien désinscription, lien magic link, etc.).

---

## 6. CMS Notion

### Pourquoi Notion

Editorial souple, multi-utilisateurs, pas de back-office custom à maintenir, Emeline et Tiffany écrivent direct dans Notion.

### Databases

- `NOTION_COURSES_DB` : 1 cours = la formation Academy.
- `NOTION_MODULES_DB` : 14 modules.
- `NOTION_LESSONS_DB` : 66 leçons. Champs : slug, order, module, free_preview (bool), video_id (Bunny), thumbnail.
- `NOTION_RESOURCES_DB` : ressources téléchargeables.
- `NOTION_BLOG_DB` : articles blog publics.
- `NOTION_QUIZZES_DB` : (parfois utilisé, à vérifier).

### Sync strategy

- Pages cours et blog : ISR Next.js. Revalidate sur `webhook Notion → /api/revalidate`. Si Notion ne push pas le webhook, fallback revalidate toutes les 1h.
- Pas de cache long en runtime : Notion API limite à 3 req/s, on est attentifs.
- Si Notion rate limited : fallback statique sert le dernier snapshot (cf. `INCIDENT_RUNBOOK.md`).

### Renderer

`src/lib/notion/renderer.tsx` : convertit les rich text blocks Notion en JSX. Supporte les bullets, headings, code, images, embed YouTube/Vimeo, callouts, toggles.

---

## 7. Bridge Academy ↔ Family

Quand un client achète Academy, on lui offre 3 mois Family. Workflow :

1. Webhook Stripe Academy reçoit `checkout.session.completed` scope=academy.
2. Code génère un Promotion Code Stripe enfant `FAMILYXXXX` (basé sur le coupon parent `STRIPE_COUPON_ACADEMY_GIFT`), valide 6 mois, limité à 1 redemption.
3. Mail welcome Academy contient ce code Family + CTA "Activer mes 3 mois".
4. Clic CTA → redirection vers `/family?code=FAMILYXXXX` (côté Academy, qui sert la landing Family avec pré-fill du code).
5. Checkout Family côté Vercel Family valide le code via Stripe (3 mois 100 % off, puis 19 ou 29 € selon `STRIPE_FAMILY_FONDATEUR_CAP`).
6. Webhook Family côté Vercel Family crée l'abonnement dans Supabase Family.
7. Push HMAC d'Academy vers Family : "ce contact a aussi un enrollment Academy", pour afficher un badge.

Pour le bridge HMAC :
- Secret partagé : `ACADEMY_FAMILY_BRIDGE_SECRET`.
- Endpoint Family : `POST /api/internal/from-academy` (à vérifier nom exact).
- Signature : HMAC SHA-256 du body + timestamp, avec window 5 min pour rejouer la signature.

---

## 8. Auth model

### Academy

- Supabase Auth.
- Magic link only (pas de mdp).
- Email envoyé via SES (template custom).
- Session cookies httpOnly via `@supabase/ssr`.
- Middleware refresh la session sur chaque requête.

### Family

- Supabase Auth distinct (autre projet).
- Magic link aussi.
- iOS Capacitor utilise le même flow (magic link via mail Universal Links).
- OneSignal player_id stocké en post-login pour push.

### Admin

- Login admin via le même magic link Academy.
- Vérification du rôle dans `admin_users` table.
- RLS Supabase filtre selon le rôle pour les routes `/admin/...`.

---

## 9. Cron jobs (pg_cron Supabase)

Tous appellent un endpoint `/api/cron/...` avec header `Authorization: Bearer $CRON_SECRET`.

| Job | Fréquence | Action |
|---|---|---|
| `process-sequences` | 5 min | Avancer les enrollments séquences mail |
| `retry-academy-welcome-mail` | 10 min | Retenter les mails post-achat fail |
| `detect-behavioral-triggers` | 15 min | Détecter inactivité prolongée, déclencher SEQ_REACT |
| `chatel-reminders` | 1h | Envoyer rappels Family J-15 et J-7 |
| `seasonal-toggle` | 1h | Basculer landings saisonnières (chasse aux oeufs, calendrier avent) |
| `seo-audit` | 24h | Audit SEO complet |
| `seo-pagespeed-audit` | 24h | PageSpeed Lighthouse |
| `sync-ses-suppression` | 1h | Sync miroir local de la SES suppression list |
| `prune_audit_log` | 24h | Purge audit_log > 90 jours |

Tous les jobs émettent un heartbeat BetterStack en fin d'exécution (à vérifier câblé dans le code).

---

## 10. Cache et ISR

- Pages landing publiques (`/academy`, `/family`, `/cahier-preview`, etc.) : ISR avec `revalidate` 1h par défaut. Revalidation manuelle via webhook Notion.
- Pages blog : ISR 1h.
- Pages cours `/cours/[slug]` : SSR + RLS check à chaque hit (impossible de cacher, contenu dépend de l'utilisateur).
- Pages admin : SSR no-cache, header `Cache-Control: no-store`.
- API endpoints publics (`/api/contacts`, `/api/forms/*/submit`) : pas de cache, POST.
- Pas de Edge runtime explicite, on tourne en Node.js runtime pour avoir accès à `stripe`, `@aws-sdk/*`, etc.

---

## 11. Décisions architecturales notables

Format ADR-light. À enrichir au fur et à mesure dans `docs/architecture/decisions/`.

### ADR-001 : 1 seul compte Stripe pour Academy + Family

**Décision :** Centraliser tous les paiements Academy et Family sur le compte Stripe ES Academy SASU.

**Pourquoi :** un seul TVA, un seul reporting, un seul KYC. Simplification fiscale.

**Conséquence :** webhook centralisé sur Academy, bridge nécessaire vers Family DB.

### ADR-002 : 2 Supabase séparés Academy / Family

**Décision :** Pas de Supabase unique, pas de SSO.

**Pourquoi :** Family doit pouvoir être vendu / cédé / fermé indépendamment. Communauté Family ne doit pas voir le CRM Academy. Sécurité par défaut.

**Conséquence :** un utilisateur a 2 comptes distincts (1 par produit), peut partager le même email. Pas de "Login with Academy account" côté Family.

### ADR-003 : Webhook Stripe centralisé sur Academy

**Décision :** L'unique endpoint webhook Stripe pointe sur Academy. Family fait son propre webhook séparé pour ses checkouts directs.

**Pourquoi :** la complexité de la logique post-achat (gift code, sequences, audit) vit côté Academy. Family délègue.

**Conséquence :** Academy doit être UP pour que les webhooks soient ack. En cas de panne Academy, Stripe retry pendant 3 jours, donc tolérance acceptable.

### ADR-004 : Sequences mail DB-backed, pas de tiers (Mailchimp/Brevo)

**Décision :** Moteur custom (tables `email_sequences` + cron).

**Pourquoi :** contrôle total (pas de dépendance fournisseur), coût zéro au-delà de SES, RGPD plus simple, intégration native avec le CRM Academy.

**Conséquence :** maintenance du moteur custom. Audit régulier nécessaire (`audit-sequences.mjs`).

### ADR-005 : Notion comme CMS

**Décision :** Pages cours et blog stockées dans Notion, lues via API à chaque revalidate ISR.

**Pourquoi :** Emeline et Tiffany écrivent directement dans Notion. Pas de back-office custom à coder. Versionning intégré.

**Conséquence :** dépendance à Notion API (rate limit 3 req/s). Fallback statique en cas de panne.

### ADR-006 : Bunny.net pour vidéo

**Décision :** Vidéos cours et Family sur Bunny Stream, pas YouTube ni Vimeo.

**Pourquoi :** signature URL token, contrôle d'accès, prix raisonnable, pas de pubs YouTube intempestives.

**Conséquence :** un backup Vimeo paid existe pour les vidéos critiques en cas de panne Bunny.

### ADR-007 : Pas de Skool (abandon avril 2026)

**Décision :** Skool abandonné, Family est dans notre app Next + iOS native.

**Pourquoi :** maîtrise de la donnée, de l'UX, de la monétisation. Plus de double facturation.

**Conséquence :** plus de fonctionnalités communauté à construire en interne (feed, commentaires, notifications). Trade-off : tu paies en dev ce que tu gagnes en contrôle.

### ADR-008 : Vercel pour Academy (migration de Netlify)

**Décision :** Migration Netlify → Vercel courant 2026 (script `migrate-netlify-to-vercel.mjs`).

**Pourquoi :** support natif Next 16 App Router, edge functions, intégration Sentry, analytics intégrée.

**Conséquence :** ré-écriture des `netlify.toml` rules en `vercel.json` + ré-configuration des env vars.

### ADR-009 : 0 hardcoding pour le contenu marketing

**Décision :** Mails, séquences, templates, tags, lead magnets, config landings = tout en DB (`app_config`, `email_templates`, etc.), éditable via `/admin`.

**Pourquoi :** Tiffany (copywriter) doit pouvoir itérer sans toucher au code.

**Conséquence :** schéma `app_config` doit être versionné. Pas de "valeur par défaut hardcodée" sur laquelle compter.

---

## Annexes

### Scripts utiles pour la doc architecture

```bash
# Lister toutes les routes API
find ~/es-academy/src/app/api -name 'route.ts' | sed 's|.*src/app/api/||;s|/route.ts$||'

# Lister les migrations Supabase appliquées
ls ~/es-academy/supabase/migrations/

# Lister les crons configurés en pg_cron
# (à exécuter dans Supabase SQL Editor)
SELECT jobname, schedule, command FROM cron.job;
```

### Diagrams plus détaillés à venir

- Diagramme séquence "Achat Academy" en mermaid.
- Diagramme séquence "Achat Family avec code Academy".
- Diagramme dunning Stripe 3x/4x.

À écrire dans `docs/architecture/sequences/`.

---

**Dernière mise à jour :** 2026-05-12.
