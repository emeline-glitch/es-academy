# OPERATIONS_RUNBOOK : ES Academy + ES Family

Le quotidien d'exploitation. Ce qu'on fait chaque jour, chaque semaine, chaque mois pour que la plateforme tourne sans surprise.

- **Audience :** Emeline (ops principal), Claude (audits techniques), Fita (sur tâches ops déléguées).
- **Cadence :** ne pas voir ce runbook comme une checklist subie. C'est un canevas. Si une rubrique a été inutile pendant 4 semaines consécutives, on la retire.
- **Doctrine :** observer avant d'agir. Une métrique qui dérive sans raison apparente mérite une lecture, pas une action immédiate.

## Routines journalières (10 min)

Tous les jours ouvrés en début de matinée. Pas le week-end sauf semaine de lancement.

### 1. Dashboard de santé (2 min)

Ouvrir `/admin/dashboard` Academy. Lire les 4 chiffres clés :
- Nombre de nouveaux contacts (24h)
- Nombre d'achats Academy (24h)
- Nombre d'abonnements Family actifs (cumulé)
- Bounce rate moyen sur 24h

Si l'un des chiffres est anormalement bas ou haut comparé à la veille (delta > 50 %), faire un check rapide pour comprendre. Ne pas paniquer pour un delta journalier seul, regarder la tendance 7j dans `/admin/seo` ou via Supabase SQL.

### 2. audit_log (3 min)

Requête prête à coller dans Supabase SQL Editor :

```sql
-- Erreurs et alertes des 24 dernières heures
SELECT created_at, action, target_type, target_id, payload
FROM audit_log
WHERE created_at > now() - interval '24 hours'
  AND (
    action LIKE '%_failed%'
    OR action LIKE '%_giveup%'
    OR action LIKE '%_error%'
    OR action LIKE '%_panic%'
  )
ORDER BY created_at DESC
LIMIT 50;
```

- Lire chaque ligne, classer dans : bénin (retry attendu), à surveiller, à corriger.
- Si plus de 5 lignes par jour, c'est trop. Investiguer la cause racine.

### 3. Tickets support (3 min)

- Ouvrir `contact@emelinesiron.com` (Gmail).
- Tagger chaque ticket : `LAUNCH`, `URGENT`, `BUG`, `RGPD`, `BUSINESS`.
- Les `URGENT` et `BUG` partent en escalade direct.
- Les `RGPD` (désinscription manuelle, demande de suppression, droit d'accès) suivent la procédure dans `SECURITY_RUNBOOK.md`.

### 4. Sentry triage (2 min)

- Ouvrir Sentry > Issues, filtre `Unresolved`, période 24h.
- Marquer `Ignored` les bruits connus (par exemple : webhooks Stripe qui logguent un 400 pour un event non supporté, c'est attendu).
- Assigner les nouveaux issues à Emeline ou Claude selon le type.

---

## Routines hebdomadaires (45 min)

Tous les lundis matin, après le café. Si lundi férié, mardi.

### 1. Lecture des stats marketing (15 min)

- `/admin/seo` : keywords qui montent, qui chutent. Pas de surréaction sur une variation à 1 semaine.
- Google Search Console : impressions, CTR.
- Google Analytics 4 : sessions, conversion `purchase`. Croiser avec les vrais paiements Stripe (parfois GA4 sous-estime).
- Instagram Insights : reach, profil visits, conversions vers landing.
- LinkedIn analytics : si Emeline poste, regarder les meilleurs posts.

Rendre compte en 5 lignes maximum dans le Notion `Weekly Marketing Recap`.

### 2. Backlog tickets support (10 min)

- Lister les tickets > 48h non répondus.
- Si Antony est dépassé : redistribuer à Emeline ou demander un coup de main Fita.
- Si un pattern apparaît (10 tickets sur le même bug), faire ticket bug technique.

### 3. Revue des erreurs Sentry agrégées (10 min)

- Sentry > Issues, période 7 jours, tri par fréquence.
- Top 5 issues : décider Fix / Ignore / Defer.
- Issues de plus de 30 jours sans nouvelle occurrence : `Resolve`.

### 4. Audit des crons pg_cron (5 min)

```sql
-- État des jobs cron sur 7 jours
SELECT j.jobname, j.schedule, j.active,
       count(*) FILTER (WHERE jr.status = 'succeeded') as ok,
       count(*) FILTER (WHERE jr.status = 'failed') as fail,
       max(jr.start_time) as last_run
FROM cron.job j
LEFT JOIN cron.job_run_details jr ON jr.jobid = j.jobid
  AND jr.start_time > now() - interval '7 days'
GROUP BY j.jobname, j.schedule, j.active
ORDER BY fail DESC, last_run DESC;
```

- Si un job a > 5 % de fail rate, investiguer.
- Si un job n'a pas tourné depuis > 48h, vérifier qu'il est `active=true`.

### 5. Backup vérification (5 min)

- Supabase Academy + Family : ouvrir Database > Backups, vérifier qu'un backup a été créé hier soir.
- Récupérer la date du dernier PITR window : doit être dans les 24h.

---

## Routines mensuelles (2h)

Premier lundi du mois.

### 1. Audit RLS (30 min)

```bash
cd ~/es-academy && node --env-file=.env.local scripts/audit-rls.mjs
```

- Le script liste toutes les tables sans RLS activée ou avec des policies suspectes.
- Comparer avec la sortie du mois dernier (capture d'écran dans `docs/audits/`).
- Toute table nouvelle sans RLS doit être justifiée (table de référence publique ou patché).

### 2. Audit séquences mail (30 min)

```bash
cd ~/es-academy && node --env-file=.env.local scripts/audit-sequences.mjs
```

- Sortie : par séquence, taux d'ouverture, taux de clic, taux de désinscription, taux de bounce, ARPU généré.
- Identifier les séquences à itérer en copy (faible ouverture) ou en cadence (forte désinscription).
- Rendez-vous Tiffany pour les réécritures de copy.

### 3. Rotation des secrets sensibles (45 min)

Procédure complète dans `SECURITY_RUNBOOK.md` section "Rotation". Cadence cible :
- `CRON_SECRET` : rotation tous les 90 jours.
- `STRIPE_WEBHOOK_SECRET` : rotation tous les 6 mois.
- `SUPABASE_SERVICE_ROLE_KEY` : rotation tous les 6 mois ou immédiatement si suspicion de fuite.
- `ACADEMY_FAMILY_BRIDGE_SECRET` : rotation tous les 6 mois.
- `TOKEN_SIGNING_SECRET` : rotation tous les 12 mois.
- AWS SES access keys : rotation tous les 90 jours.
- Notion API key : rotation tous les 6 mois.
- Bunny stream API key + token auth key : rotation tous les 6 mois.

Tu n'es pas obligé de tout rotater en même temps. Échelonner sur le mois.

### 4. Revue financière Stripe (15 min)

- Stripe Dashboard > Reports > Revenue.
- Cross-check avec Supabase `enrollments` et `family_subscriptions` : le total doit matcher (à l'arrondi près).
- Si décalage > 1 %, investiguer (paiements offline non saisis, refunds non synchronisés, etc.).

---

## Routines trimestrielles (4h)

Premier lundi du trimestre.

### 1. Stress test E2E (1h)

```bash
cd ~/es-academy && node --env-file=.env.local scripts/e2e-full-platform.mjs
cd ~/es-academy && node --env-file=.env.local scripts/e2e-stress-test.mjs
```

- Le script E2E simule les parcours utilisateurs critiques (achat 1x, 3x, 4x, accès cours, désinscription).
- Le stress test simule 100+ utilisateurs simultanés.
- Lire `AUDIT_STRESS_TEST.md` à la racine pour le contexte.
- Tout fail = ticket bloquant.

### 2. Audit RGPD (1h)

Procédure dans `SECURITY_RUNBOOK.md` section "Audit RGPD". En bref :
- Vérifier `consent_log` complet et exportable.
- Vérifier que les droits utilisateurs (accès, suppression, rectification, portabilité) fonctionnent end-to-end.
- Vérifier la politique de confidentialité publique à jour.
- Vérifier que la durée de conservation est respectée (purge des contacts inactifs > 36 mois pour la prospection).

### 3. Audit dépendances npm (30 min)

```bash
cd ~/es-academy && npm audit
cd ~/es-academy && npm outdated
```

- Patcher les CVE high et critical.
- Mettre à jour les patches mineurs (npm update).
- Pour les majeurs (Next.js, Stripe, Supabase), lire le changelog avant.
- IMPORTANT : Next 16 a des breaking changes vs Next 15. Lire `node_modules/next/dist/docs/` (cf. `AGENTS.md` racine) avant tout upgrade.

### 4. Revue architecture (30 min)

- Lire `ARCHITECTURE.md`.
- Mettre à jour si des changements majeurs ont eu lieu (nouvelle dépendance, refacto majeur, suppression de service).

### 5. Game day incident (1h)

Simulation d'une panne. Choisir un scénario parmi `INCIDENT_RUNBOOK.md`, le jouer en interne sans toucher la prod :
- Tirer un dé : "Supabase down" / "SES suspendu" / "DNS perdu".
- Emeline déroule le runbook à voix haute, Claude coche les étapes.
- Identifier ce qui n'est pas clair, ce qui manque, mettre à jour.

---

## Procédures spécifiques

### Renvoyer un mail de bienvenue (utilisateur qui n'a rien reçu)

1. Vérifier dans `ses_suppression_list` que l'adresse n'est pas suppressed :
   ```sql
   SELECT * FROM ses_suppression_list WHERE email = 'user@example.com';
   ```
2. Si suppressed avec raison `Bounce > Hard`, l'adresse est invalide. Demander une autre adresse à l'utilisateur.
3. Si suppressed avec raison `Complaint`, l'adresse a marqué un mail comme spam. Retirer manuellement de la liste **seulement après confirmation explicite de l'utilisateur** par mail :
   ```bash
   aws sesv2 delete-suppressed-destination --email-address user@example.com --region eu-west-3
   ```
4. Aller dans `/admin/eleves/[userId]` > bouton "Renvoyer mail bienvenue".
5. Si le bouton n'existe pas (à vérifier dans le code), relancer manuellement via la séquence :
   ```sql
   UPDATE email_sequence_enrollments
   SET status = 'active', current_step = 0
   WHERE contact_id = <id> AND sequence_id = (SELECT id FROM email_sequences WHERE slug = 'SEQ_PA_ACADEMY');
   ```
   Puis attendre le prochain cron `process-sequences` (max 5 min).

### Désinscrire manuellement un contact

1. L'utilisateur clique normalement sur le lien `/desabonnement?token=...` du footer mail. Vérifier d'abord avec lui s'il l'a essayé.
2. Si le lien ne marche pas (token expiré ou perdu), procéder manuellement :
   ```sql
   UPDATE contacts
   SET unsubscribed_at = now(),
       unsubscribe_reason = 'manual_support_request'
   WHERE email = 'user@example.com';

   INSERT INTO consent_log (contact_id, action, source, occurred_at, metadata)
   VALUES (
     (SELECT id FROM contacts WHERE email = 'user@example.com'),
     'unsubscribe', 'manual_support', now(),
     jsonb_build_object('agent', 'antony', 'ticket_id', 'SUPP-XXXX')
   );
   ```
3. Confirmer par mail à l'utilisateur : "Tu es désinscrit, tu ne recevras plus rien de notre part."

### Supprimer définitivement un contact (droit à l'oubli)

Procédure complète dans `SECURITY_RUNBOOK.md` section "Droit à l'oubli". En bref :

1. Vérifier l'identité du demandeur (réponse à un mail envoyé sur l'adresse en question).
2. Conserver une trace dans un fichier hors-ligne (registre RGPD papier ou Notion `RGPD Suppressions`).
3. Exécuter :
   ```sql
   -- Anonymiser plutôt que supprimer si lié à enrollment payé (besoin légal de garder la facture)
   UPDATE contacts SET
     email = 'deleted_' || id || '@deleted.local',
     first_name = NULL, last_name = NULL, phone = NULL,
     metadata = '{}'::jsonb,
     deleted_at = now()
   WHERE email = 'user@example.com';

   DELETE FROM email_sequence_enrollments WHERE contact_id = <id>;
   DELETE FROM page_views WHERE contact_id = <id>;
   -- Garder enrollments + family_subscriptions (preuve de facturation, 10 ans)
   ```
4. Confirmer par mail à l'utilisateur (en répondant sur le ticket initial).

### Rejouer un webhook Stripe

Voir `INCIDENT_RUNBOOK.md` section "Stripe webhook". Quick reference :

```bash
# Trouver l'event
stripe events list --limit 10 --created.gte=$(date -u -v-1H +%s)

# Rejouer
stripe events resend evt_XXXXX
```

L'idempotence côté `processed_stripe_events` (migration 041) empêche les doublons.

### Importer des contacts en masse (Brevo, alumni, etc.)

Procédure complète dans `SECURITY_RUNBOOK.md` section "Imports RGPD". En bref :

1. Préparer un CSV avec colonnes : `email,first_name,last_name,source,consent_proof_url,consent_date`.
2. Valider le consentement pour chaque ligne :
   - Alumni Evermind : intérêt légitime documenté.
   - Brevo : opt-in explicite avec preuve (date d'inscription + IP + lien preuve si possible).
3. Exécuter :
   ```bash
   cd ~/es-academy && node --env-file=.env.local scripts/migrate-from-email.mjs \
     --input ./cohort-X.csv \
     --batch-size 500 \
     --tags brevo_cohorte_X,migration_2026 \
     --consent-source brevo_legacy
   ```
4. Surveiller 24h les bounces sur SES.

### Provisionner un nouveau membre d'équipe

Voir `ONBOARDING.md`. En bref :
1. Inviter dans GitHub (read-only sur `es-academy` repo, write si dev).
2. Inviter dans Supabase (Developer si dev, Read-only sinon).
3. Inviter dans Vercel (Member, pas Owner).
4. Inviter dans Stripe (View-only par défaut, Edit si nécessaire).
5. Créer un compte admin Academy via `/admin > Utilisateurs > Inviter`.
6. Briefer sur `INCIDENT_RUNBOOK.md` et `SECURITY_RUNBOOK.md`.
7. Mot de passe 1Password coffre `ES Academy Team`.

### Décommissionner un membre d'équipe (départ)

1. Révoquer accès GitHub.
2. Révoquer accès Supabase (Settings > Team > Remove).
3. Révoquer accès Vercel (Team > Members > Remove).
4. Révoquer accès Stripe (Team > Remove).
5. Révoquer accès admin Academy (`UPDATE admin_users SET active=false WHERE user_id=...`).
6. Changer les mots de passe partagés dans 1Password.
7. Rotation des secrets sensibles auxquels la personne avait accès (CRON_SECRET, SERVICE_ROLE_KEY si elle les a vus).
8. Audit log de tout ce que la personne a touché dans les 7 jours précédents (cf. `SECURITY_RUNBOOK.md`).

---

## Scripts utilitaires (cheatsheet)

Localisation : `scripts/` à la racine. Tous prennent `--env-file=.env.local` côté Node.

| Script | Usage |
|---|---|
| `smoke-test.sh` | Tests HTTP de surface contre prod ou preview |
| `apply-migration.sh` | Appliquer une migration Supabase (via PAT) |
| `audit-rls.mjs` | Audit policies RLS sur toutes les tables |
| `audit-sequences.mjs` | Stats par séquence mail |
| `audit-from-emails.mjs` | Audit des contacts inactifs / suppressed |
| `audit-last-enrollment.mjs` | Diagnostic d'un enrollment Stripe spécifique |
| `e2e-full-platform.mjs` | Test E2E complet HTTP |
| `e2e-stress-test.mjs` | Stress test concurrence |
| `notion_check.mjs` | Diagnostic cohérence Notion DBs |
| `seed-quizzes.mjs` | (Re)seed des quizz |
| `seed-sprintN.mjs` | (Re)seed des sprints 1 à 5 |
| `prime-ga4-events.mjs` | Push d'events server-side GA4 |
| `record-keyword-positions.mjs` | Capture positions SERP keywords |
| `refresh-stale-articles.mjs` | Refresh ISR articles blog |
| `run-seo-audit.mjs` | Audit SEO complet |
| `check-ses-feedback-config.mjs` | Vérifier SNS + SES bounce config |
| `test-ses-sns-bounce.mjs` | Test simulation bounce |
| `test-ses.mjs` | Envoi de test SES |
| `migrate-from-email.mjs` | Import contacts CSV avec consent |
| `process-pending.mjs` | Forcer process des séquences en attente |

Ne pas lancer ces scripts en prod sans avoir lu le code source d'abord.

---

## Annexes

### Commandes SQL utiles

```sql
-- Nombre de contacts actifs (non désinscrits, vérifiés)
SELECT count(*) FROM contacts WHERE unsubscribed_at IS NULL AND email_status = 'verified';

-- Nombre d'élèves Academy actifs
SELECT count(*) FROM enrollments WHERE status = 'active';

-- Nombre d'abonnés Family actifs
SELECT count(*) FROM family_subscriptions WHERE status = 'active' AND canceled_at IS NULL;

-- Revenus 30 derniers jours
SELECT sum(amount_cents)/100.0 as revenue_eur
FROM enrollments WHERE created_at > now() - interval '30 days';

-- Top 10 sources de contacts
SELECT source, count(*)
FROM contacts WHERE created_at > now() - interval '30 days'
GROUP BY source ORDER BY count(*) DESC LIMIT 10;
```

### Liens utiles

- Admin Academy : https://emeline-siron.fr/admin
- Stripe Dashboard : https://dashboard.stripe.com
- AWS SES Console : https://eu-west-3.console.aws.amazon.com/sesv2
- Vercel : https://vercel.com/es-academy
- Supabase Academy : https://supabase.com/dashboard/project/tvkzndkywznaysiqvmsh
- Supabase Family : https://supabase.com/dashboard/project/hpcoxtpdsydcrwdudhsk
- Notion workspace : (lien à ajouter par Emeline)
- 1Password équipe : (lien à ajouter par Emeline)

---

**Dernière mise à jour :** 2026-05-12.
