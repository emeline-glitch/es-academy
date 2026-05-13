# SECURITY_RUNBOOK : ES Academy + ES Family

Tout ce qui touche à la sécurité applicative, la conformité RGPD, la gestion des secrets, le contrôle d'accès. Le runbook qu'on relit avant un audit ou après une suspicion de fuite.

- **Owner principal :** Emeline (responsable légal et opérationnel).
- **Référent technique :** Claude (audits + rotations).
- **DPO de fait :** Emeline. ES Academy n'a pas de DPO désigné officiellement (seuil pas atteint), mais la fonction est assumée par Emeline.
- **Politique de confidentialité publique :** `/politique-confidentialite`. Toute modification doit être loggée et notifiée si majeure.

## Principes

1. **Moindre privilège** : tout accès est nominatif, limité dans le scope, révocable. Pas de "compte partagé Antony+Tiffany".
2. **Traçabilité** : toute action sensible (suppression contact, export données, modification config) laisse une trace dans `audit_log` ou un registre papier.
3. **Défense en profondeur** : RLS Supabase + service role en server only + signature webhook + rate limiting middleware + 2FA admin.
4. **Échec sûr** : si une vérification échoue, on refuse l'accès. Pas de fallback ouvert.

---

## RGPD : bases légales et traitements

### Traitements principaux

| Traitement | Base légale | Durée conservation |
|---|---|---|
| Inscription newsletter via formulaire | Consentement explicite | Jusqu'à désinscription, puis 36 mois prospection inactif |
| Achat Academy | Exécution contractuelle | Facturation 10 ans (obligation comptable) |
| Abonnement Family | Exécution contractuelle | Idem |
| Migration alumni Evermind | Intérêt légitime documenté | Jusqu'à objection, puis 36 mois max si inactif |
| Cookies analytics (GA4) | Consentement (bannière) | 13 mois |
| Pixel tracking pub | Consentement (bannière) | 13 mois |
| Tickets support | Intérêt légitime (gestion client) | 5 ans |

### Registre des traitements (article 30 RGPD)

À tenir à jour dans `docs/rgpd/registre-traitements.md` (à créer si pas existant). Champs par traitement :
- Nom
- Finalité
- Base légale
- Catégories de données
- Catégories de personnes concernées
- Destinataires (internes + sous-traitants)
- Transferts hors UE (oui/non, avec garanties)
- Durée de conservation
- Mesures de sécurité

### Sous-traitants (DPA à avoir signés)

| Sous-traitant | Service | DPA signé ? |
|---|---|---|
| Supabase (Inc.) | Hébergement DB | DPA standard accepté à l'inscription |
| Vercel | Hébergement front + edge | DPA disponible sur dashboard |
| AWS (SES, S3 si utilisé) | Mailing transactionnel | DPA AWS |
| Stripe | Paiement | DPA standard accepté |
| Notion | CMS pour blog + cours | DPA disponible |
| Bunny.net | CDN vidéo | DPA Bunny |
| OneSignal | Push notifications | DPA OneSignal |
| Calendly | Booking RDV | DPA Calendly |
| Brevo (legacy) | Mailing marketing (ex) | DPA Brevo |
| OVH | Domaine + mail | DPA OVH |

Lister les DPA dans `docs/rgpd/sous-traitants/`. Au moins un PDF signé par sous-traitant.

### Transferts hors UE

- Supabase : possibilité d'héberger en EU (Frankfurt). Vérifier la région du projet.
- Vercel : edge globale, mais data au repos en US. Risque à documenter, SCC Vercel applicables.
- AWS SES : configuré en `eu-west-3` (Paris).
- Stripe : data EU, opérations US possibles (SCC).
- Notion : US, SCC.

Documenter dans la politique de confidentialité.

---

## Droits des personnes

Toute demande arrive via `contact@emelinesiron.com`. Procédure systématique : vérifier l'identité, exécuter, tracer, répondre dans 30 jours max (RGPD).

### 1. Droit d'accès

Le demandeur veut savoir ce qu'on a sur lui.

```sql
-- À exécuter dans Supabase SQL Editor Academy
WITH target AS (SELECT id FROM contacts WHERE email = 'user@example.com')
SELECT 'contact' as table_name, row_to_json(c) as data FROM contacts c, target WHERE c.id = target.id
UNION ALL
SELECT 'enrollments', row_to_json(e) FROM enrollments e, target WHERE e.contact_id = target.id
UNION ALL
SELECT 'family_subscriptions', row_to_json(f) FROM family_subscriptions f, target WHERE f.contact_id = target.id
UNION ALL
SELECT 'consent_log', row_to_json(cl) FROM consent_log cl, target WHERE cl.contact_id = target.id
UNION ALL
SELECT 'email_sequence_enrollments', row_to_json(es) FROM email_sequence_enrollments es, target WHERE es.contact_id = target.id
UNION ALL
SELECT 'page_views', row_to_json(pv) FROM page_views pv, target WHERE pv.contact_id = target.id;
```

Exporter en JSON, envoyer par mail chiffré (zip avec mot de passe ou via un lien temporaire signé).

### 2. Droit à la rectification

L'utilisateur peut modifier son email, prénom, etc. depuis `/dashboard > Profil`. Si l'admin doit forcer la rectification :

```sql
UPDATE contacts
SET first_name = 'NouveauPrénom', last_name = 'NouveauNom', updated_at = now()
WHERE email = 'user@example.com';

INSERT INTO audit_log (action, target_type, target_id, payload)
VALUES ('rgpd_rectification', 'contact', <id>, jsonb_build_object('reason', 'support_ticket_XXXX'));
```

### 3. Droit à l'effacement (droit à l'oubli)

Le plus délicat. On ne peut pas tout supprimer (facture obligation 10 ans).

```sql
-- Anonymiser le contact sans casser les enregistrements facturation
DO $$
DECLARE
  target_id uuid := (SELECT id FROM contacts WHERE email = 'user@example.com');
  hash text := encode(digest('user@example.com' || now()::text, 'sha256'), 'hex');
BEGIN
  -- 1. Anonymiser le contact
  UPDATE contacts SET
    email = 'deleted_' || substring(hash, 1, 16) || '@deleted.local',
    first_name = NULL, last_name = NULL, phone = NULL,
    metadata = '{}'::jsonb,
    tags = ARRAY[]::text[],
    unsubscribed_at = COALESCE(unsubscribed_at, now()),
    deleted_at = now()
  WHERE id = target_id;

  -- 2. Supprimer les traces de tracking et marketing
  DELETE FROM page_views WHERE contact_id = target_id;
  DELETE FROM email_sequence_enrollments WHERE contact_id = target_id;
  DELETE FROM form_submissions WHERE contact_id = target_id;
  -- Conserver consent_log pour preuve (anonymisé via foreign key au contact anonymisé)

  -- 3. Trace audit
  INSERT INTO audit_log (action, target_type, target_id, payload)
  VALUES ('rgpd_effacement', 'contact', target_id,
          jsonb_build_object('reason', 'user_request', 'date', now()));
END $$;
```

Procédure additionnelle :
- AWS SES : ajouter l'adresse dans la suppression list (qu'elle soit déjà supprimée ou non, pour belt-and-braces).
- Notion : si le contact apparaissait dans une page Notion (peu probable), purger.
- Brevo (si la migration a déjà inclus le contact) : supprimer côté Brevo aussi.
- Stripe : on conserve le Customer Stripe (obligation comptable), mais on peut anonymiser le `name` :
  ```bash
  stripe customers update cus_XXX --name "(supprimé)" --metadata anonymized=true
  ```

### 4. Droit à la limitation du traitement

L'utilisateur ne veut plus que ses données soient utilisées pour le marketing, mais ne veut pas être supprimé.

```sql
UPDATE contacts
SET unsubscribed_at = COALESCE(unsubscribed_at, now()),
    marketing_consent = false,
    tags = array_remove(tags, 'prospect_actif')
WHERE email = 'user@example.com';

INSERT INTO consent_log (contact_id, action, source, occurred_at, metadata)
VALUES (<id>, 'limitation', 'support_request', now(),
        jsonb_build_object('scope', 'marketing'));
```

### 5. Droit à la portabilité

Le demandeur veut un export structuré. Même requête que droit d'accès, mais format CSV ou JSON standardisé.

### 6. Droit d'opposition

L'utilisateur s'oppose au traitement basé sur intérêt légitime (par ex. la migration alumni Evermind). On retire de la séquence :

```sql
DELETE FROM email_sequence_enrollments
WHERE contact_id = <id> AND sequence_id IN (
  SELECT id FROM email_sequences WHERE slug IN ('SEQ_AL', 'SEQ_BRV')
);

INSERT INTO consent_log (contact_id, action, source, occurred_at, metadata)
VALUES (<id>, 'opposition_legitimate_interest', 'support_request', now(),
        jsonb_build_object('scope', 'migration_legacy'));
```

### Délais de réponse

- Accusé de réception : 72h ouvrées.
- Réponse complète : 30 jours calendaires max. Prolongeable de 2 mois si demande complexe (motiver dans l'accusé).
- Refus : motiver par écrit, indiquer le recours possible auprès de la CNIL.

---

## consent_log (registre des consentements)

Toute action de consentement passe par cette table. Pas d'exception.

### Schéma simplifié (cf. migration 034 pour la version réelle)

```
consent_log
- id (uuid)
- contact_id (uuid, FK)
- action (text : 'opt_in', 'unsubscribe', 'limitation', 'opposition_legitimate_interest', etc.)
- source (text : 'form', 'manual_support', 'migration_brevo', 'api', etc.)
- occurred_at (timestamptz)
- ip (inet, optionnel)
- user_agent (text, optionnel)
- metadata (jsonb)
```

### Importer un contact avec preuve de consentement

La function `import_contact_with_consent` (migration 034) prend en entrée un email, un nom, des tags, et un objet consentement. Elle crée le contact + l'entrée consent_log de façon atomique.

```sql
SELECT import_contact_with_consent(
  p_email := 'user@example.com',
  p_first_name := 'Jean',
  p_last_name := 'Dupont',
  p_source := 'brevo_migration',
  p_tags := ARRAY['brevo_cohorte_2', 'migration_2026'],
  p_consent_action := 'opt_in_legacy',
  p_consent_source := 'brevo_export_2026_04',
  p_consent_metadata := jsonb_build_object(
    'original_signup_date', '2024-01-15',
    'original_form', 'brevo_form_id_42'
  )
);
```

### Audit du consent_log

Régulièrement (mensuel) :

```sql
-- Tous les opt-in sans preuve metadata
SELECT count(*) FROM consent_log
WHERE action LIKE 'opt_in%' AND (metadata IS NULL OR metadata = '{}'::jsonb);
```

Tout résultat > 0 est un problème. Le consent doit toujours avoir une trace de preuve (date d'inscription, formulaire, IP, etc.).

---

## Gestion des secrets

### Inventaire

| Secret | Localisation | Cadence rotation |
|---|---|---|
| `STRIPE_SECRET_KEY` (sk_live) | Vercel env (Academy + Family) | 6 mois ou sur fuite |
| `STRIPE_WEBHOOK_SECRET` | Vercel env | 6 mois |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env | 6 mois ou sur fuite |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env (public OK) | 12 mois |
| `AWS_SES_ACCESS_KEY_ID` + secret | Vercel env | 90 jours |
| `NOTION_API_KEY` | Vercel env | 6 mois |
| `BUNNY_STREAM_API_KEY` + token | Vercel env | 6 mois |
| `ONESIGNAL_REST_API_KEY` | Vercel env Family | 6 mois |
| `CRON_SECRET` | Vercel env + Supabase Vault | 90 jours |
| `ACADEMY_FAMILY_BRIDGE_SECRET` | Vercel env Academy + Family | 6 mois |
| `TOKEN_SIGNING_SECRET` | Vercel env Family | 12 mois |
| `SITE_PASSWORD` | Vercel env (vide en prod) | 12 mois ou suppression |
| OVH NIC handle password | 1Password coffre `Holdem Admin` | 12 mois + 2FA |
| AWS root account | 1Password + 2FA Yubikey | jamais utilisé en run, root verrouillé |

### Procédure rotation `STRIPE_SECRET_KEY`

1. Stripe Dashboard > **Developers > API keys**.
2. **Reveal live key** (vérifier 2FA).
3. **Create new restricted key** (préférer aux clés full) ou bien rotater la full key.
4. Mettre la nouvelle valeur dans **Vercel > Project > Settings > Environment Variables** (Production).
5. **Redeploy** (Vercel > Deployments > Promote latest with new env).
6. Vérifier en prod : faire un achat test 1 € avec un promo code interne, confirmer la création de l'enrollment.
7. **Roll old key** dans Stripe Dashboard (après 24h de double validité).
8. Logguer la rotation dans `docs/security/rotations.log` (manuel, append-only).

### Procédure rotation `CRON_SECRET`

Délicat car partagé entre Vercel (consommateur côté API routes) et Supabase (producteur côté pg_cron).

1. Générer un nouveau secret : `openssl rand -hex 32`.
2. Mettre dans **Vercel env vars** Academy.
3. Mettre dans **Supabase Vault** (Dashboard > Settings > Vault, ou via SQL :
   ```sql
   SELECT vault.create_secret('xxxxxxxxxxxx', 'CRON_SECRET_NEW');
   ```
4. Ne pas encore désactiver l'ancien.
5. Modifier les jobs pg_cron pour utiliser le nouveau secret. La migration 046 montre le pattern. En clair :
   ```sql
   SELECT cron.alter_job(
     jobid := <id>,
     command := $$SELECT net.http_post(
       url := 'https://emeline-siron.fr/api/cron/process-sequences',
       headers := jsonb_build_object('Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET_NEW'))
     )$$
   );
   ```
6. Attendre 1h et vérifier que les crons tournent toujours (audit_log + heartbeats).
7. Supprimer l'ancien secret du Vault.
8. Mettre à jour Vercel env Academy pour ne garder que `CRON_SECRET` (la nouvelle valeur).
9. Redeploy Vercel.
10. Logguer la rotation.

### Procédure rotation `SUPABASE_SERVICE_ROLE_KEY`

1. Supabase Dashboard > **Settings > API > Generate new service role key**.
2. Mettre dans Vercel env Academy + Family + tout script local qui l'utilise (`.env.local`).
3. Redeploy.
4. Tester via un script de smoke : `node --env-file=.env.local scripts/audit-rls.mjs` doit terminer sans erreur.
5. Le nouveau service role coexiste avec l'ancien tant qu'on n'a pas révoqué l'ancien manuellement (jusqu'à 24h selon Supabase).

### Suspicion de fuite de secret

Si tu penses qu'un secret a fuité (ex. clé Stripe affichée par erreur dans une capture d'écran, commit accidentel sur GitHub) :

1. **Immédiatement** rotater le secret (procédure ci-dessus).
2. Si le secret a été visible publiquement (commit GitHub public, screenshot Twitter, etc.) :
   - **Stripe** : passer aussi en mode `Lockdown` temporaire si possible.
   - **AWS** : créer une nouvelle access key, supprimer l'ancienne, vérifier CloudTrail pour activité suspecte.
   - **Supabase** : auditer `audit_log` + Postgres logs pour les requêtes dans la fenêtre de fuite.
3. Logger l'incident dans `docs/security/incidents/YYYY-MM-DD-leak.md`.
4. Notifier la CNIL si données personnelles compromises (72h max).

---

## RLS (Row Level Security) Supabase

Toutes les tables sensibles doivent avoir RLS activée. La migration 044 (`fix_rls_critical.sql`) a corrigé les manques connus.

### Vérification rapide

```sql
-- Tables sans RLS
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_tables t
    WHERE EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = t.tablename AND n.nspname = t.schemaname AND c.relrowsecurity = true
    )
  )
ORDER BY tablename;
```

### Tables qui doivent avoir RLS

| Table | RLS attendue |
|---|---|
| `contacts` | service_role only en write, lecture limitée |
| `enrollments` | user peut lire les siens, service_role tout |
| `family_subscriptions` | idem |
| `email_sequence_enrollments` | service_role only |
| `consent_log` | service_role only |
| `audit_log` | service_role only en lecture, append-only en write |
| `processed_stripe_events` | service_role only |
| `processed_sns_messages` | service_role only |
| `ses_suppression_list` | service_role only |
| `form_submissions` | service_role only |
| `app_config` | service_role only |

### Tables publiques (lecture OK)

- Tables de référence du contenu (catégories blog, types de formations) si elles existent.
- `forms` (config des formulaires publics, lecture seule pour le rendu).

### Audit annuel

Script `scripts/audit-rls.mjs` à lancer chaque trimestre. Sortie comparée à la version précédente (capture dans `docs/audits/rls-YYYY-Q.txt`).

---

## Contrôle d'accès admin

### Niveaux

| Niveau | Qui | Accès |
|---|---|---|
| **Owner** | Emeline | Tout |
| **Admin** | (vacant, candidat futur associé) | Tout sauf gestion équipe |
| **Editor** | Tiffany | CMS (Notion via admin Academy), sequences, templates |
| **Closer** | Antony | Lecture contacts, lecture enrollments, gestion tickets support |
| **Ops** | Fita | Lecture admin dashboard, tâches déléguées |

### Implémentation

- Table `admin_users` (ou équivalent, à vérifier dans le schéma).
- Champ `role` (enum ou text).
- RLS sur chaque table admin filtre selon le rôle.
- Middleware `src/lib/supabase/middleware.ts` valide la session + rôle.
- Pas de "secret URL" qui contourne l'auth. Toute route admin nécessite session valide.

### 2FA admin

- Supabase auth supporte TOTP. Activer pour tous les comptes admin.
- Stripe : 2FA obligatoire (sur le compte org).
- Vercel : 2FA obligatoire.
- AWS root : Yubikey hardware obligatoire, root jamais utilisé en run (créer des IAM users avec 2FA).
- OVH : 2FA obligatoire.
- Notion : 2FA obligatoire pour les workspace admins.
- GitHub : 2FA obligatoire.

---

## Audit RGPD trimestriel

À faire dans le cadre de la routine trimestrielle (voir `OPERATIONS_RUNBOOK.md`).

### Checklist

- [ ] Registre des traitements à jour.
- [ ] DPA signés avec tous les sous-traitants en cours.
- [ ] Politique de confidentialité publique à jour avec liste des sous-traitants.
- [ ] Mentions légales à jour.
- [ ] Bannière cookies fonctionnelle (refus opérationnel, pas juste "Continue").
- [ ] consent_log audit : 100 % des opt-in ont une metadata.
- [ ] Durée de conservation respectée : `SELECT count(*) FROM contacts WHERE last_engagement < now() - interval '36 months' AND unsubscribed_at IS NULL` doit être 0 ou en cours de purge.
- [ ] Demandes des personnes traitées dans les 30 jours (lire `docs/rgpd/registre-demandes.md`).
- [ ] Aucun secret stocké dans le code source (audit `git log --all -p -- '*.env'` etc.).
- [ ] Backup chiffré au repos vérifié.
- [ ] Transferts hors UE documentés.
- [ ] Pas de données sensibles (santé, religion, opinions politiques) collectées.

### Plan d'action en cas de violation

Une violation = accès non autorisé à des données personnelles, ou perte / altération non autorisée.

1. **0-24h** : contenir l'incident, identifier la cause racine.
2. **24-72h** : notification CNIL si risque pour les personnes (`notification.cnil.fr`). Avec ou sans risque, documenter.
3. **72h+** : si risque élevé, notifier les personnes concernées individuellement.
4. Rédiger le rapport d'incident dans `docs/security/incidents/`.

---

## Sécurité applicative

### Headers HTTP

À vérifier régulièrement (via securityheaders.com ou équivalent) :

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` (à durcir, audit Q3)
- `X-Frame-Options: DENY` (sauf pour les pages embed iframe explicitement autorisées)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Configurés dans `next.config.ts` ou `middleware.ts`. À auditer.

### Rate limiting

- Routes publiques (`/api/contacts`, `/api/forms/[slug]/submit`, `/api/site-auth`) : rate limit middleware.
- Quota cible : 10 req/min/IP, 100 req/h/IP.
- Implémentation : Vercel edge middleware ou via Supabase + table de comptage. À vérifier dans le code (`middleware.ts`).

### Validation des entrées

- Tous les endpoints API utilisent `zod` pour parser les payloads (déjà installé, cf. `package.json`).
- Aucun `JSON.parse` sans validation.
- Aucun `eval`, `Function()`, `dangerouslySetInnerHTML` sans sanitization.

### Webhooks signés

- Stripe : vérification HMAC via `STRIPE_WEBHOOK_SECRET` côté code (cf. `src/app/api/stripe/webhook/route.ts`).
- AWS SNS (pour SES bounces) : vérification de la signature SNS côté code.
- Bridge Academy ↔ Family : HMAC via `ACADEMY_FAMILY_BRIDGE_SECRET`.

### CSP

À durcir. Aujourd'hui probablement permissive. Audit prévu Q3 2026.

---

## Annexes

### Registre des rotations (à tenir)

`docs/security/rotations.log` (créer si absent), format append-only :

```
2026-05-12 STRIPE_SECRET_KEY rotated by Emeline (reason: scheduled 6m). Old key revoked 2026-05-13.
2026-05-12 CRON_SECRET rotated by Claude (reason: scheduled 90d). Both keys active until 2026-05-12 14:00 UTC.
```

### Registre des demandes RGPD (à tenir)

`docs/rgpd/registre-demandes.md`, format :

```
| Date demande | Email demandeur | Type | Date traitement | Statut |
|---|---|---|---|---|
| 2026-05-10 | user@example.com | Effacement | 2026-05-12 | Done (anonymized) |
```

### Liens utiles

- CNIL notification : https://notifications.cnil.fr
- CNIL guide PME : https://www.cnil.fr/fr/professionnels
- Vercel security : https://vercel.com/security
- Supabase security : https://supabase.com/security
- Stripe security : https://stripe.com/security

---

**Dernière mise à jour :** 2026-05-12.
