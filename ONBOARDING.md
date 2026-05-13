# ONBOARDING : ES Academy + ES Family

Bienvenue. Ce doc est pour toi si tu arrives dans l'équipe ES Academy comme dev, ops, support ou copywriter. Il te permet de devenir productif en moins de 2 jours, sans casser de prod.

- **Sponsor onboarding :** Emeline (toujours).
- **Buddy technique :** Claude (assistant IA disponible 24/7 dans l'IDE de l'équipe).
- **Durée typique :** 2 jours pour être autonome sur le périmètre, 1 semaine pour être complètement à l'aise.

## Table des matières

1. Avant ton premier jour (côté Emeline)
2. Jour 1 : setup matériel + accès
3. Jour 1 : lecture indispensable
4. Jour 2 : exécution sandbox + premier dev
5. Périmètres spécifiques par rôle
6. Glossaire et conventions
7. Liens utiles

---

## 1. Avant ton premier jour (à faire par Emeline)

Checklist côté Emeline, à valider 48h avant l'arrivée :

- [ ] Email pro créé sur Google Workspace (`prenom@emeline-siron.fr`).
- [ ] 1Password coffre `ES Academy Team` partagé.
- [ ] Compte GitHub invité sur le repo `es-academy` (et `es-family` si dev front).
- [ ] Compte Supabase invité, rôle adapté (Read-only par défaut, Developer si dev).
- [ ] Compte Vercel invité, rôle Member.
- [ ] Compte Stripe invité, rôle View-only par défaut.
- [ ] Compte Notion invité sur le workspace ES Academy.
- [ ] Compte admin Academy créé via `/admin > Utilisateurs > Inviter` (si rôle admin nécessaire).
- [ ] Calendrier réunion d'accueil J0 9h-12h bloqué.
- [ ] Cette page envoyée par mail + Slack/WhatsApp.

---

## 2. Jour 1 (matin) : setup matériel + accès

### Matériel

- Mac (ou Linux). Pas de Windows pour le dev (les scripts shell ne sont pas testés sur PowerShell).
- 16 Go RAM minimum, 32 Go recommandé pour build Next 16 + iOS simulator.
- Node 20+ et npm récents. Vérifier : `node --version`, `npm --version`.
- Git configuré : `git config --global user.name "Prénom Nom"`, `git config --global user.email "prenom@emeline-siron.fr"`.
- 1Password installé + connecté au coffre équipe.
- Éditeur : Cursor ou VS Code (Cursor recommandé pour intégration Claude).
- iTerm2 ou Warp (zsh).

### Comptes & 2FA

Activer 2FA TOTP partout dès la première connexion :
- GitHub : Settings > Two-factor authentication.
- Supabase : Profile > Two-Factor Authentication.
- Vercel : Account Settings > Authentication.
- Stripe : User settings > Two-factor authentication (obligatoire au premier login).
- Notion : Settings > My account > 2-step verification.
- AWS (si tu as un IAM user) : 2FA Yubikey préférée, sinon TOTP.

Reco : Authy ou Bitwarden Authenticator (pas SMS, vulnérable au SIM swap).

### Clone des repos

```bash
mkdir -p ~/dev
cd ~
# Repos principaux
git clone <url> es-academy
git clone <url> es-family
git clone <url> solstice            # si concerné
git clone <url> otb-podcast-site    # si concerné
```

Important : un repo = un dossier. **Ne JAMAIS mélanger** `~/solstice` (port 3000), `~/es-academy` (port 3001), `~/es-family` (port 3002), `~/otb-podcast-site`. Cf. mémoire `feedback_separate_projects.md` côté Claude. Si tu ouvres plusieurs projets, ouvre-les dans plusieurs fenêtres Cursor distinctes.

### Env vars locales

Pour chaque repo Next.js :
1. Copier `.env.example` vers `.env.local` à la racine du repo.
2. Demander à Emeline les valeurs dev (Stripe test mode, Supabase URLs).
3. **Jamais** committer `.env.local`. Le `.gitignore` le protège, mais reste vigilant.
4. **Jamais** mettre les valeurs prod dans le `.env.local` local. Si tu veux tester avec prod, fais-le depuis Vercel preview.

### Installer les dépendances

```bash
cd ~/es-academy && npm install
cd ~/es-family && npm install
```

### Premier lancement

```bash
cd ~/es-academy && npm run dev
# Ouvrir http://localhost:3001
```

Si le port 3001 est occupé : `lsof -i :3001` pour voir qui, et **ne pas killer sans demander à Emeline** (cf. mémoire `feedback_pas_killer_ports.md`).

---

## 3. Jour 1 (après-midi) : lecture indispensable

Dans l'ordre, pas plus de 4h total :

1. **`AGENTS.md`** racine du repo : avertissement Next 16 (breaking changes vs ce que Claude / toi pourrais connaître par habitude). Lecture obligatoire avant tout code.
2. **`ARCHITECTURE.md`** : tour d'ensemble du système, des dépendances, des choix architecturaux. Lecture obligatoire pour devs et ops.
3. **`OPERATIONS_RUNBOOK.md`** : ce qu'on fait au quotidien. Lecture obligatoire pour ops et support.
4. **`INCIDENT_RUNBOOK.md`** : que faire si une dépendance lâche. Lecture obligatoire pour tous (tu pourrais être le premier témoin d'un incident).
5. **`SECURITY_RUNBOOK.md`** : RGPD, secrets, gestion des accès. Lecture obligatoire pour tous, surtout support et ops.
6. **`MONITORING.md`** : dashboards, alertes, SLOs. Lecture obligatoire pour devs et ops.
7. **`LAUNCH_RUNBOOK.md`** : procédure jour J. Lecture si lancement imminent ou re-lancement prévu.

Compléments selon rôle :
- **Dev** : `next.config.ts`, `middleware.ts`, `src/app/layout.tsx`, et une lecture rapide de l'arbre `src/`.
- **Copywriter** : `/admin/sequences` et `/admin/email-templates` en local, naviguer pour comprendre le moteur.
- **Support / Ops** : `/admin/dashboard`, `/admin/contacts`, `/admin/eleves`.

---

## 4. Jour 2 : exécution sandbox + premier dev

### Smoke test local

```bash
cd ~/es-academy && BASE_URL=http://localhost:3001 bash scripts/smoke-test.sh
```

Attendu : 21/21 OK (peut varier si certaines routes nécessitent Supabase prod, demander à Emeline).

### Premier achat test (parcours utilisateur)

1. Lancer dev `npm run dev`.
2. Aller sur `http://localhost:3001/academy`.
3. Cliquer "Acheter en 1x".
4. Utiliser CB Stripe test `4242 4242 4242 4242`, date future, CVC `123`.
5. Sur `/merci` : vérifier code Family affiché.
6. Vérifier mail dans la console SES dev (ou inbox local si SES configuré).

Si quelque chose casse, c'est probablement une env var manquante ou Supabase pas accessible. Demander à Emeline.

### Premier dev (rôle dev)

Tâche d'onboarding standard : choisir un ticket "good first issue" dans le backlog Notion.

Workflow :
1. Branche `git checkout -b onboarding/<ton-prénom>/<feature-courte>`.
2. Code.
3. `npm run lint` doit passer sans warning.
4. `npm run build` doit passer sans erreur.
5. Smoke test local.
6. PR sur GitHub, demande de review à Emeline ou Claude (via commentaire `@claude review`).
7. Pas de merge avant approval.

Conventions :
- Code en anglais, copy en français.
- Pas d'em dash (le tiret long unicode U+2014) dans les commentaires, mails, copy (cf. mémoire `feedback_pas_em_dash.md`). Virgule, deux-points ou point à la place.
- Tutoiement partout pour Academy / Family / OTB. Vouvoiement pour Solstice uniquement (CGP institutionnel).
- Pas le mot "certifiant" / "certifié" / "diplômant" en copie marketing (non RNCP).
- Tous les contenus mails / sequences / templates / tags vivent en DB, jamais hardcodés.

---

## 5. Périmètres spécifiques par rôle

### Dev front / full-stack

**Stack à maîtriser :** Next.js 16 App Router, React 19, Server Components, Tailwind 4, TypeScript.

**Particularité Next 16 :** ce n'est pas le Next.js que tu connais. APIs, conventions et structure ont changé. Lire `node_modules/next/dist/docs/` avant d'écrire du code. Ne pas se fier aux exemples en ligne (souvent Next 14/15).

**Choses à ne pas faire :**
- Pas de `use client` partout. Préférer Server Components par défaut.
- Pas de `useEffect` pour fetch. Préférer Server Component + `fetch` ou Server Action.
- Pas de routes API qui contournent le webhook Stripe (idempotence).
- Pas de mock DB en tests (cf. principe général : si on teste, on teste réel).

**Ce que tu touches :** `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`.

### Dev backend / data

**Stack :** Supabase Postgres, RLS policies, pg_cron, Edge Functions Supabase (rare).

**Workflow migration :**
1. Créer un fichier `supabase/migrations/NNN_description.sql` avec un numéro incrémental.
2. Tester en local d'abord (Supabase CLI ou applique direct sur un projet Supabase dev).
3. Appliquer en prod via `bash scripts/apply-migration.sh supabase/migrations/NNN_*.sql`.
4. Si la migration touche des données utilisateur, faire un backup PITR juste avant.

**Choses à ne pas faire :**
- Pas de `DROP TABLE` sans `IF EXISTS` + sans backup.
- Pas de migration destructive sans accord Emeline.
- Pas de désactivation RLS, même temporaire, sans accord Emeline.

### Copywriter (Tiffany)

**Périmètre :** sequences mail, templates, copy landings, blog Notion.

**Outils :**
- `/admin/email-templates` : édition HTML des templates.
- `/admin/sequences` : config steps, conditions, timing.
- Notion : édition blog + leçons cours + ressources.
- Pas besoin de toucher au code. Si une feature manque côté admin UI, demander un ticket dev.

**Conventions copy :**
- Tutoiement.
- Pas d'em dash.
- Pas "certifiant".
- Style ES Academy : raconter l'histoire vraie, pas le pitch. Référence `/cahier-preview` design + storytelling (cf. mémoire `feedback_landings_style.md`).
- Autofinancement > cashflow comme angle.
- "La méthode Emeline SIRON" (pas "ma méthode").
- 1 emoji max par mail.

### Support / closer (Antony)

**Périmètre :** tickets `contact@emelinesiron.com`, RDV Calendly (URL Antony spécifique pour chaque source de lead).

**Outils :**
- Gmail filtres : labels `LAUNCH`, `URGENT`, `BUG`, `RGPD`, `BUSINESS`.
- `/admin/contacts` (read-only) : trouver un contact, ses enrollments, son historique séquences.
- Calendly back-office : créer / modifier des créneaux.
- WhatsApp groupe équipe pour les escalades.

**Procédures support :**
- "Pas reçu mon mail" → vérifier `ses_suppression_list` (demander à Emeline ou Claude la requête). Si suppressed avec hard bounce, l'adresse est invalide. Sinon, déclencher renvoi via `/admin/eleves/<id> > Renvoyer mail` (cf. `OPERATIONS_RUNBOOK.md`).
- "Stripe a échoué mais débité" → escalade direct Emeline, ne pas refund toi-même.
- "Je veux me désinscrire" → si le lien `/desabonnement?token=...` ne marche pas, désinscription manuelle SQL (cf. `OPERATIONS_RUNBOOK.md`).
- "RGPD demande accès / suppression" → escalade Emeline + lire `SECURITY_RUNBOOK.md` pour le timing légal.

**Ce que tu ne fais pas seul :**
- Refunds Stripe.
- Modifications de paiement / promo code.
- Suppression de compte.
- Communication externe (réseaux sociaux).

### Ops / coordination (Fita)

**Périmètre :** tâches déléguées par Emeline, coordination Tiffany et Antony, vérifs hebdo.

**Outils :**
- `/admin/dashboard` (read-only) : vue d'ensemble.
- Notion : récap hebdo marketing, suivi planning éditorial.

**Tu n'as pas accès à :**
- Code source (sauf demande explicite).
- Modifications Stripe.
- Migrations Supabase.

---

## 6. Glossaire et conventions

### Glossaire métier

| Terme | Définition |
|---|---|
| Academy | Formation principale 998 €, vendue en 1x / 3x / 4x. |
| Family | Abonnement mensuel communauté, 19 € fondateur (500 premiers) ou 29 € standard. |
| Alumni Evermind | 1900 anciens élèves Evermind (plateforme précédente). Cohorte d'intérêt légitime pour la migration. |
| Brevo | Ex-fournisseur emailing avec ~35 000 contacts à migrer en cohortes. |
| Founder 500 | Les 500 premiers abonnés Family au tarif fondateur 19 €/mois à vie. |
| Sprint | Une cohorte de leçons / un thème de la formation Academy. 5 sprints prévus. |
| Lead magnet | Asset gratuit (PDF, masterclass, quiz, simulateur) en échange d'un email. |
| Sequence (mail) | Suite ordonnée de mails déclenchés par un événement (achat, opt-in, etc.). |
| audit_log | Table Postgres qui trace les actions sensibles. |
| consent_log | Table Postgres qui trace les consentements RGPD. |
| RLS | Row Level Security, isolation par utilisateur côté Postgres Supabase. |

### Glossaire technique

| Terme | Définition |
|---|---|
| App Router | Système de routing de Next 13+ basé sur `src/app/`. |
| Server Component | Composant React rendu côté serveur, sans JS envoyé au client. |
| Server Action | Fonction async exécutée côté serveur, appelable depuis un Client Component. |
| ISR | Incremental Static Regeneration : page statique re-générée périodiquement. |
| Edge Function | Function Supabase déployée à proximité utilisateur (Deno runtime). Rarement utilisée ici. |
| pg_cron | Extension Postgres pour scheduler des jobs. Utilisée par Supabase pour nos crons. |
| PITR | Point-In-Time Recovery, restauration Supabase à un instant T. |

### Conventions de code

- **Indentation :** 2 espaces, jamais tabs.
- **Quotes :** doubles `"..."` en TypeScript, simples `'...'` en SQL.
- **Imports :** absolus via alias `@/...` (cf. `tsconfig.json`).
- **Naming :** camelCase pour variables / fonctions, PascalCase pour types / composants, kebab-case pour fichiers.
- **Async :** toujours `async/await`, pas de `.then()`.
- **Erreurs :** toujours typed, jamais `any`. Use `unknown` + narrowing si vraiment nécessaire.
- **Logs :** structured logs, pas `console.log` libre en prod.

### Conventions Git

- `main` = prod. Merge déclenche deploy Vercel.
- `dev` ou branches feature : `feat/...`, `fix/...`, `chore/...`, `docs/...`.
- Pas de push direct sur `main`. PR + review.
- Commits : verbes à l'impératif anglais, court (< 70 char) : `feat: add coaching credit limit on enrollment`.
- Pas de `--no-verify` sauf accord explicite.

---

## 7. Liens utiles

### Production

- Site Academy : https://emeline-siron.fr
- Admin Academy : https://emeline-siron.fr/admin
- Site Family : https://es-family.vercel.app
- Site OTB Podcast : https://otb-podcast.fr (statique Netlify)
- Site Solstice : (à voir avec Emeline)

### Infra

- GitHub orga : https://github.com/orgs/<org>
- Vercel : https://vercel.com/es-academy
- Supabase Academy : https://supabase.com/dashboard/project/tvkzndkywznaysiqvmsh
- Supabase Family : https://supabase.com/dashboard/project/hpcoxtpdsydcrwdudhsk
- Stripe : https://dashboard.stripe.com
- AWS Console (région eu-west-3) : https://eu-west-3.console.aws.amazon.com
- AWS SES : https://eu-west-3.console.aws.amazon.com/sesv2
- OneSignal : https://app.onesignal.com
- Bunny : https://dash.bunny.net

### Outils

- Notion workspace : (lien à ajouter par Emeline)
- 1Password coffre : `ES Academy Team`
- Slack / WhatsApp : (lien à ajouter par Emeline)
- Trustpilot : (lien à ajouter)

### Documentation interne

- `AGENTS.md` : règles pour les agents IA (Claude, Cursor).
- `ARCHITECTURE.md` : ce que tu lis pour comprendre le système.
- `LAUNCH_RUNBOOK.md` : procédure jour J.
- `INCIDENT_RUNBOOK.md` : pannes externes.
- `OPERATIONS_RUNBOOK.md` : routines journalières / hebdo / mensuelles.
- `MONITORING.md` : observabilité.
- `SECURITY_RUNBOOK.md` : RGPD + secrets.
- `docs/architecture/` : ADRs et schémas détaillés.
- `docs/sprint5/` : roadmap dernier sprint.

### Lecture externe recommandée

- Next.js 16 release notes : https://nextjs.org/blog/next-16
- Supabase docs : https://supabase.com/docs
- Stripe Billing for SaaS : https://stripe.com/docs/billing
- RGPD pour PME : https://www.cnil.fr/fr/professionnels

---

## Premier jour : message d'accueil à Emeline

À envoyer en fin de jour 1 sur WhatsApp ou Slack :

> Bonjour Emeline,
> J'ai terminé le setup et lu [liste des docs lus].
> Questions / blocages : [liste].
> Demain je commence sur [ticket / périmètre].
> Bonne soirée.

C'est tout. Pas besoin d'en faire des tonnes. Le rythme se construit jour après jour.

---

**Dernière mise à jour :** 2026-05-12.
