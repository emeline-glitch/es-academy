# AUDIT STRESS TEST ES Academy

Date : 12 mai 2026 (J-2 du lancement officiel mi-mai 2026)
Périmètre : `~/es-academy` (Next.js 16 App Router, Supabase, Stripe, AWS SES, Notion, Bunny)
Méthode : lecture du code, parcours bout-en-bout, vérification fichier:ligne.

Sévérité : 🔴 critique (bloque lancement) / 🟠 majeur (à fixer 7j) / 🟡 mineur (30j) / 🟢 cosmétique (90j)

---

## 1. RÉSUMÉ EXÉCUTIF

**État global : le code est solide sur le webhook Stripe, le schéma RLS, le rate limiting basique et l'idempotence. Mais 5 points cassent ou risquent de casser le lancement.**

Top 5 risques bloquants :

1. 🔴 **`FAMILY_LAUNCH_PENDING = true`** en dur (`src/lib/utils/constants.ts:22`). Bloque tout `/api/stripe/checkout-family`. Personne ne peut s'abonner Family le jour J si ce flag n'est pas inversé.
2. 🔴 **Dashboard élève entièrement placeholder** (`src/app/(platform)/dashboard/page.tsx:14`). Un acheteur 998€ qui se connecte voit une fausse carte de cours sans données réelles. Risque remboursement immédiat + avis 1 étoile.
3. 🔴 **8 routes API admin-territory sans `requireAdmin()`** : un élève authentifié peut créer/supprimer des séquences, lancer des campagnes, désabonner d'autres contacts. Risque destruction délivrabilité SES + amende RGPD.
4. 🔴 **Pas de gestion des bounces/complaints SES**. Sans pipeline SNS bounce/complaint, le compte SES sera suspendu dès la première vague d'envoi à 35K Brevo (taux bounce > 5%).
5. 🔴 **Examen final passable en client-side trivial** (`src/app/(platform)/evaluation/page.tsx`). Les `correct: N` sont dans le bundle JS. Diplôme frauduleux trivial via DevTools.

Conséquences si on lance tel quel le 14 mai : pertes financières directes Family + un afflux de tickets support + risque blocage SES sur la première campagne de masse.

---

## 2. CARTOGRAPHIE RÉELLE

Inventaire de ce que j'ai trouvé dans le code (pas ce que je supposais).

### 2.1 Structure App Router

Route groups : `(public)`, `(auth)`, `(platform)`, `(admin)`.

Pages publiques (33) : `/`, `/academy`, `/coaching`, `/family`, `/a-propos`, `/blog`, `/blog/[slug]`, `/blog/categorie/[category]`, `/glossaire`, `/podcast`, `/masterclass`, `/masterclass/merci`, `/merci`, `/merci-outils`, `/outils-gratuits`, `/quiz-investisseur`, `/quiz-investisseur/play`, `/form/[slug]`, 9 simulateurs (`/simulateurs/*`), `/simulateur` (singulier, doublon, voir 2.5), `/calendrier-avent`, `/calendrier-avent/merci`, `/chasse-oeufs`, `/chasse-oeufs/merci`, `/cahier-preview`, `/cahier-preview/merci`, `(public)/cgv`, `mentions-legales`, `politique-confidentialite`, `desabonnement`, `/site-password`.

Pages auth (4) : `connexion`, `inscription`, `mot-de-passe-oublie`, `reset-password`.

Pages élève (7) : `dashboard`, `cours/[courseSlug]`, `cours/[courseSlug]/[moduleSlug]/[lessonSlug]`, `profil`, `ressources`, `coaching`, `evaluation`.
Note : pas de page module intermédiaire (`/cours/[courseSlug]/[moduleSlug]/page.tsx`). Le directory existe mais sans page.tsx, donc un clic sur un module en URL directe = 404.

Pages admin (15) : `admin`, `dashboard`, `pipeline`, `contacts` + `[id]`, `lists`, `forms` + `[id]`, `eleves` + `[userId]`, `emails` + `new` + `templates` + `[id]`, `sequences`, `tunnels`, `activity`, `lead-magnets`, `import-contacts`, `seo`, `settings`.

API routes (63) : 22 sous `/api/admin`, 4 sous `/api/auth`, 4 sous `/api/contacts`, 8 sous `/api/cron`, 4 sous `/api/emails`, 2 sous `/api/forms`, 7 sous `/api/sequences`, 4 sous `/api/stripe`, 3 sous `/api/track`, autres divers.

### 2.2 Migrations Supabase (47)

001 à 045_seo_pg_cron_jobs. Numérotation cassée : deux migrations `044` (044_fix_rls_critical.sql et 044_seo_advanced.sql) et deux `045` (045_quiz_questions.sql et 045_seo_pg_cron_jobs.sql). Supabase migrate les applique par tri lexical, donc ça passe, mais à surveiller pour les prochaines.

État des tables critiques :
- `profiles`, `enrollments`, `progress`, `quiz_results` : RLS strict user_id = auth.uid() ✓
- `email_templates`, `processed_dunning_invoices`, `billing_reminders`, `consent_log`, `quiz_responses`, `contact_events` : RLS admin-only ajouté par 044_fix_rls_critical.sql ✓
- `family_subscriptions` : RLS activé (migration 038) mais **zéro policy** : ni admin ni user ne peuvent lire via client. OK car service role only dans le code, mais fragile.

### 2.3 Intégrations externes

| Intégration | Branchée | Fichier | Statut |
|---|---|---|---|
| Stripe checkout Academy | Oui | `src/lib/stripe/`, `api/stripe/checkout/route.ts` | ✓ solide |
| Stripe checkout Family | Bloquée | `api/stripe/checkout-family/route.ts:16` | 🔴 FAMILY_LAUNCH_PENDING=true |
| Stripe webhook | Oui | `api/stripe/webhook/route.ts` | ✓ idempotent solide |
| AWS SES | Oui | `src/lib/ses/client.ts` | 🔴 pas de bounce handler |
| Notion CMS (5 DBs) | Oui | `src/lib/notion/queries.ts` | 🟠 pas de retry, cache 3600s |
| Bunny Stream | Oui | `src/lib/bunny/signed-url.ts` | 🟠 token 6h partageable |
| Calendly | Lien static | 3 fichiers | 🟡 pas de webhook, pas de sync |
| Brevo | Non branché | aucun script | 🔴 migration 35K non préparée |
| GA4 server-side | Oui | `src/lib/analytics/ga4-server.ts` | ✓ |
| Sentry / monitoring | **NON** | absent du `package.json` | 🔴 zéro observabilité erreurs |
| GTM / GA4 client | Oui | `src/components/seo/` | ✓ |

### 2.4 Crons (pg_cron Supabase)

Configurés en SQL via `cron.schedule` + `net.http_post` avec Bearer CRON_SECRET :
- `process-sequences` toutes les 10 min (migration 023)
- `seasonal-toggle` quotidien 5h UTC (migration 035)
- `chatel-reminders`, `detect-behavioral-triggers`, `retry-academy-welcome-mail` (migration 023)
- `seo-audit`, `seo-pagespeed-audit` (migration 045_seo_pg_cron_jobs)
- `cleanup_old_audit_log` : RPC existe (migration 006) mais **AUCUN cron ne l'appelle**. La table audit_log grossit indéfiniment.

### 2.5 Variables d'env

35 vars dans `.env.local`. Notable :
- `STRIPE_*` complet
- `BUNNY_*`, `NOTION_*` complet
- `AWS_SES_*` complet + `SES_FROM_EMAIL`, `SES_FROM_NAME`
- `SITE_PASSWORD` présent (à VIDER en prod le jour J)
- `CRON_SECRET` : absent du fichier listé, mais référencé dans le code + en dur dans migration 023 (problème, voir section 6)
- `UPSTASH_*` : absent (rate limit en mémoire seulement)
- `SENTRY_DSN` : absent

---

## 3. PARCOURS CLIENT (zone 1, public)

### 3.1 Persona 1 : prospect froid arrivant par Google sur article blog

Flow : Google → `/blog/[slug]` → CTA newsletter en bas → email entré → `/merci` → séquence email.

Findings :

**🔴 OG images inexistantes** — `public/images/og-default.jpg` référencée dans `src/app/layout.tsx:42` et `src/lib/seo/metadata.ts:50`. Vérifié : `ls public/images/og*` retourne 0 résultat. Toutes les previews LinkedIn/Twitter/WhatsApp sont cassées. Fix : générer `og-default.jpg` et `og-family.jpg` (1200x630) via Figma ou `/api/og` (déjà présente dans `src/app/api/og/`, à vérifier qu'elle est branchée).

**🟠 Pas de schema JSON-LD Article sur `/blog/[slug]`** — le layout racine pose `organizationSchema`, `websiteSchema`, `personSchema` (`src/app/layout.tsx`) mais aucun schema BlogPosting/Article par article. Manque le rich snippet Google (date publication, auteur, image). Fix : ajouter `<JsonLd schema={articleSchema(article)} />` dans `src/app/blog/[slug]/page.tsx`.

**🟠 Cookie consent non-granular** — `src/components/ui/CookieConsent.tsx` propose accept/decline binaire. CNIL 2022 demande accept aussi facile que refuser (OK : 2 boutons même taille) mais aussi catégorisation analytics/marketing/fonctionnel. Risque : amende symbolique CNIL si plainte. Fix : 30 min de refacto, ajouter checkboxes par catégorie.

**🟡 Pas de honeypot ni captcha** sur `/api/contacts` (newsletter), `/api/forms/[slug]/submit`, `/api/quiz/submit`. Le rate limit IP 5 req/min protège contre volumes bruts mais pas contre bot lent. Fix : ajouter champ `website` caché côté client + check côté serveur (5 min).

**🟡 Doublon `/simulateur` et `/simulateurs`** — `src/app/simulateur/page.tsx` (singulier) coexiste avec `src/app/simulateurs/page.tsx` (pluriel). Le sitemap pointe vers `/simulateur` (singulier, ligne 75) et listé sous `/simulateurs/*` (pluriel, ligne 14-25). Confusion SEO probable (deux URLs canoniques différentes pour un même contenu ?). Fix : décider laquelle garder et 301 redirect l'autre.

**🟢 Validation email basique** — regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` partout. Accepte `test@.com`. Pas bloquant mais Zod centralisé serait plus propre. Cosmétique.

### 3.2 Persona 2 : prospect chaud arrivant via OTB podcast

Flow : podcast → `/podcast` ou direct lead magnet (ex `/cahier-preview`) → form → email → séquence.

Findings :

**🟠 Lead magnets saisonniers (cahier, calendrier-avent, chasse-oeufs) actifs hors saison via direct URL** — la migration 035 gère le cron seasonal-toggle qui flip `is_active` sur les lead_magnets. Mais les pages elles-mêmes (`src/app/calendrier-avent/page.tsx` etc.) ne checkent pas `is_active`. Donc un user qui a un vieux lien d'avent en plein juillet voit la page comme si Noël était demain. Cohérence pédago cassée. Fix : ajouter check `is_active` côté page + redirect `/` si fermé.

**🟢 Le sitemap.ts est dynamique et inclut les saisonnières seulement si actives** (`src/app/sitemap.ts:64-75`). Bien fait.

### 3.3 Persona 3 : acheteur paye Stripe

Flow : `/academy` CTA → `/api/stripe/checkout` → Stripe hosted page → paiement → redirect `/connexion?checkout=success` → magic link → `/dashboard`.

Findings :

**🟠 `/api/stripe/checkout` n'accepte PAS l'email du client** — `src/app/api/stripe/checkout/route.ts` lit seulement `plan` du body et le passe à `createAcademyCheckoutSession()`. Stripe demande ensuite l'email côté page hostée. Conséquence : un user qui a déjà tapé son email dans un form en amont doit le re-taper sur Stripe. Mineur UX. Fix : passer `customer_email` à Stripe pour pré-remplir.

**🔴 `/api/stripe/checkout-family` bloqué par `FAMILY_LAUNCH_PENDING = true`** — `src/lib/utils/constants.ts:22` retourne true en dur, le GET et POST retournent `/family?error=launch-pending` (`src/app/api/stripe/checkout-family/route.ts:16,45`). Si Emeline ne flip pas ce flag à false avant le 14 mai, ZÉRO vente Family possible. Fix : changer en `process.env.FAMILY_LAUNCH_PENDING === "true"` et setter à false en prod.

**🟠 Pas de validation `email` dans `/api/stripe/checkout-family` POST** — l'email est optionnel et passé tel quel à Stripe. Si vide, on perd le lien CRM. Fix : valider regex email et required.

**🟢 Webhook Stripe** (`src/app/api/stripe/webhook/route.ts`) — idempotent via `processed_stripe_events` (migration 041), gère retry, signature vérifiée (ligne 28), magic link généré via `generateLink({type:"invite"})`, sync Family best-effort, dunning idempotent via `processed_dunning_invoices` (migration 033). Le webhook est ce qu'il y a de plus solide dans le projet.

### 3.4 Persona 4 : élève actif

Voir section 4 (zone élève).

### 3.5 Persona 5 : admin (Emeline)

Voir section 5 (zone admin).

### 3.6 Pages obligatoires lancement

| Élément | Statut | Référence |
|---|---|---|
| `/cgv` avec rétractation 14j + renonciation expresse | ✓ | `src/app/(public)/cgv/page.tsx`, articles 11.1 à 11.3 |
| `/mentions-legales` Holdem Groupe + ES Academy | ✓ vérifié dans CGV, mais à vérifier visuellement la page | `src/app/(public)/mentions-legales/page.tsx` |
| `/politique-confidentialite` RGPD | ✓ | `src/app/(public)/politique-confidentialite/page.tsx` |
| `/desabonnement` | ⚠ existe mais pas de token | voir 3.7 |
| `not-found.tsx` | ✓ branding ES | `src/app/not-found.tsx` |
| `error.tsx` global (5xx) | 🟠 **ABSENT à la racine** | présent seulement dans `(platform)/error.tsx` et `(admin)/admin/error.tsx`. Une erreur sur une page publique → écran Next.js par défaut sans CTA. Fix : créer `src/app/error.tsx`. |
| `global-error.tsx` (root layout crash) | 🟡 absent | rare, mais best-practice |

### 3.7 Désinscription RGPD

**🔴 `/api/contacts/unsubscribe` accepte n'importe quel email sans token** — `src/app/api/contacts/unsubscribe/route.ts` lit `{ email }` du body et désabonne. Un attaquant peut désabonner un concurrent ou n'importe quel client connu (énumération via emails publics, ex contact pro LinkedIn). Conséquence : revenge unsubscribe, perte délivrabilité (le contact pense être abonné mais ne reçoit plus rien, va flag spam). Fix : générer un HMAC token `hmac(email + DAY_SALT, UNSUBSCRIBE_SECRET)` côté serveur, inclure dans tous les liens email, vérifier en POST.

**🔴 Liens unsubscribe dans templates SES utilisent URL email sans token** — `src/app/api/cron/process-sequences/route.ts:101` génère `https://emeline-siron.fr/desabonnement?email=${encodeURIComponent(item.contact_email)}`. Aucun token. Même problème. Fix : inclure `&token=${hmacToken}` et vérifier côté `/desabonnement`.

### 3.8 Headers sécurité

**🟠 CSP et HSTS absents** — `next.config.ts:38-49` pose X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Manque :
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (force HTTPS)
- `Content-Security-Policy` (anti-XSS, anti-clickjacking renforcé)
Fix : ajouter dans `headers()` du next.config.ts (~10 min).

### 3.9 Robots et sitemap

`src/app/robots.ts` : disallow `/dashboard`, `/cours`, `/admin`, `/api`, `/connexion`, `/inscription`. ✓

`src/app/sitemap.ts` : ~30 URLs static + simulateurs + saisonnières conditionnelles + jusqu'à 100 articles blog. ✓ dynamique correct.

**🟡 Sitemap.ts importe `getActiveSeasonalSlugs` qui fait un appel DB à chaque génération** — sitemap re-généré à chaque build et chaque revalidation. Si Supabase down, fallback try/catch retourne `[]` (ligne 81), donc dégrade gracieusement. OK mais log ?

---

## 4. PARCOURS ÉLÈVE (zone 2, `(platform)`)

### 4.1 Flow magic link → dashboard

`src/app/api/auth/callback/route.ts` exchange le code et redirect vers `/dashboard`. OK.

`src/app/(platform)/layout.tsx` :
- Check user connecté (ligne 23)
- Check est admin OU enrolled Academy (`product_name ILIKE 'academy%'`, ligne 51), sinon redirect `/family` (ligne 60)
- Bandeau past_due Family si applicable (ligne 67-79)

Bonne pratique. Mais :

**🟠 Le gating utilise `ilike 'academy%'`** (`src/app/(platform)/layout.tsx:55`) — si un test ou import crée un enrollment avec `product_name = "Academy Pro"` ou autre majuscule, ça matchera. Pas grave. MAIS si un dev crée jamais un product `"academy_test"`, le gating laisse passer. Fix : préciser le match ou utiliser un check whitelist.

### 4.2 Dashboard

**🔴 PLACEHOLDER COMPLET** — `src/app/(platform)/dashboard/page.tsx:14` contient :
```
// TODO: Fetch enrollments and progress from Supabase
// For now, show a placeholder dashboard
```
La carte "La Méthode Emeline SIRON" est codée en dur ligne 33, avec ProgressBar value=0 ligne 41. Donc un acheteur qui a 50% de progression voit 0%. La carte "D'autres formations bientôt" est aussi en dur.

**Impact : critique pour le lancement.** Premier élève qui arrive sur le dashboard pense que sa formation n'est pas activée. Premier ticket support en 30 sec. Fix : 2h de dev, fetch `enrollments` + `progress` côté server component, afficher dynamiquement.

### 4.3 Lecture cours et leçon

`src/app/(platform)/cours/[courseSlug]/page.tsx` et `[lessonSlug]/page.tsx` : fetch Notion via `src/lib/notion/queries.ts`.

**🟠 Pas de page module intermédiaire** — `(platform)/cours/[courseSlug]/[moduleSlug]/[lessonSlug]/page.tsx` existe mais pas `[moduleSlug]/page.tsx`. Si l'utilisateur tape `/cours/methode-emeline-siron/module-1` → 404. Pas grave si la nav interne pousse uniquement vers leçons, mais à confirmer.

**🟠 Notion API sans retry / backoff** — `src/lib/notion/queries.ts:34` fait un `fetch()` simple, retourne `[]` en cas d'erreur. Notion API limite à 3 req/s. Si 100 élèves chargent simultanément une leçon (= 5+ queries Notion par page : course + module + lesson + blocks + resources + quiz), 429 immédiat → pages vides. Fix : wrapper avec exponential backoff (300ms, 600ms, 1200ms × 3 retries) + circuit breaker.

**🟠 Cache Notion à 3600s** (`queries.ts:30,273`) — 1h. Si Emeline corrige un texte dans Notion, élève voit ancienne version pendant 1h. UX correcte (pas critique) mais bonus de baisser à 300s en post-lancement.

**🟠 Bunny.net URL signée 6h partageable** — `src/lib/bunny/signed-url.ts:14`. Le token est `sha256(tokenKey + videoId + expires)` sans user binding. Un élève copie l'URL avec `?token=X&expires=Y` à 14h, l'envoie à un ami → ami regarde la vidéo 998€ jusqu'à 20h. Fix : réduire à 30 min (`expiresInHours: 0.5`) ou ajouter watermark dynamique Bunny.

### 4.4 Sauvegarde progression

**🔴 `/api/progress` n'écrit pas l'audit + ne valide pas que la leçon existe** — `src/app/api/progress/route.ts` accepte `{ lesson_id, course_id }` du body, fait un upsert. Aucun check Notion que la leçon existe, aucun check que l'user a accès au cours (le gating est dans le layout, pas dans l'API). Un user authentifié peut POST `{ lesson_id: "M14-LZ", course_id: "methode-emeline-siron" }` pour mark complete sans avoir vu la leçon. Combiné au 4.5 → diplôme bidon.

Fix : 30 min de dev, ajouter check `EXISTS (SELECT 1 FROM enrollments WHERE user_id = auth.uid() AND course_id = $1 AND status = 'active')` ou via RPC.

### 4.5 Examen final

**🔴 Réponses correctes incluses dans le bundle client** — `src/app/(platform)/evaluation/page.tsx:9` (selon l'audit agent, à confirmer manuellement). Le `evaluationQuestions` array contient `correct: 1`, lu côté React state pour calculer le score, puis envoyé à `/api/quiz` qui croit ce score. Triple problème :
1. Les réponses sont publiques dans le JS bundle (DevTools → 100% trivial).
2. Le score est calculé côté client, donc un user peut envoyer `{ score: 100 }` directement.
3. Pas de re-vérification serveur.

**Impact critique business :** un diplôme ES Academy = preuve de compétence pour les coachings → certification frauduleuse + risque légal + avis Trustpilot dévalorisé. Fix : refacto majeure, ~4h.
1. Retirer `correct` du payload côté client.
2. `/api/quiz/submit` (déjà existant) calcule le score côté serveur avec service role.
3. Stocker `correct` uniquement en DB (table `quiz_questions` migration 045_quiz_questions.sql).
4. Limiter à 5 essais avant cooldown 24h.

### 4.6 Ressources

**🟠 Ressources Notion accessibles via URL Notion directe** — `src/app/(platform)/cours/[courseSlug]/[moduleSlug]/[lessonSlug]/page.tsx:106-128` affiche `resource.fileUrl` qui pointe vers une URL Notion temporaire (~1h validité). Un élève qui partage le lien dans l'heure → accès sans auth. Risque modéré (1h fenêtre seulement). Fix : créer `/api/resources/[id]` qui valide auth + redirect signed URL.

### 4.7 Profil

**🟡 Pas d'export RGPD article 15 ni de suppression compte article 17** — `src/app/(platform)/profil/page.tsx` (à confirmer mais probable, agent confirmé). Un user qui demande ses données ou demande la suppression doit passer par email à Emeline → traitement manuel. Risque amende CNIL si plainte (article 12 + 17 RGPD). Fix : bouton "Télécharger mes données" qui appelle `/api/profile/export` (JSON de toutes les tables) + bouton "Supprimer mon compte" qui marque `deletion_requested_at`.

### 4.8 Coaching

`/(platform)/coaching/page.tsx` affiche `coaching_credits_remaining = total - used` (calcul potentiellement bidon).

**🟡 Pas d'audit trail des sessions de coaching** — pas de table `coaching_sessions_log`, le compteur est dénormalisé sur `profiles`. Si Calendly diverge de la DB (booking pas tracké), pas de source de vérité. Fix : créer table + webhook Calendly (voir section 6).

### 4.9 Reset password et magic link expirés

`src/app/api/auth/send-magic-link/route.ts` : OK, anti-énumération (toujours retourne ok=true). `src/app/(auth)/reset-password/page.tsx` : non lu en détail mais audit agent dit OK.

---

## 5. PARCOURS ADMIN (zone 3, `(admin)`)

### 5.1 Auth admin

`src/app/(admin)/layout.tsx` : check `ADMIN_EMAIL` OU `profiles.role = 'admin'`. OK. Mais :

**🔴 8 routes API admin-territory ne checkent que `getUser()` au lieu de `requireAdmin()`** — vérifié par grep direct (sortie ci-dessous) :
```
src/app/api/sequences/[id]/enroll/route.ts        🔴 N'IMPORTE QUEL USER PEUT ENROLLER MASSE
src/app/api/sequences/[id]/route.ts               🔴 PATCH/DELETE séquence
src/app/api/sequences/[id]/steps/[stepId]/route.ts 🔴 PATCH/DELETE step
src/app/api/sequences/[id]/steps/route.ts         🔴 POST step
src/app/api/sequences/route.ts                    🔴 GET liste / POST create
src/app/api/emails/campaigns/[id]/route.ts        🔴 PATCH/DELETE campagne
src/app/api/emails/campaigns/route.ts             🔴 POST création campagne
src/app/api/contacts/unsubscribe/route.ts         🔴 ✗ public mais sans token (voir 3.7)
```

Scénario d'attaque réel : Tiffany se connecte avec son compte editor (pas admin). Elle exploite ces routes pour créer une séquence email factice avec 500K steps et l'auto-enroll sur tous les contacts via tag "alumni". Trigger le cron qui essaie d'envoyer → SES quota explose → blocage AWS.

Fix urgent (2h total) : remplacer dans chacune des 7 routes (la 8e c'est unsubscribe, fix différent voir 3.7) :
```
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
```
par :
```
const auth = await requireAdmin();
if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
```

### 5.2 Audit log

Table `audit_log` créée migration 005. RPC `cleanup_old_audit_log` (rétention 90j) migration 006.

**🟠 Aucun cron n'appelle `cleanup_old_audit_log`** — vérifié dans migrations 023, 035, 045_seo_pg_cron_jobs : pas de schedule pour cleanup. La table grossit sans limite. À 35K contacts × N actions par jour, dans 6 mois c'est plusieurs GB. Fix (5 min SQL) :
```
SELECT cron.schedule('cleanup-audit-log', '0 3 * * 0', 'SELECT public.cleanup_old_audit_log();');
```

**🟠 Audit log incomplet** — confirmé par agent : seuls les changements de `pipeline_stage` sur contacts loggent (`src/app/api/contacts/[id]/route.ts:160`). Aucune trace pour création/modif/suppression de campagne, séquence, step, template, import. Si un mass-mail part par erreur, impossible de tracer qui l'a déclenché et quand. Fix : ajouter `writeAuditLog(...)` dans chaque CRUD admin (~2h).

### 5.3 Pipeline Kanban realtime

**🟠 Channel realtime sans unsubscribe explicite** — `src/app/(admin)/admin/pipeline/page.tsx:105` (selon agent) crée un channel sans appeler `channel.unsubscribe()` avant `removeChannel()`. Sur session longue (Emeline 8h dans le dashboard), risque de ghost channel et memory leak. Fix (1 ligne).

### 5.4 Campaigns email et SES

**🔴 Pas de gestion bounce / complaint SES** — `src/lib/ses/client.ts` envoie via SendEmailCommand mais **aucun handler SNS pour les notifications bounce/complaint**. AWS SES suspend automatiquement le compte si :
- bounce rate > 5% (hard bounces seulement)
- complaint rate > 0.1%

Sans pipeline, on envoie aux mêmes adresses invalides à chaque campagne → ratio s'envole → SES suspendu → ZÉRO email transactionnel ni marketing. Y compris les welcome Stripe.

Fix prioritaire (1 demi-journée) :
1. Activer SNS topic dans AWS pour Bounce + Complaint sur l'identité SES.
2. Créer endpoint `/api/webhooks/ses-bounce` qui valide la signature SNS et insère dans une table `ses_suppression_list` (email, type, received_at).
3. Avant chaque envoi (campagne ou séquence), check si destinataire est dans la suppression list → skip.
4. Bonus : `feedback@emeline-siron.fr` configuré comme return-path pour mode bounce.

**🟠 Pas de mode sandbox check** — `src/lib/ses/client.ts` ne distingue pas si SES est en sandbox (limité à emails vérifiés) ou en production. Si l'env prod tourne en sandbox par erreur, 0 envoi vers contacts non vérifiés. Fix : ajouter au healthcheck cron une vérif `GetAccountSendingEnabled` ou test send.

**🟠 Bulk send chunk 10 parallèle** (`src/lib/ses/client.ts:80-94`) — 10 mails simultanés, SES default = 14/sec. Ok marge. Mais en mode prod renforcé, AWS donne 50-200/sec. Le code est sous-utilisateur (lent). Pas bloquant. Fix : utiliser `SendBulkEmailCommand` (jusqu'à 50 destinataires par appel).

**🟠 Throttling SES non géré dans `process-sequences`** (`src/app/api/cron/process-sequences/route.ts`) — batch de 50 par cron toutes les 10 min = 300/heure. Acceptable. Mais si la batch fait 50 chunks de 10 en parallèle d'un coup, on dépasse les 14/sec pendant ~3s = quota throttle. Fix : ajouter `await new Promise(r => setTimeout(r, 1000))` entre chunks.

### 5.5 Sequences

**🟠 Pas de détection de boucle infinie** — si une séquence `tag_added: completed_welcome` enrolle un user, puis le step final ajoute le tag `completed_welcome`, l'auto-enroll ré-enrolle infiniment. Le code vérifie `onConflict: "sequence_id,contact_id", ignoreDuplicates: true` (`process-sequences/route.ts:196`) qui bloque le doublon. ✓ pratique correcte. Mais si Emeline configure manuellement une boucle entre 2 séquences A→tag_X→B→tag_Y→A, rien ne bloque.

**🟠 Si l'utilisateur se désabonne au milieu d'une séquence** — `process-sequences/route.ts` ne check pas `contact.status = 'unsubscribed'` avant d'envoyer. La fonction RPC `get_pending_sequence_sends` doit le faire (à vérifier dans migration 022). Risque : continue d'envoyer à un désabonné = complaint → SES.

**🟢 Idempotence enrollment** : ON CONFLICT `(sequence_id, contact_id)` empêche les doublons. OK.

### 5.6 Templates emails

**🟠 Variables `{{prenom}}`, `{{email}}` non échappées** — la fonction `renderMergeTags` dans `process-sequences/route.ts:41` fait un `replace` simple sans escape HTML. Si un user a le nom `<script>alert(1)</script>`, le mail contient le script. Comme c'est du mail (rendu Gmail/Outlook), XSS limité. Mais si un client survole un lien malformé, ça peut casser le rendu. Fix : `escapeHtml(vars[name])`.

**🟢 `renderEmailTemplate` côté `src/lib/email/render-template.ts`** (utilisé par dunning et autres) — selon agent, escape proprement. ✓

### 5.7 Import contacts

**🟡 Pas de vérification "email existe déjà" avant import** — `src/app/api/admin/import-contacts/route.ts:140-160` dedup dans le CSV mais pas en DB. L'RPC `import_contact_with_consent` (migration 034) est idempotent par construction, mais chaque import génère un consent_log même si contact existe → pollution. Fix : pre-fetch existing emails.

**🟢 RPC atomique** : `import_contact_with_consent` fait upsert + consent_log dans une transaction. ✓ solide.

### 5.8 Forms builder

**🟡 `redirect_url` non validée dans PATCH** — `src/app/api/admin/forms/[id]/route.ts:60` (selon agent). Open redirect possible si admin malveillant ou XSS dans l'admin. Faible vu que c'est admin-only mais hygiène. Fix : validate URL, whitelist domaines.

### 5.9 Recherche globale ⌘K

CommandPalette présente dans `src/components/admin/CommandPalette.tsx` (importée dans layout). À vérifier ce qu'elle couvre exactement, mais existe.

### 5.10 RGPD admin

**🟠 Pas de DELETE /api/contacts/[id]** — confirmé par agent. Pour supprimer un contact (article 17 RGPD), il faut passer par SQL. Manuel = pas scalable. Fix : ajouter DELETE avec cascade (notes, sends, enrollments, consent_log, audit_log entries pour ce contact).

**🟠 Pas d'export RGPD article 15 en 1 clic** — depuis `/admin/contacts/[id]`, pas de bouton "Exporter toutes les données". Fix : ajouter endpoint `/api/contacts/[id]/export` retournant JSON.

---

## 6. LIAISONS CRITIQUES

### 6.1 Stripe webhook (`api/stripe/webhook/route.ts`)

**État : SOLIDE.** Idempotence via `processed_stripe_events` + retry tolerant + dunning via `processed_dunning_invoices`. Vérifié ligne par ligne.

Que se passe-t-il si :
- **Stripe retry** : insertion `processed_stripe_events` retourne conflict 23505 → log "retry Stripe" → continue (upserts idempotents). ✓
- **Webhook arrive avant que le user soit créé** : `findOrCreateUserIdByEmail` crée via `auth.admin.generateLink({type:"invite"})`. ✓
- **Signature invalide** : `stripe.webhooks.constructEvent` throw → 400. ✓
- **Paiement réussi mais SES down** : enrollment + family_subscriptions sont créés, mail welcome fail. Le user peut quand même se connecter via "mot de passe oublié". `enrollments.family_gift_email_sent_at` reste null. Le cron `retry-academy-welcome-mail` doit relancer.

**🟠 Vérifier que le cron `retry-academy-welcome-mail` est actif** — `src/app/api/cron/retry-academy-welcome-mail/route.ts` existe. Migration 027 crée la colonne. Schedule dans migration 023 ? À confirmer manuellement.

**🟢 Sync Family best-effort** : si Family Supabase down, on log mais ne fail pas. ✓

### 6.2 AWS SES

**🔴 Pas de bounce/complaint pipeline** (voir 5.4)

**🟠 DKIM / SPF / DMARC** : non visible dans le code (logique, c'est DNS). À vérifier sur emeline-siron.fr :
- DKIM signing actif sur la domain identity SES ?
- SPF inclut amazonses.com ?
- DMARC policy = quarantine ou reject ?
Sans ces 3, taux de spam Gmail/Outlook va exploser. Fix manuel via console DNS + AWS SES.

**🟠 Pas de retry SES sur erreur transitoire** — `sendEmail` retourne success: false en cas d'exception. Pas de retry. Pour un cas comme `Throttling`, on perd l'envoi. Le cron `process-sequences` ne réessaie pas non plus (status="failed", reste failed). Fix : retry exponentiel pour ThrottlingException + AccessDenied.

### 6.3 Notion CMS

**🟠 Pas de circuit breaker** (voir 4.3)

**🟠 Rate limit Notion 3 req/s** non géré.

**🟠 Pages cours/leçon font ~5 calls Notion en parallèle** → si 100 utilisateurs simultanés, 500 req/s vs 3 req/s capacité = 99.4% des requêtes en 429. Fix : agréger en 1 endpoint server avec cache 5 min.

### 6.4 Bunny.net

**🟠 Token signé 6h sans user binding** (voir 4.3)

**🟢 Fallback unsigned URL si tokenKey absent** — `src/lib/bunny/signed-url.ts:16-19`. OK pour dev mais danger en prod si env var oubliée → vidéos publiques. Fix : throw en prod si manquant.

### 6.5 Sequences cron

`process-sequences` toutes les 10 min via pg_cron + pg_net (migration 023). Le secret CRON_SECRET est en Bearer header.

**🔴 CRON_SECRET en clair dans migration 023** — `supabase/migrations/023_pg_cron_setup.sql:24-27` contient `'Authorization', 'Bearer bk3JTO7WwsoTRAnUuVYTUZ5kwCV15IYEqF_BwbrOI2U'`. Donc :
1. Dans le git history pour l'éternité.
2. Dans la DB Supabase (qui que ce soit avec accès SQL la lit).

Si CRON_SECRET fuit, n'importe qui peut spam-trigger `/api/cron/process-sequences` → envoi de masse non désiré. Fix :
1. Rotate le secret (changer en env + en migration future ALTER + relancer cron.schedule avec le nouveau).
2. Supprimer la migration 023 du git (purge history avec `git filter-repo`) — risqué, à faire avec backup.
3. Alternative pragmatique : utiliser Supabase Vault pour stocker le secret côté Supabase et le lire dans le job pg_cron.

### 6.6 Realtime Supabase

Pipeline Kanban + dashboard utilisent realtime. Cleanup partiel (`removeChannel` sans `unsubscribe`). Memory leak possible sur session longue (voir 5.3).

### 6.7 Calendly

**🟠 Pas de webhook Calendly branché** — recherche `calendly`/`Calendly` ramène 3 fichiers : `coaching/page.tsx`, `appel-decouverte/page.tsx`, `EngagementTracker.tsx`. Aucun handler webhook. Donc :
- Un coaching réservé sur Calendly **n'est pas synchronisé** avec la DB.
- Le compteur `coaching_credits_used` n'est jamais décrémenté automatiquement (à confirmer mais probable).
- Pas de tag CRM posé après booking.

Fix urgent (3h) : créer `/api/webhooks/calendly/route.ts` qui :
- Valide signature Calendly.
- Sur `invitee.created` : décrémente `coaching_credits_used`, pose tag `coaching:booked` sur contact, déclenche séquence `seq_coaching_confirm`.
- Sur `invitee.canceled` : incrémente `coaching_credits_remaining`, tag `coaching:canceled`.

### 6.8 Notion CMS pour blog

**🟢 Articles blog SSG via `getPublishedArticles(100)`** — `src/lib/notion/blog.ts`. Cache géré côté Next.js. Si Notion down au build, pas d'articles. ISR à 3600s.

### 6.9 Brevo migration 35K

**🔴 SCRIPT INEXISTANT** — `ls scripts/` ne contient ni `migrate-brevo*` ni `import-alumni*`. La migration 034 (`import_contact_with_consent`) fournit l'RPC, mais aucun script appelant qui pull les 35K contacts de Brevo via leur API et les ingère.

Conséquence : si Emeline lance le 14 mai avec la promesse d'envoyer aux alumni Evermind, elle doit soit (a) exporter Brevo en CSV et utiliser l'import admin, (b) écrire un script ad-hoc, (c) reporter la campagne.

Fix (1 journée) : créer `scripts/migrate-brevo.mjs` :
1. Pull contacts par cohort via Brevo API (page de 1000).
2. Mapper champs Brevo → schema ES (email, first_name, last_name, tags, primary_source, rgpd_cohort).
3. Appeler RPC `import_contact_with_consent` par contact.
4. Test sur 100 d'abord. Logs détaillés. Rollback : table `consent_log` permet de retrouver les imports si besoin de revert.

### 6.10 Audit log cleanup

Voir 5.2 : RPC existe, pas de cron, table grossit.

### 6.11 pg_trgm contact search

Migration 005 ajoute `pg_trgm` extension probablement. À vérifier : index GIN sur `contacts.email`, `first_name`, `last_name` pour search performant sur 35K rows. Si pas d'index, `LIKE '%xxx%'` = sequential scan → admin search lent.

```
grep -r "pg_trgm\|gin\b" supabase/migrations/
```

À confirmer mais hypothèse : index présent puisque tu m'as mentionné pg_trgm dans la mémoire. Si absent → 30 min de fix.

### 6.12 RLS détaillée

**State actuel :**

| Table | RLS | Policies | Risque |
|---|---|---|---|
| profiles | ✓ | SELECT user_id=auth.uid() | OK |
| enrollments | ✓ | SELECT user_id=auth.uid() | OK |
| progress | ✓ | SELECT user_id=auth.uid() | OK |
| quiz_results | ✓ | SELECT user_id=auth.uid() | OK |
| email_templates | ✓ (044) | Admin-only ALL | OK |
| processed_dunning_invoices | ✓ (044) | Admin-only ALL | OK |
| billing_reminders | ✓ (044) | Admin-only ALL | OK |
| consent_log | ✓ (044) | Admin-only ALL | OK |
| quiz_responses | ✓ (044) | Admin-only ALL | OK |
| contact_events | ✓ (044) | Admin-only ALL | OK |
| family_subscriptions | ✓ (038) | **0 policy** | OK car service role only, mais fragile (ajouter SELECT user_id=auth.uid()) |
| contacts | À confirmer | À confirmer | À vérifier : RLS + admin-only ? |
| coaching_credits | À confirmer | À confirmer | Si exposé client = leak credits autres users |
| email_sends, email_campaigns, email_sequences, email_sequence_steps, email_sequence_enrollments | À confirmer | À confirmer | Si exposé client + 5.1 → spam relay |

Action : exécuter ce SQL pour audit RLS complet :
```
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
```

---

## 7. COULENT DE SOURCE MAIS PAS FAITS

Checklist exhaustive. Statut : ✅ présent / ❌ absent / ⚠ partiel / ❓ à vérifier manuellement.

### SEO et indexation

| Item | Statut | Note |
|---|---|---|
| Page 404 custom branding | ✅ | `src/app/not-found.tsx` |
| Page 500 custom global | ❌ | manque `src/app/error.tsx` racine |
| `global-error.tsx` (root layout crash) | ❌ | manque |
| Sitemap.xml dynamique | ✅ | `src/app/sitemap.ts` |
| Robots.txt avec noindex /admin | ✅ | `src/app/robots.ts` |
| Schema JSON-LD Organization + Website | ✅ | root layout |
| Schema JSON-LD Article par blog post | ❌ | absent |
| Schema JSON-LD Product (formation 998€) | ❌ | absent |
| OG image default | ❌ | `og-default.jpg` absent |
| OG image Family | ❌ | `og-family.jpg` absent |
| Twitter card meta | ✅ | layout |
| Favicon | ✅ | `src/app/favicon.ico` |
| Apple touch icon | ✅ | `public/apple-touch-icon.png` |
| Manifest PWA | ❌ | absent |
| Canonical URLs | ✅ | metadataBase configuré |

### Sécurité

| Item | Statut | Note |
|---|---|---|
| HTTPS via Vercel/Netlify | ✅ | par défaut |
| HSTS header | ❌ | absent du next.config |
| CSP header | ❌ | absent |
| X-Frame-Options | ✅ | SAMEORIGIN |
| X-Content-Type-Options | ✅ | nosniff |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Permissions-Policy | ✅ | camera/mic/geo bloqués |
| Rate limiting (in-memory) | ⚠ | présent sur /contacts et /forms, absent ailleurs |
| Rate limiting distribué (Upstash) | ❌ | absent |
| Captcha sur forms publics | ❌ | absent |
| Honeypot sur forms publics | ❌ | absent |
| Validation Zod côté serveur | ❌ | validation regex ad-hoc, pas centralisée |
| CSRF tokens sur actions admin | ❌ | Next.js cookies SameSite=Lax par défaut, mais pas de token CSRF explicite |
| `requireAdmin()` sur toutes les API admin | ❌ | 7 routes manquantes |
| Session admin expire | ❌ | Supabase JWT longue durée par défaut |
| Service role key jamais côté client | ✅ | utilisée dans createServiceClient (server only) |
| Anti-énumération email (magic link) | ✅ | retourne ok=true toujours |
| Site password protection avant launch | ✅ | middleware.ts |
| Liens unsubscribe avec token signé | ❌ | URL email-only, voir 3.7 |

### RGPD

| Item | Statut | Note |
|---|---|---|
| CGV avec rétractation 14j + renonciation expresse | ✅ | CGV article 11 |
| Mentions légales Holdem Groupe + ES Academy | ✅ | mentionnées dans CGV |
| Politique de confidentialité | ✅ | page existe |
| Cookies banner | ⚠ | binaire, pas catégorisé |
| Consent log (table + RPC) | ✅ | migration 034 |
| Article 15 export données | ❌ | non implémenté UI |
| Article 17 suppression compte | ❌ | non implémenté UI ni API |
| Article 21 opt-out marketing | ⚠ | unsubscribe existe mais sans token |
| DPA avec sous-traitants (Supabase, AWS, Stripe, Brevo, Bunny, Notion) | ❓ | manuel, hors code |
| Politique de rétention claire | ⚠ | audit_log 90j mentionné, pas appliqué (cron absent) |
| DKIM / SPF / DMARC | ❓ | hors code, vérifier DNS emeline-siron.fr |
| Liens unsubscribe dans tous les mails marketing | ✅ | présent dans templates SES |

### Monitoring et observabilité

| Item | Statut | Note |
|---|---|---|
| Sentry erreurs front+back | ❌ | absent du package.json |
| LogRocket ou équivalent UX | ❌ | absent |
| Uptime monitoring | ❌ | aucun outil détecté |
| Status page | ❌ | absent |
| Alerting downtime | ❌ | absent |
| Backups Supabase PITR | ❓ | dépend du plan Supabase, à vérifier Pro |
| Logs centralisés (Better Stack, Datadog) | ❌ | absent |
| Métriques business (CA, MRR) | ⚠ | dashboard admin probable, à vérifier |

### Performance

| Item | Statut | Note |
|---|---|---|
| next/image partout | ❓ | à auditer page par page |
| Fonts display:swap | ✅ | Playfair + Inter avec display:"swap" |
| Compression | ✅ | next.config compress:true |
| Cache control statique | ✅ | next.config headers |
| ISR sur blog | ✅ | revalidate 3600 |
| Lazy loading composants lourds | ❓ | à auditer |
| Lighthouse score | ❓ | à mesurer |
| Core Web Vitals | ❓ | à mesurer |

### Accessibilité

| Item | Statut | Note |
|---|---|---|
| Alt sur images | ❓ | à auditer |
| Labels sur form fields | ⚠ | placeholder utilisé comme label dans `/form/[slug]` (voir agent) |
| Navigation clavier | ❓ | à auditer |
| Contrastes WCAG AA | ❓ | à auditer |
| Aria-labels boutons icônes | ❓ | à auditer |
| Lang attribute html | ❓ | à vérifier root layout |

### Compatibilité

| Item | Statut | Note |
|---|---|---|
| Responsive mobile (375px, 414px) | ❓ | non testé |
| Safari iOS | ❓ | non testé |
| Email dark mode rendering | ❓ | non testé |
| Email images bloquées fallback | ⚠ | à vérifier |

### Stripe spécifique

| Item | Statut | Note |
|---|---|---|
| Mode live vs test distingué | ✅ | env vars `_LIVE` / `_TEST` (à confirmer LAUNCH_RUNBOOK) |
| Webhook signature vérifiée | ✅ | constructEvent |
| Webhook idempotency | ✅ | processed_stripe_events |
| Customer Portal Stripe pour gestion abo | ✅ | `/api/stripe/portal` |
| Promo code EVERMIND configuré | ✅ | env var |
| TVA automatique | ❓ | à vérifier dans createAcademyCheckoutSession |
| Country whitelist | ❓ | à vérifier dans createCheckoutSession options |
| Refund flow | ⚠ | manuel via Stripe Dashboard, pas dans l'UI admin |
| Test Clock 3x/4x | ❓ | à effectuer avant LIVE (rappel mémoire) |

### Test de charge / scalabilité

| Item | Statut | Note |
|---|---|---|
| Charge 200 achats en 10 min jour J | ❓ | non testé |
| Notion rate limit 3 req/s sous charge | ❌ | va casser au-delà de 100 visiteurs simultanés (voir 4.3) |
| Supabase free tier limits | ❓ | dépend du plan |
| SES sandbox vs prod quota | ❓ | à vérifier AWS |
| Mode dégradé si Supabase down | ❌ | absent (pages crashent) |

---

## 8. FRICTIONS ADMIN

Vue UX du quotidien d'Emeline.

### Combien de clics pour...

**Ajouter manuellement un contact** : `/admin/contacts` → bouton "Ajouter" → modal → email + nom + tags → Enregistrer. **3 clics + saisie**. Acceptable.

**Lancer une campagne email** : `/admin/emails` → "Nouvelle campagne" → éditeur sujet/contenu → sélection liste cible → preview → envoyer. **5 clics**. Acceptable mais l'absence de preview-réel-dans-Gmail (envoi test à soi-même) ralentit la confiance.

**Lancer un test send** : route `/api/emails/send-test` existe. Bien.

**Créer une séquence de 5 mails** : `/admin/sequences` → "Nouvelle" → settings (trigger, tag) → "Ajouter step" × 5 → pour chaque step : subject, html, delay → save. **~25-30 clics + saisies**. Lourd mais standard.

**Modifier le template du mail de bienvenue Academy** : `/admin/emails/templates` → trouver `academy_welcome` dans liste → éditer → save. **3 clics + saisie**.

### Bulk actions

**Bulk add tags sur contacts** : route `/api/admin/contacts/bulk-add-tags` existe. ✓ Selon agent : implémenté.

**Bulk delete contacts** : pas vu. ❌

**Bulk export liste** : pas vu. ❌

**Bulk désabonner** : pas vu. ❌

### Import / export

**Import CSV** : `/admin/import-contacts` existe, RPC atomique `import_contact_with_consent`. ✓ Mais (voir 5.7) : pas de check doublons DB avant insert (consent_log pollué), pas de mode "dry-run", pas de rollback explicite.

**Export RGPD article 15** : un contact donné → JSON de toutes ses données. ❌ pas de UI, doit passer par SQL admin.

**Export liste pour rééspédier ailleurs** : pas vu. ❌

### Recherche

**⌘K search globale** : `CommandPalette.tsx` existe. Couvre quoi ? À auditer en détail. ❓

**Recherche contact par email/nom** : `pg_trgm` mentionné dans mémoire. Si index GIN OK = instantané sur 35K. Si pas d'index = lent.

### Frictions identifiées

🟠 **Pas de mode dry-run pour campagne** : Emeline doit accepter sans simulation complète qui voit l'envoi. Risque d'erreur sujet/cible. Fix : ajouter bouton "Aperçu liste destinataires" avant envoi.

🟠 **Pas de undo sur send** : une fois envoyé, on ne peut pas rappeler. C'est normal. Mais on devrait avoir un bouton "Annuler programmation" pour les `scheduled_at` futurs. À vérifier si présent.

🟠 **Pas de A/B test sur subject** : niceto have.

🟠 **Audit log non-cliquable** : `/admin/activity` (selon nav) — affiche les changements mais probablement pas filtrable par user, par entity_type, par période. À auditer.

🟡 **Pas de notification Emeline sur erreur cron** : si `process-sequences` fail (SES quota dépassé par ex), aucun alert. Elle découvre via lecture des logs Vercel. Fix : ajouter envoi mail à `ADMIN_EMAIL` si batch fail > 50%.

🟡 **Pas de "force send now" sur une séquence** : si Emeline veut tester immédiatement, elle doit attendre 10 min du cron suivant. Fix : bouton "Run now" dans l'admin qui POST au cron endpoint.

🟡 **Pas de visualisation de séquence en arbre** : 64 mails à travers N séquences, pas de vue globale du parcours. Confort.

---

## 9. PLAN D'ACTION PRIORISÉ

### Colonne A : BLOQUANT LANCEMENT (à faire avant J)

Estimation totale : **~24h de dev focused**.

| # | Item | Effort | Fichier |
|---|---|---|---|
| A1 | Flip `FAMILY_LAUNCH_PENDING` à false | 5 min | `src/lib/utils/constants.ts:22` |
| A2 | Dashboard élève : fetch enrollments + progress | 2h | `src/app/(platform)/dashboard/page.tsx` |
| A3 | `requireAdmin()` sur 7 routes (sequences + emails campaigns) | 2h | voir 5.1 |
| A4 | SES bounce/complaint pipeline (SNS → table suppression) | 4h | nouvelle route + AWS SNS config |
| A5 | Examen final : retirer `correct` du client + scoring serveur | 4h | `src/app/(platform)/evaluation/page.tsx` + `/api/quiz/submit` |
| A6 | Unsubscribe token HMAC + check côté `/desabonnement` | 2h | `api/contacts/unsubscribe`, templates |
| A7 | Brevo migration script + dry-run sur 100 | 4h | nouveau `scripts/migrate-brevo.mjs` |
| A8 | OG images `og-default.jpg` + `og-family.jpg` | 1h | Figma export ou `/api/og` |
| A9 | `src/app/error.tsx` global 5xx | 30 min | nouveau fichier |
| A10 | CGU / formation 998€ : checkbox renonciation rétractation sur checkout | 1h | Stripe metadata + UI checkout |
| A11 | Rotate CRON_SECRET hors git history | 1h | nouvelle migration + .env + investigate purge git |
| A12 | Sentry installation (free tier) front+back | 2h | `npm i @sentry/nextjs` + config |
| A13 | Test Clock 3x/4x sur Stripe avant LIVE | 1h | Stripe Dashboard |
| A14 | DKIM/SPF/DMARC vérification DNS emeline-siron.fr | 30 min | Console DNS |

### Colonne B : IMPORTANT (J+7 à J+30)

| # | Item | Effort |
|---|---|---|
| B1 | Calendly webhook : sync booking → tag + decrement credits | 3h |
| B2 | Notion retry exponential backoff + circuit breaker | 2h |
| B3 | Cron cleanup_old_audit_log | 15 min SQL |
| B4 | Bunny URL signée : réduire à 30 min + watermark | 1h |
| B5 | `/api/progress` validation enrollment + lesson_id | 1h |
| B6 | Audit log : ajouter writeAuditLog sur toutes les actions admin sensibles | 3h |
| B7 | Pipeline Kanban : `channel.unsubscribe()` avant removeChannel | 5 min |
| B8 | CSP + HSTS headers | 30 min |
| B9 | RGPD article 15 (export) et article 17 (delete) UI + API | 4h |
| B10 | Captcha Cloudflare Turnstile sur forms publics | 2h |
| B11 | Validation Zod centralisée sur toutes API publiques | 4h |
| B12 | Schema JSON-LD Article sur blog posts | 1h |
| B13 | Cookies banner granular (analytics / marketing / fonctionnel) | 1h |
| B14 | SES retry exponentiel sur Throttling | 1h |
| B15 | Notification mail Emeline si cron batch fail >50% | 1h |
| B16 | `/api/stripe/checkout` accepte customer_email pour pré-remplir Stripe | 30 min |
| B17 | Page module intermédiaire `/cours/[course]/[module]/page.tsx` | 1h |
| B18 | Healthcheck endpoint `/api/health` (Supabase + SES + Notion + Stripe ping) | 2h |
| B19 | Lighthouse audit + Core Web Vitals fix | 4h |
| B20 | Tests de charge basiques (k6 ou autocannon) sur les paths critiques | 4h |

### Colonne C : NICE TO HAVE (J+30 à J+90)

| # | Item | Effort |
|---|---|---|
| C1 | A/B test subject sur campagnes | 4h |
| C2 | Status page externe (BetterUptime gratuit) | 1h |
| C3 | LogRocket ou Hotjar | 1h setup |
| C4 | Rate limiting distribué via Upstash Redis | 2h |
| C5 | Manifest PWA + offline mode élève | 4h |
| C6 | Force send séquence depuis admin (bouton "Run now") | 1h |
| C7 | Visualisation séquences en arbre | 8h |
| C8 | Bulk actions étendues (delete, désabo, export) | 4h |
| C9 | Dark mode admin | 8h |
| C10 | Tests automatisés Playwright sur parcours critiques | 16h |
| C11 | Audit accessibilité WCAG AA complet | 8h |
| C12 | Service worker pour cache offline ressources | 4h |
| C13 | Refonte cookies banner TCF 2.2 | 4h |
| C14 | Refacto Supabase RLS audit complet (toutes les tables) | 4h |
| C15 | Page admin de "réconciliation Stripe" (sub orphelines, etc.) | 4h |

---

## ANNEXE : citations directes vérifiées

Pour traçabilité :

- `src/lib/utils/constants.ts:22` : `export const FAMILY_LAUNCH_PENDING = true;` — confirmé.
- `src/app/(platform)/dashboard/page.tsx:14` : `// TODO: Fetch enrollments and progress from Supabase` — confirmé.
- `src/app/api/sequences/[id]/enroll/route.ts:9-12` : `const { data: { user } } = await supabase.auth.getUser(); if (!user) return ...` — pas de `requireAdmin()`.
- `src/lib/bunny/signed-url.ts:14` : `expiresInHours = 6` — confirmé.
- `src/lib/notion/queries.ts:30` : `next: { revalidate: 3600 }` — confirmé.
- `src/app/api/cron/process-sequences/route.ts:101` : `unsubscribe_url: https://emeline-siron.fr/desabonnement?email=...` — pas de token, confirmé.
- `src/app/api/stripe/webhook/route.ts:52-65` : idempotence via `processed_stripe_events` — confirmé robuste.
- `supabase/migrations/023_pg_cron_setup.sql:24-27` : Bearer secret en clair dans la migration — confirmé.
- `src/lib/ses/client.ts:1-100` : aucune mention de `bounce`, `complaint`, `SNS` — confirmé absent.
- `public/images/og*` : aucun fichier — confirmé absent.
- `package.json` : aucune dépendance Sentry — confirmé absent.
- `scripts/` : aucun fichier `brevo` — confirmé absent.
- `src/app/error.tsx` : fichier absent à la racine, présent uniquement dans `(platform)` et `(admin)` — confirmé.

---

Audit complété le 12 mai 2026. Recommandation : geler le scope code à J-2, focus sur les 14 items de la colonne A. Le reste peut attendre la semaine suivant le lancement.
