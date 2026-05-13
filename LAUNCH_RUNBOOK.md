# LAUNCH_RUNBOOK : ES Academy + ES Family

Procédure minute par minute du jour J. Toute la prépa J-7 à J-2 vit dans `EXECUTION_LOG_MORCEAU_2.md` et `VERIFICATION_MORCEAU_2.md`. Ce runbook prend le relais à T-24h.

- **Owners jour J :** Emeline (commandement), Claude (exécution code), Tiffany (com), Antony (support).
- **Date de lancement officielle :** à figer 48h avant. Par défaut J = 14 mai 2026.
- **Cible soft launch :** 1900 alumni Evermind (intérêt légitime, opt-out propre, cohorte de confiance).
- **Cible J+72h si feu vert :** 35 000 contacts Brevo en 2 cohortes échelonnées.

## Glossaire des seuils STOP

Pas un seuil mou, pas une opinion. Si un des seuils est franchi, on coupe ou on freeze. Le runbook précise quoi pour chaque cas plus bas.

| Métrique | Seuil STOP | Conséquence immédiate |
|---|---|---|
| SES bounce rate (rolling 1h) | > 2 % | Freeze tous les crons d'envoi, pas de cohorte 2 |
| SES complaint rate (rolling 24h) | > 0,1 % | Idem + nettoyage liste avant reprise |
| SES sending state | `Paused` ou `Probation` | Stop net, plan AWS Trust & Safety |
| Sentry erreurs serveur 5xx | > 10 / heure | Investigation avant tout envoi |
| Webhook Stripe failed deliveries | 3 consécutives | Vérifier endpoint + replay manuel |
| Stripe payments avec enrollment manquant | > 5 | Lancer la réconciliation, freeze envois |
| Conversion landing Academy 24h | < 0,5 % | Pas de STOP mais on revoit copy avant cohorte 2 |
| Plaintes RGPD via `contact@emelinesiron.com` | > 3 / 24h | Stop cohorte 2, audit consent_log |

---

## T-24h : checklist pré-vol

À faire la veille du lancement entre 14h et 18h. Compter 90 minutes total.

### 1. DNS et délivrabilité mail (15 min)

Vérifications côté OVH puis côté AWS SES.

```bash
# DKIM (3 CNAMEs SES attendus, type CNAME, target *.dkim.amazonses.com)
dig +short CNAME k1._domainkey.emeline-siron.fr
dig +short CNAME k2._domainkey.emeline-siron.fr
dig +short CNAME k3._domainkey.emeline-siron.fr

# SPF (un seul TXT, doit contenir include:amazonses.com)
dig +short TXT emeline-siron.fr | grep -i spf

# DMARC (TXT _dmarc, policy quarantine ou reject)
dig +short TXT _dmarc.emeline-siron.fr

# MX (Google Workspace si mail entrant, sinon SES inbound)
dig +short MX emeline-siron.fr
```

Validation côté AWS :
```bash
aws ses get-identity-verification-attributes --identities emeline-siron.fr --region eu-west-3
aws sesv2 get-account --region eu-west-3 | jq '.SendingEnabled, .ProductionAccessEnabled'
```

Résultat attendu : `VerificationStatus: Success`, `SendingEnabled: true`, `ProductionAccessEnabled: true`. Si l'un des trois est faux, on ne lance pas, on traite avant.

### 2. Supabase prod (10 min)

- Plan : **Pro** confirmé (PITR activé, daily backups 7j minimum). Ouvrir [le projet Academy](https://supabase.com/dashboard/project/tvkzndkywznaysiqvmsh/settings/billing) et [Family](https://supabase.com/dashboard/project/hpcoxtpdsydcrwdudhsk/settings/billing).
- Backups : vérifier qu'il existe un backup de moins de 24h dans **Database > Backups**.
- Connexion pool : `Settings > Database > Connection pooling` doit afficher pool size ≥ 15.
- Migrations : `bash scripts/apply-migration.sh --dry-run` ne doit rien proposer. Sinon il reste des migrations en attente.
- Cron pg_cron : ouvrir **Database > Cron Jobs**, vérifier que `process-sequences`, `chatel-reminders`, `retry-academy-welcome-mail`, `detect-behavioral-triggers`, `seasonal-toggle`, `sync-ses-suppression` sont tous `active` et que la dernière exécution date de moins d'1h.
- audit_log cleanup : la migration 005 expose la fonction `prune_audit_log`. Vérifier qu'elle tourne en pg_cron tous les jours (`SELECT * FROM cron.job WHERE jobname = 'prune-audit-log';`).

### 3. Stripe live mode (10 min)

- Dashboard mode **Live** sélectionné, pas Test. Vérifier le toggle en haut.
- Endpoints webhook (`Developers > Webhooks`) :
  - `https://emeline-siron.fr/api/stripe/webhook` doit être listé, status **Enabled**, events au minimum : `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`, `payment_intent.succeeded`, `promotion_code.created`.
  - `https://es-family.vercel.app/api/stripe/webhook` doit être listé séparément.
- Signing secrets : noter les `whsec_...` de chaque endpoint et confirmer qu'ils correspondent à `STRIPE_WEBHOOK_SECRET` côté Vercel Academy et Family (envs distincts).
- Produits live : `STRIPE_PRODUCT_ACADEMY`, `STRIPE_PRODUCT_FAMILY` créés en mode live. Prices `1x`, `3x`, `4x`, `fondateur`, `standard` existent en EUR avec interval correct.
- Coupons live : `ACADEMY_3_MOIS_FAMILY` et `EVERMIND` créés en live. Vérifier qu'aucun n'est suspendu.
- Test Clock : derniers tests 3x et 4x doivent avoir validé N factures pour N installments. Sinon, ne pas activer le 3x/4x sur la landing, n'ouvrir que le 1x.

### 4. Vercel env vars prod (15 min)

Procédure exhaustive : ouvrir `Vercel > Project > Settings > Environment Variables`, filtrer sur **Production**, exporter en CSV via le bouton ou lister manuellement.

La liste de référence est dans `.env.example` à la racine. Variables critiques à confirmer présentes en prod (Academy) :

```
STRIPE_SECRET_KEY          (préfixe sk_live_, pas sk_test_)
STRIPE_WEBHOOK_SECRET      (le whsec_ du endpoint live Academy)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (pk_live_)
STRIPE_PRICE_ACADEMY_1X/3X/4X
STRIPE_PRODUCT_ACADEMY, STRIPE_PRODUCT_FAMILY
STRIPE_PRICE_FAMILY_FONDATEUR, STRIPE_PRICE_FAMILY_STANDARD
STRIPE_FAMILY_FONDATEUR_CAP=500
STRIPE_COUPON_ACADEMY_GIFT, STRIPE_COUPON_ALUMNI_GIFT, STRIPE_PROMO_CODE_EVERMIND
NEXT_PUBLIC_SITE_URL=https://emeline-siron.fr
SES_FROM_EMAIL              (= identité SES verified live)
SES_REGION=eu-west-3
AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
NOTION_API_KEY + 5 DB IDs (COURSES, MODULES, LESSONS, RESOURCES, BLOG)
BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY, BUNNY_TOKEN_AUTH_KEY
CRON_SECRET                 (identique à la valeur stockée dans Supabase Vault)
ADMIN_EMAIL=contact@emelinesiron.com
SITE_PASSWORD=              (vide en prod)
```

Côté Family les vars critiques sont : `ACADEMY_FAMILY_BRIDGE_SECRET`, `TOKEN_SIGNING_SECRET`, `NEXT_PUBLIC_ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, plus les Stripe et SES Family.

Critère STOP : si une variable critique manque, ne pas lancer. Une env manquante en prod, c'est un 500 garanti sur la première transaction.

### 5. Sentry actif (5 min)

- Ouvrir le projet Sentry Academy + Family (organisation `es-academy`).
- Vérifier qu'il y a eu au moins 1 event reçu dans les 24h (peut être une erreur volontaire de test).
- Confirmer que le release tag pointe sur le SHA du dernier déploiement Vercel (intégration Sentry > Vercel).
- Alertes : 5 règles attendues, listées dans `MONITORING.md` section "Sentry".

### 6. BetterStack (Uptime + Logs) (5 min)

- Heartbeats actifs : `cron-process-sequences`, `cron-chatel-reminders`, `cron-retry-welcome-mail`. Si un heartbeat est `down` depuis plus de 30 min, le cron côté Supabase a un souci.
- Status page publique : `status.emeline-siron.fr` répond 200 (ou désactivée si pas encore prête).
- Logtail (ou équivalent) connecté à Vercel : vérifier ingestion en temps réel sur la dernière minute.

### 7. Suppression list SES (5 min)

Ouvrir AWS SES Console > **Account dashboard > Suppression list**.

- Si la liste contient des adresses légitimes (false positives), les retirer via :
  ```bash
  aws sesv2 delete-suppressed-destination --email-address foo@bar.com --region eu-west-3
  ```
- Croiser avec notre table `ses_suppression_list` Supabase (migration 005 et suivantes) : un SELECT côté SQL editor doit retourner les mêmes adresses dans les deux sens.
- Le cron `sync-ses-suppression` doit avoir tourné dans les 6 dernières heures.

### 8. Smoke tests prod (5 min)

```bash
cd ~/es-academy && BASE_URL=https://emeline-siron.fr bash scripts/smoke-test.sh
cd ~/es-family && BASE_URL=https://es-family.vercel.app bash scripts/smoke-test.sh
```

Critère : 21/21 OK côté Academy, équivalent côté Family. Toute route en erreur est un STOP avant J0.

### 9. Préparer la fenêtre de surveillance (5 min)

Ouvrir et garder en onglets pour J0 :
- Stripe Dashboard mode Live > Payments
- AWS SES Console > Sending statistics
- Vercel > Academy > Deployments + Logs (Runtime + Functions)
- Sentry > Issues (filtre last 1h)
- Supabase > Academy > SQL Editor (requêtes audit_log prêtes, voir annexe)
- `/admin/dashboard` Academy
- `/admin/sequences` Academy
- Slack ou WhatsApp équipe (Emeline + Antony + Tiffany)

---

## T-2h : briefing équipe (30 min)

Réunion visio 30 min. Tout le monde rejoint depuis son poste.

### Ordre du jour

1. **État technique (Claude / Emeline) 5 min** : récap des checklists T-24h, listes des points encore fragiles.
2. **Antony, support (10 min)** :
   - Boîte `contact@emelinesiron.com` accessible, filtres Gmail prêts (label `LAUNCH`, label `URGENT`).
   - Calendly d'urgence ouvert (créneaux 15 min réservés J0 + J+1).
   - Script de réponse type sur les 4 cas suivants : "Je n'ai pas reçu mon mail", "Je ne reçois pas mon code Family", "Stripe a échoué mais débité", "Je veux me désinscrire".
   - Pour "Stripe échoué mais débité" : Antony ne touche à RIEN, escalade direct Emeline. La réconciliation passe par `scripts/reconcile-stripe-enrollments.mjs` (voir INCIDENT_RUNBOOK).
3. **Tiffany, communication (10 min)** :
   - Drafts Instagram (story + post), LinkedIn, mail Brevo (cohorte alumni d'abord) prêts dans Notion `LAUNCH_COMS`.
   - Pas de publication avant le top d'Emeline à T0.
   - Réponses aux DM : ton tutoiement, pas de promesse outside roadmap.
4. **Critères STOP collectifs (5 min)** : tout le monde connaît les seuils de la table ci-dessus. En cas de doute, on stoppe, on ne valide jamais en solo.

### Sortie de réunion

- Confirmation écrite "GO J0" ou "DELAY 24h" par Emeline dans le canal équipe.
- Si DELAY : on refait T-24h le lendemain, pas de raccourci.

---

## T-1h : dry-run final (45 min)

Test de bout en bout sur la prod réelle avec un compte sacrificiel et une CB réelle.

### Setup

- Créer une adresse mail jetable Gmail (`emeline.launch.dryrun+J0@gmail.com`).
- Préparer une CB Visa personnelle (pas la pro, pas un partagé). Le montant test sera de 1 € via le promo code interne `DRYRUN_J0` (à créer dans Stripe dashboard live, valide 24h, 100 % off sur Academy 1x).

### Parcours

1. Naviguer sur `https://emeline-siron.fr/academy` en navigation privée.
2. Cliquer "Acheter en 1x", appliquer le code `DRYRUN_J0`, payer 1 € avec la CB réelle.
3. Sur la page `/merci` :
   - Vérifier que le code Family `FAMILYXXXX` est affiché.
   - Vérifier que le CTA "Activer mes 3 mois" est visible et cliquable.
4. Ouvrir la boîte Gmail jetable :
   - Le mail de bienvenue Academy doit être arrivé dans moins de 60 secondes (pas en spam, pas dans Promotions sur Gmail web).
   - Le magic link doit logger sur `/dashboard` en un clic.
   - Le mail contient le code Family.
   - Le lien de désinscription en footer doit pointer sur `/desabonnement?token=...` et fonctionner (sans réellement se désinscrire, juste vérifier que la page charge).
5. Cliquer "Activer mes 3 mois Family" depuis `/merci` :
   - Vérifier qu'on atterrit sur `https://es-family.vercel.app/?code=FAMILYXXXX` (ou domaine custom si configuré).
   - Compléter le checkout Family avec une autre CB.
   - Vérifier qu'on devient `founder_500` (compteur visible dans `/admin/family` côté Academy via le bridge).
6. Aller sur `/dashboard > Mon cours` :
   - Vérifier l'accès à au moins 3 leçons.
   - Vérifier qu'une vidéo Bunny charge effectivement (player démarre, pas d'erreur 403 token).
7. Aller sur `/desabonnement?token=...` du mail de bienvenue : faire un vrai désabonnement, puis se réabonner via le formulaire (pour ne pas polluer la base avant J0).

### Cleanup post-dry-run

- Annuler le promo code `DRYRUN_J0` dans Stripe (pour éviter qu'un attaquant le devine).
- Refund le 1 € à toi-même via Stripe Dashboard.
- Supprimer le contact créé via `/admin/contacts > Supprimer définitivement` (RGPD, et pour des stats propres).
- Annuler la souscription Family si activée.

### Critères

- Mail arrivé en moins de 60s : OK.
- Mail dans Promotions Gmail : warning, pas STOP. À surveiller.
- Mail dans Spam : **STOP**, problème SES/DKIM.
- Code Family absent : STOP, problème webhook Stripe.
- Vidéo Bunny qui ne charge pas : STOP, problème token CDN.
- Désabonnement KO : STOP, problème conformité.

---

## T0 : envoi première vague (15 min)

Soft launch sur les 1900 alumni Evermind. C'est la cohorte la plus engagée et la plus tolérante. Si ça casse ici, ça casse partout, on freeze.

### 1. Pré-flight (5 min)

- Reconfirmer que le dry-run a passé.
- Ouvrir `/admin/sequences > Migration Brevo cohorte 1 (SEQ_AL)` : status `active`.
- Préparer la requête de lancement :

```sql
-- À exécuter dans Supabase SQL Editor Academy, projet tvkzndkywznaysiqvmsh
-- Inscription en masse des 1900 alumni dans la séquence d'annonce launch.
-- IMPORTANT : tag `alumni_evermind` doit déjà être posé (import RGPD migration 034).

INSERT INTO email_sequence_enrollments (contact_id, sequence_id, status, started_at)
SELECT c.id, s.id, 'active', now()
FROM contacts c
CROSS JOIN email_sequences s
WHERE s.slug = 'SEQ_AL'
  AND 'alumni_evermind' = ANY(c.tags)
  AND c.unsubscribed_at IS NULL
  AND c.email_status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM email_sequence_enrollments e
    WHERE e.contact_id = c.id AND e.sequence_id = s.id
  );
```

Cette requête est idempotente : on peut la rejouer sans risque, le `NOT EXISTS` exclut les déjà inscrits.

### 2. Lancement (5 min)

- Exécuter la requête. Compter le nombre de lignes insérées (devrait être entre 1850 et 1900, le reste étant désabonnés ou bouncés).
- Le cron `process-sequences` tourne toutes les 5 min. Le premier batch d'envoi part dans les 5 min suivantes.

### 3. Bascule communication externe (5 min)

Sur signal d'Emeline uniquement :
- Tiffany publie la story Instagram et le post LinkedIn.
- Pas de bascule Brevo cohorte 2 ou 3 avant T+72h validé.

---

## T+1h : surveillance active (1h)

Pendant 60 minutes pleines, monitoring continu, personne ne s'éloigne plus de 10 min de son écran.

### SES sending stats

Ouvrir AWS SES > **Sending statistics**. Recharger toutes les 5 min.

- **Bounce rate** : doit rester < 0,5 % sur la première heure. Au-dessus de 1 %, on freeze les sequences. Au-dessus de 2 %, on freeze + on appelle AWS Support si on a un plan Business.
- **Complaint rate** : tolérance zéro. Une seule complaint, on note, deux, on investigue, dix, on stoppe.
- **Reputation dashboard** : `Healthy` doit rester `Healthy`.

Commandes utiles :
```bash
# Stats SES dernière heure
aws sesv2 get-account --region eu-west-3 | jq '.SendQuota'
aws cloudwatch get-metric-statistics --namespace AWS/SES \
  --metric-name Bounce --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Sum \
  --region eu-west-3
```

### Sentry errors

- Onglet **Issues > New** : filtrer last 1h, environnement `production`.
- Toute erreur serveur 5xx nouvelle doit être lue, attribuée (Claude ou Emeline) et triée :
  - **Critical** : casse un parcours d'achat → drop everything, fix.
  - **High** : casse une feature secondaire (admin, blog, push) → ticket, fix dans la journée.
  - **Low** : noisy log, edge case rare → backlog.
- Seuil STOP : > 10 erreurs serveur critiques en 1h sur webhook Stripe ou checkout.

### Stripe payments

- Stripe Dashboard > **Payments** mode Live, refresh toutes les 5 min.
- Vérifier que pour chaque paiement réussi, il y a un enrollment dans `enrollments` Supabase :
  ```sql
  SELECT s.id as stripe_session, e.id as enrollment_id, c.email
  FROM (
    -- placeholder : on cherche les sessions Stripe traitées
    SELECT event_id, payload->>'customer_email' as email
    FROM processed_stripe_events
    WHERE created_at > now() - interval '1 hour'
      AND payload->>'object' = 'checkout.session'
  ) s
  LEFT JOIN enrollments e ON e.stripe_session_id = s.event_id
  LEFT JOIN contacts c ON c.email = s.email
  ORDER BY s.event_id DESC;
  ```
- Toute ligne `enrollment_id` à NULL indique un webhook qui n'a pas créé l'enrollment. Si > 5 lignes orphelines, déclencher la procédure de réconciliation (voir INCIDENT_RUNBOOK section Stripe).

### Webhook Stripe health

- Stripe Dashboard > **Developers > Webhooks > [endpoint Academy] > Recent deliveries**.
- Taux de succès doit être 100 %. 1 ou 2 retry sont OK (Stripe retry). Plus de 5 failed deliveries consécutives, on alerte.

### Coupures réseau et 503

- Vercel > **Logs > Runtime Logs** filtré sur `level: error`.
- Supabase > **Logs > Postgres logs** filtre `LOG: connection`.
- Si Supabase remonte des erreurs de pool exhaustion, augmenter le pool size dans Settings > Database > Connection pooling (jusqu'à 20).

### Boîte mail support

Antony lit `contact@emelinesiron.com` toutes les 10 min. Mots-clés à surveiller :
- "n'ai pas reçu" → check audit_log retry-welcome-mail.
- "débité deux fois" → STOP, refund manuel + investigation.
- "désabonnement" → vérifier que le lien marche, mettre à jour si user a payé.

---

## T+24h : analyse premier jour (90 min)

Réunion bilan H+24 entre Emeline et Claude. Lecture des données, pas des impressions.

### Métriques quantitatives

```sql
-- Achats Academy H+24
SELECT count(*) as nb_achats,
       sum(amount_cents)/100.0 as ca_brut_eur
FROM enrollments
WHERE created_at > (SELECT min(created_at) FROM enrollments WHERE created_at > now() - interval '25 hours')
  AND status = 'active';

-- Conversion landing → achat
SELECT
  count(DISTINCT session_id) FILTER (WHERE path = '/academy') as visits_landing,
  count(DISTINCT session_id) FILTER (WHERE path = '/merci') as conversions
FROM page_views
WHERE created_at > now() - interval '24 hours';

-- Sequences : envois, ouvertures, clics
SELECT
  s.slug,
  count(*) FILTER (WHERE e.status = 'active') as actifs,
  count(*) FILTER (WHERE e.status = 'completed') as completes,
  count(*) FILTER (WHERE e.status = 'unsubscribed') as desinscrits,
  count(*) FILTER (WHERE e.status = 'bounced') as bounces
FROM email_sequence_enrollments e
JOIN email_sequences s ON s.id = e.sequence_id
WHERE e.started_at > now() - interval '24 hours'
GROUP BY s.slug ORDER BY actifs DESC;

-- Bounces SES sur 24h
SELECT bounce_type, count(*)
FROM ses_suppression_list
WHERE added_at > now() - interval '24 hours'
GROUP BY bounce_type;
```

### Métriques qualitatives

- **Tickets support** : Antony fait un récap par bucket (paiement / accès cours / désabonnement / autre).
- **Remontées Trustpilot** : pas attendu de review dans les 24h, mais checker si un client motivé a déjà posté.
- **Sentiment DM Instagram / commentaires LinkedIn** : Tiffany résume en 5 lignes.
- **Erreurs Sentry agrégées** : top 10 issues triées par fréquence.

### Décision intermédiaire

À T+24h, on ne décide pas encore d'élargir aux 35K Brevo. On valide juste :
1. Pas de seuil STOP franchi.
2. Pas d'incident bloquant non résolu.
3. Tickets support volumétrie gérable (Antony tient le rythme).

Si OK : on prépare la cohorte Brevo 2 (15K premiers contacts) pour T+72h. Si pas OK : on traite, on reporte de 48h.

---

## T+72h : décision go/no-go ouverture Brevo

Critères d'élargissement aux 35K Brevo. Tous doivent être verts.

| Critère | Cible | Mesure |
|---|---|---|
| Bounce rate cumulé | < 1 % | SES dashboard 72h |
| Complaint rate cumulé | < 0,05 % | SES dashboard 72h |
| Conversion landing | > 1,5 % | requête `page_views` ci-dessus, fenêtre 72h |
| Sentry critical | 0 ouvert | filtre status:unresolved level:fatal |
| Webhook Stripe | 100 % success | Stripe Dashboard recent deliveries |
| Tickets support | < 30 tickets / 24h | bucket Antony |
| Refunds | < 5 % des achats | Stripe Dashboard refunds |

### Si GO

- Migration Brevo cohorte 2 : activer `SEQ_BRV` dans `/admin/sequences`.
- Importer 15 000 contacts via `node --env-file=.env.local scripts/migrate-from-email.mjs --batch-size 500` (à vérifier que ce script existe sous ce nom, sinon prendre le script Brevo équivalent dans `scripts/`).
- Surveiller pendant 24h supplémentaires les mêmes métriques.
- Si cohorte 2 tient, lancer cohorte 3 (20 000 restants) à T+96h.

### Si NO-GO

- Pas d'élargissement. On reste sur les 1900 alumni + acquisition organique.
- Identifier la cause racine, planifier un retry à J+7 si correctif déployé.

---

## Critères STOP détaillés (à coller sur le bureau)

Un seul critère STOP suffit pour déclencher la procédure. Pas de débat.

### Si bounce rate SES > 2 % (sur 1h glissante)

1. Aller dans Supabase SQL Editor, exécuter :
   ```sql
   SELECT cron.unschedule('process-sequences');
   SELECT cron.unschedule('retry-academy-welcome-mail');
   SELECT cron.unschedule('detect-behavioral-triggers');
   ```
   (Les noms exacts sont dans la migration 035 et suivantes, à vérifier avant.)
2. Investiguer la `ses_suppression_list` des 2 dernières heures : si beaucoup de hard bounces sur un seul domaine (ex. yahoo.fr), on a un problème reputation.
3. Pas de redémarrage des crons avant nettoyage et accord d'AWS si on a parlé à eux.

### Si Sentry > 10 erreurs serveur critiques / h

1. Identifier la route en erreur (webhook Stripe, checkout, cron, autre).
2. Rollback Vercel via Dashboard > Deployments > last working > "Promote to production".
3. Ne pas redéployer avant patch confirmé.

### Si SES sending state passe en Paused

1. AWS Support si plan Business, sinon ouvrir un ticket Trust & Safety.
2. Préparer un plan d'action (nettoyage liste, baisse cadence, identité de backup) à coller dans le ticket.
3. Bascule transactionnel critique (welcome paiement) sur l'identité backup `espatrimoine.fr` (voir INCIDENT_RUNBOOK section SES).

### Si webhook Stripe fail > 3 fois consécutives

1. Vérifier la signature : `STRIPE_WEBHOOK_SECRET` côté Vercel doit matcher le whsec de l'endpoint live.
2. Vérifier la table `processed_stripe_events` (migration 041) : compter les entrées de la dernière heure.
3. Replay manuel via Stripe Dashboard > event > "Resend".
4. Si ça persiste, désactiver temporairement le webhook côté Stripe et basculer sur la réconciliation manuelle (script à créer dans `scripts/reconcile-stripe-enrollments.mjs`, voir INCIDENT_RUNBOOK).

---

## Annexes

### Requêtes SQL prêtes à coller

Mettre dans un Notion partagé ou dans `docs/launch-queries.sql` (à créer manuellement, ce runbook ne touche pas au code).

### Liens prod (à garder en favoris)

- Academy : https://emeline-siron.fr
- Family : https://es-family.vercel.app
- Stripe Dashboard Live : https://dashboard.stripe.com
- Supabase Academy : https://supabase.com/dashboard/project/tvkzndkywznaysiqvmsh
- Supabase Family : https://supabase.com/dashboard/project/hpcoxtpdsydcrwdudhsk
- AWS SES eu-west-3 : https://eu-west-3.console.aws.amazon.com/sesv2
- Vercel Academy : https://vercel.com/es-academy/es-academy
- OneSignal : https://app.onesignal.com
- Sentry : https://sentry.io/organizations/es-academy/
- BetterStack : https://uptime.betterstack.com

### Contacts critiques

- AWS Support (si Business plan) : via console AWS support center.
- Stripe Support : `support@stripe.com`, ou chat 24/7 depuis le dashboard.
- Supabase Support (Pro plan) : `support@supabase.io`.
- OVH 24/7 : 1007 (numéro court FR) ou via espace client.

---

**Dernière mise à jour :** 2026-05-12.
