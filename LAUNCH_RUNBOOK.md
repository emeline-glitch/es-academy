# Runbook de lancement ES Academy + ES Family

**Lancement prévu :** mi-mai 2026 (J = 14 mai par défaut, à confirmer).
**Owners :** Emeline (config + contenu + business), Claude (code + audits techniques).
**Status au 8 mai 2026 :** code prêt côté Claude. Reste config prod + contenu pédagogique côté Emeline.

---

## J-7 à J-4 (8 au 11 mai) : préparation technique

### 1. Env vars production (25 min)

**Vercel (Academy, `emeline-siron.fr`) :**

Variables à pousser dans `Vercel > Project Settings > Environment Variables` (team `ES ACADEMY`, projet `es-academy`) :

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...                 (créé via Stripe Dashboard webhook endpoint)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ACADEMY_1X=price_...
STRIPE_PRICE_ACADEMY_3X=price_...
STRIPE_PRICE_ACADEMY_4X=price_...
STRIPE_COUPON_ACADEMY_GIFT=ACADEMY_3_MOIS_FAMILY
STRIPE_PRODUCT_ACADEMY=prod_...
STRIPE_PRODUCT_FAMILY=prod_...
STRIPE_PRICE_FAMILY_FONDATEUR=price_...
STRIPE_PRICE_FAMILY_STANDARD=price_...
STRIPE_FAMILY_FONDATEUR_CAP=500
STRIPE_COUPON_ALUMNI_GIFT=EVERMIND
STRIPE_PROMO_CODE_EVERMIND=EVERMIND
NEXT_PUBLIC_SITE_URL=https://emeline-siron.fr
SES_FROM_EMAIL=emeline@emeline-siron.fr        (verifier domaine AWS SES verified)
SES_REGION=eu-west-3
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NOTION_API_KEY=secret_...
NOTION_COURSES_DB=...
NOTION_MODULES_DB=...
NOTION_LESSONS_DB=...
NOTION_RESOURCES_DB=...
BUNNY_STREAM_API_KEY=...
BUNNY_STREAM_LIBRARY_ID=...
BUNNY_STREAM_PULL_ZONE=...
BUNNY_TOKEN_AUTH_KEY=...
CRON_SECRET=...                                (le meme que dans la migration 023 pg_cron)
ADMIN_EMAIL=contact@emelinesiron.com
SITE_PASSWORD=                                 (vide en prod publique)
NEXT_PUBLIC_GTM_ID=GTM-...                     (optionnel)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...             (optionnel)
GA4_API_SECRET=...                              (optionnel pour server-side events)
GOOGLE_SITE_VERIFICATION=...                    (optionnel)
```

**Vercel (Family, `es-family.vercel.app`) :**

Variables à pousser dans `Vercel > Project > Settings > Environment Variables` (production) :

```
NEXT_PUBLIC_SUPABASE_URL=...                    (Family Supabase, different d'Academy)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ACADEMY_SUPABASE_URL=...                        (Academy DB, lecture seule pour le bridge alumni/gift)
ACADEMY_SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...                 (different de celui d'Academy : 2 endpoints separes)
STRIPE_PRICE_FONDATEUR=price_...
STRIPE_PRICE_STANDARD=price_...
STRIPE_PROMO_CODE_EVERMIND=EVERMIND
ACADEMY_FAMILY_BRIDGE_SECRET=...                 (HMAC entre Academy et Family pour le push gift code)
NEXT_PUBLIC_SITE_URL=https://emeline-siron.fr   (le paywall est sur Academy domain)
NEXT_PUBLIC_ONESIGNAL_APP_ID=...                 (push iOS)
ONESIGNAL_REST_API_KEY=...
SES_FROM_EMAIL=emeline@emeline-siron.fr
SES_REGION=eu-west-3
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=...
TOKEN_SIGNING_SECRET=...                         (HMAC pour les liens Chatel cancel)
CRON_SECRET=...
```

**Critère de succès :** `BASE_URL=https://emeline-siron.fr bash scripts/smoke-test.sh` retourne 21/21 OK.

---

### 2. Activer les 15 séquences mail (15 min) — Emeline

Aller sur `https://emeline-siron.fr/admin/sequences` (ou en local sur localhost:3001).

Pour chaque séquence, review les steps puis basculer en `active` :

- [ ] Welcome Cahier de vacances (SEQ_CV) - 10 steps
- [ ] Welcome Chasse aux oeufs (SEQ_CO) - 6 steps
- [ ] Welcome Masterclass (SEQ_MC) - 7 steps
- [ ] Welcome Quiz - Profil 0-4 (SEQ_QZ_LOW) - 5 steps
- [ ] Welcome Quiz - Profil 5-8 (SEQ_QZ_MID) - 5 steps
- [ ] Welcome Quiz - Profil 9-10 (SEQ_QZ_HIGH) - 5 steps
- [ ] Welcome Simulateur (SEQ_SIM) - 5 steps
- [ ] Pré-sale Academy (SEQ_PRESALE) - 4 steps
- [ ] Post-achat Academy (SEQ_PA_ACADEMY) - 6 steps **← URL Calendly Antony à substituer step 6 avant activation**
- [ ] Post-masterclass visionnée (SEQ_POSTMC) - 5 steps
- [ ] Multi lead-magnet (SEQ_CROSS) - 3 steps
- [ ] Réactivation inactifs 90j (SEQ_REACT) - 4 steps
- [ ] Nurture maître (SEQ_NM) - 12 steps
- [ ] Alumni Evermind (SEQ_AL) - 5 steps
- [ ] Migration Brevo cohorte 2 (SEQ_BRV) - 2 steps **← n'activer qu'au moment de l'import Brevo**

**Critère de succès :** `node --env-file=.env.local scripts/check-sequences-status.mjs` (à recréer si besoin) retourne 14 séquences `active` et 1 en `draft` (Brevo cohorte 2).

---

### 3. URLs Calendly Antony (5 min) — Emeline

Demander à Antony ses 2 URLs Calendly :
- URL appel découverte coaching seul
- URL appel découverte coaching Academy

Substituer dans :
- `/admin/sequences > Post-achat Academy > step 6` (le placeholder est `X`)
- `/admin/coaching` page Academy (à vérifier dans le code aussi : `~/es-academy/src/app/(platform)/coaching/page.tsx`)

**Critère de succès :** Clic sur le bouton "Réserver mon appel" depuis le dashboard utilisateur ouvre Calendly Antony.

---

### 4. Setup APNs OneSignal (15 min) — Emeline

Procédure App Store :
1. Connect Apple Developer account → Certificates, IDs & Profiles → Keys → "+"
2. Cocher Apple Push Notifications service (APNs), donner un nom (`ES Family APNs`).
3. Télécharger le fichier `.p8` (UNE seule fois, garder en sécurité).
4. Noter le `Key ID` et le `Team ID` (visible en haut à droite Apple Developer).
5. OneSignal Dashboard → ES Family app → Settings → Apple iOS (APNs) → Upload `.p8` + saisir Key ID + Team ID.

**Critère de succès :** envoi d'une push test depuis OneSignal Dashboard arrive sur le téléphone Emeline (en mode dev).

---

### 5. Créer 2 OG images (15 min) — Emeline

**`og-default.jpg`** Academy (1200x630, palette chaude, Playfair) :
- Drop dans `~/es-academy/public/images/`
- Texte suggéré : "Construisons ta réussite financière et humaine"

**`og-family.jpg`** Family (1200x630, palette Mint Mercury #00B894, Inter) :
- Drop dans `~/es-family/public/images/`
- Texte suggéré : "1 800+ investisseurs construisent leur patrimoine ensemble"

Commit + push après drop.

**Critère de succès :** preview sur `https://www.opengraph.xyz/url/https%3A%2F%2Femeline-siron.fr` affiche bien l'image.

---

### 6. Stripe Test Clock 3x/4x (30 min) — Emeline

Procédure complète dans memory `project_stripe_phase1_todos.md`. En résumé :

```bash
stripe test_helpers test_clocks create --frozen-time=$(date +%s)
# Crée une sub liée au clock, plan academy_3x
# Avance d'1 mois : stripe test_helpers test_clocks advance ...
# Vérifie nb invoices émises
```

**Tests à valider :**
1. Achat 31 mai en 4x → 4 factures (31 mai, 30 juin, 31 juillet, 31 août). Pas de 5e.
2. Achat 29 février bissextile en 3x → 3 factures.

Si off-by-one, ajuster `interval_count` dans `~/es-academy/src/app/api/stripe/webhook/route.ts:842` (`capSubscriptionAtInstallments`).

**Critère de succès :** test clock confirme N factures pour N installments. Pas critique pour 1x mais bloquant pour LIVE 3x/4x.

---

### 7. Vérification SES domaine (5 min) — Emeline

Console AWS SES → Verified Identities :
- `emeline-siron.fr` doit être Verified.
- Si seul `es-academy.fr` est vérifié, changer `SES_FROM_EMAIL` à `emeline@es-academy.fr` dans Vercel env vars (ou faire vérifier `emeline-siron.fr`).

**Critère de succès :** `aws ses get-identity-verification-attributes --identities emeline-siron.fr` retourne `VerificationStatus: Success`.

---

## J-3 à J-2 (12-13 mai) : contenu pédagogique

### 8. Compléter les 32 leçons Notion (étalable, gros boulot) — Emeline + Tiffany

État actuel : 34/66 leçons importées dans Notion. 32 manquantes.

Pour chaque leçon manquante :
- Créer la page dans la DB Notion `Lessons`
- Lier au `Module` parent
- Remplir `Slug`, `Order`, `Free_Preview` (si applicable), `Video_Duration`
- Cocher `Published`

**Référence du mapping :** `~/es-academy/scripts/data/lessons-mapping.csv` (66 leçons listées avec leur module, ordre, ancien Evermind ID).

### 9. Linker les 34 vidéos Bunny (étalable) — Emeline

Pour chaque leçon dans Notion :
- Récupérer le `Video_ID` depuis Bunny Stream Dashboard.
- Coller dans le champ `Video_ID` de la leçon Notion.

**Critère de succès :** `node --env-file=.env.local scripts/notion_check.mjs` retourne `66/66` leçons et `66/66` lessons with videoId.

---

## J-1 (13 mai) : tests end-to-end

### 10. Test parcours Stripe sandbox (30 min) — Emeline

1. Aller sur `https://emeline-siron.fr/academy` (en mode incognito si besoin).
2. Cliquer "Acheter en 1x" avec une carte test Stripe `4242 4242 4242 4242`.
3. Vérifier sur `/merci` :
   - Code Family affiché (FAMILY...)
   - Bouton "Activer mes 3 mois" visible
4. Vérifier l'email reçu :
   - Magic link fonctionne (clic = login auto sur /dashboard)
   - Code Family présent dans le mail
5. Aller sur `/family?code=FAMILY...` :
   - Code reconnu, pré-rempli
6. Compléter le checkout Family avec carte test :
   - Vérifier qu'on devient `founder_500` (badge dans le profil)
7. Vérifier la subscription dans Stripe Dashboard mode test.

**Si quelque chose casse :** check les logs Vercel (Academy + Family) Functions, et le webhook Stripe Dashboard.

### 11. Smoke tests prod (5 min) — Emeline

```bash
cd ~/es-academy && BASE_URL=https://emeline-siron.fr bash scripts/smoke-test.sh
cd ~/es-family && BASE_URL=https://es-family.vercel.app bash scripts/smoke-test.sh
```

**Critère de succès :** `Tous les tests OK` partout.

### 12. Vérification finale liste séquences (5 min) — Emeline

Aller sur `/admin/sequences` et confirmer :
- 14 séquences `active`
- 1 séquence `draft` (Brevo cohorte 2)

---

## J = jour du lancement

### 13. Soft launch (matin) — Emeline

- Vérifier que tous les déploiements sont OK (Vercel green pour Academy + Family).
- Lancer le smoke test une dernière fois.
- Annoncer en interne (Tiffany, Antony, Fita).

### 14. Communication (matin/midi) — Emeline

- Post Instagram (story + feed) avec le lien Academy
- Mail aux abonnés Brevo (cohorte alumni Evermind d'abord, intérêt légitime)
- Post LinkedIn
- Le runbook ne couvre pas le contenu marketing : référer aux drafts Tiffany.

### 15. Surveillance (toute la journée) — Emeline

Onglets ouverts en permanence :
- Stripe Dashboard (paiements en temps réel)
- AWS SES (bounces, complaints)
- `/admin/dashboard` Academy (nouveaux contacts, enrollments)
- Console Sentry / logs Vercel (erreurs runtime)

**Seuils d'alerte :**
- 3+ bounces SES → vérifier `SES_FROM_EMAIL` et la réputation domaine
- 1+ erreur 5xx sur webhook Stripe → check `processed_stripe_events` + logs
- Volume anormal d'inscriptions sans paiement → possible bot ou spam, activer reCAPTCHA si besoin

---

## J+1 à J+7 : surveillance + itération

### 16. Daily check (10 min/jour) — Emeline

- Lire la table `audit_log` (giveup welcome mail, dunning, etc.)
- Vérifier les séquences `email_sequence_enrollments` actives
- Répondre au support `contact@emelinesiron.com`

### 17. Itération copy (selon retours) — Emeline + Tiffany

- Si conversion Academy <2% : revoir headline / CTA / preuve sociale
- Si bounce rate landing >70% : revoir hero / vitesse / mobile
- Suivre les UTMs Google Ads / Insta dans `/admin/seo`

### 18. Migration Brevo cohorte 2 + 3 (si confiance) — Emeline + Claude

Si tout va bien à J+5, déclencher la migration Brevo :
- Activer la séquence `Migration Brevo cohorte 2 (SEQ_BRV)` dans `/admin/sequences`
- Importer la cohorte 2 (35K contacts) via `~/es-academy/scripts/import-brevo-contacts.mjs`
- Surveiller bounces/complaints sur 24h
- Si OK, cohorte 3.

---

## Annexes

### Commandes utiles

```bash
# Smoke tests
cd ~/es-academy && BASE_URL=https://emeline-siron.fr bash scripts/smoke-test.sh
cd ~/es-family && BASE_URL=https://es-family.vercel.app bash scripts/smoke-test.sh

# Diagnostic Notion
cd ~/es-academy && node --env-file=.env.local scripts/notion_check.mjs

# Appliquer une migration Supabase (necessite SUPABASE_ACCESS_TOKEN dans .env.local)
cd ~/es-academy && bash scripts/apply-migration.sh supabase/migrations/XXX.sql
cd ~/es-family && bash scripts/apply-migration.sh supabase/migrations/XXX.sql

# Voir les logs cron pg_cron Supabase (depuis Supabase Dashboard > Database > Cron Jobs)
# https://supabase.com/dashboard/project/tvkzndkywznaysiqvmsh/database/cron
```

### Liens prod

- Academy site : https://emeline-siron.fr
- Family Vercel : https://es-family.vercel.app
- Stripe Dashboard : https://dashboard.stripe.com
- Supabase Academy : https://supabase.com/dashboard/project/tvkzndkywznaysiqvmsh
- Supabase Family : https://supabase.com/dashboard/project/hpcoxtpdsydcrwdudhsk
- AWS SES : https://eu-west-3.console.aws.amazon.com/ses
- Vercel Academy : https://vercel.com/es-academy/es-academy
- Vercel Family : https://vercel.com/...
- OneSignal : https://app.onesignal.com

### En cas de problème sérieux

1. **Webhook Stripe down** : retry depuis Stripe Dashboard (event > "Resend"). L'idempotence sur `processed_stripe_events` empêche les doublons.
2. **Mail SES qui ne part pas** : check `audit_log` pour `*_failed_giveup`. Le cron `retry-academy-welcome-mail` retente toutes les 10 min jusqu'à 3 fois. Au-delà : envoi manuel via SES Console ou via `/admin/eleves/[userId] > Renvoyer mail bienvenue`.
3. **DB Supabase down** : tous les paiements continuent côté Stripe (pas de blocage). Une fois Supabase up, replay manuellement les events Stripe via Dashboard.
4. **Vercel Family down** : l'app iOS bascule sur sa version cachée dernière (Next.js SSG). Le paywall est sur Academy (Vercel aussi), donc les abonnements ne sont pas affectés tant qu'Academy tient.
5. **Vercel Academy down** : tous les paiements + sequences stoppés. Priorité absolue de remettre en route.

---

**Dernière mise à jour :** 2026-05-08 par Claude.
