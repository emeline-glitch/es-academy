# INCIDENT_RUNBOOK : ES Academy + ES Family

Procédures de réponse aux pannes des dépendances externes. Une section par dépendance. Lis la section avant l'incident, pas pendant : tu n'as pas le temps en pleine crise.

- **Owner d'astreinte par défaut :** Emeline, joignable 9h-22h CET. Hors plage, Claude prend le relais pour le diagnostic technique.
- **Canal d'alerte :** WhatsApp équipe (Emeline, Antony, Tiffany, Fita) + email contact@emelinesiron.com.
- **Status page publique :** `status.emeline-siron.fr` (BetterStack, à activer si pas encore prêt).
- **Doctrine :** d'abord stopper la propagation (mode dégradé), ensuite diagnostiquer, ensuite communiquer aux clients, ensuite réparer. Dans cet ordre.

## Inventaire des dépendances critiques

| Dépendance | Criticité | Mode dégradé possible ? |
|---|---|---|
| Supabase Academy (DB + auth) | P0 | Lecture seule via cache CDN |
| Supabase Family (DB + auth) | P0 | iOS app version cachée |
| AWS SES (transactionnel) | P0 | Backup identity sur 2e domaine |
| Stripe (paiement) | P0 | Aucun, on coupe le checkout |
| Vercel Academy (host) | P0 | Aucun, c'est l'hôte |
| Vercel Family (host) | P1 | iOS cache + paywall reste up |
| Bunny.net (vidéos) | P1 | Bannière, accès cours partiel |
| Notion (blog + CMS cours) | P2 | Fallback statique, blog stale |
| OneSignal (push iOS) | P3 | Email fallback |
| Calendly (booking Antony) | P2 | Lien email manuel |
| OVH DNS | P0 | Aucun, racine du système |

P0 = stop the world. P1 = feature dégradée. P2 = inconvénient. P3 = invisible client.

---

## Supabase Academy down

### Symptômes

- 503 ou timeouts sur `/api/*` qui touchent la DB.
- Dashboard Supabase inaccessible ou affichage `Status: Degraded`.
- Sentry remonte beaucoup de `PostgresError: connection refused` ou `fetch failed`.
- Cron pg_cron qui ne tournent plus (BetterStack heartbeats `down`).

### Action immédiate (5 min)

1. Vérifier https://status.supabase.com. Si Supabase confirme un incident, c'est externe, on attend mais on bascule en mode dégradé.
2. Activer la bannière maintenance :
   ```
   Vercel > Project Academy > Settings > Environment Variables
   Ajouter : MAINTENANCE_MODE=true
   Redeploy : Vercel > Deployments > [latest] > Redeploy
   ```
   La bannière côté front lit cette variable et affiche "Maintenance en cours, on revient vite". Si la variable n'est pas encore câblée dans le layout (à vérifier dans `src/app/layout.tsx`), il faudra l'ajouter au préalable côté code.
3. Couper temporairement les CTA de checkout : remplacer `STRIPE_PRICE_ACADEMY_1X/3X/4X` côté Vercel par une valeur factice (`price_disabled`). Le checkout renverra une erreur claire au lieu de prendre un paiement sans pouvoir créer l'enrollment.
4. Communication : poster sur Instagram story "Petit incident technique, on revient vite, vos achats sont en sécurité" et envoyer un mail Brevo aux contacts récents (cohorte ayant acheté dans les 7 derniers jours).

### Mode dégradé

- Pages publiques Academy (landing, blog, masterclass) continuent de fonctionner si elles sont SSG (statiquement générées au build). Vérifier dans `next.config.ts` que les routes critiques marketing utilisent bien `export const dynamic = 'force-static'` ou un revalidate raisonnable.
- Dashboard élève, admin, checkout : HS le temps de la panne.
- Family iOS app continue de fonctionner sur les vidéos déjà cachées via Bunny CDN.

### Investigation

```bash
# Quel est l'état exact du projet ?
curl -sI https://tvkzndkywznaysiqvmsh.supabase.co/rest/v1/ \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# 200 = up. 5xx = down.

# Connexion direct Postgres
PGPASSWORD=$DB_PASSWORD psql -h db.tvkzndkywznaysiqvmsh.supabase.co \
  -U postgres -d postgres -c "SELECT 1;"
```

Si le projet est `Paused` par Supabase (oubli de paiement, dépassement quota), il suffit de cliquer **Restore** depuis le dashboard. Le restore peut prendre 5 à 15 min.

### Recovery

- Si l'incident est côté Supabase et résolu : retirer `MAINTENANCE_MODE`, redeploy Vercel, smoke tests, communication "tout est rentré dans l'ordre".
- Si corruption de données suspectée : utiliser **PITR** (Point-In-Time Recovery). Plan Pro requis. Procédure dans Supabase Dashboard > **Database > Backups > Point in time**. Choisir un timestamp 5-10 min avant l'incident.
- Si réplication broken (cas rare en Pro) : escalader support@supabase.io en priority avec ticket Pro.

### Post-mortem

Rédiger dans `docs/incidents/YYYY-MM-DD-supabase.md` :
- Timeline en UTC.
- Impact mesuré (paiements perdus, mails non envoyés, utilisateurs bloqués).
- Cause racine si connue.
- Actions de prévention (alertes, monitoring, redondance).

---

## Supabase Family down

Même symptômes que Academy, mais cantonnés à l'app iOS / web Family.

### Action immédiate

1. Activer bannière sur `/family` côté Academy (paywall) : `MAINTENANCE_MODE_FAMILY=true` dans Vercel Academy env vars.
2. Côté iOS app : version cachée continue de servir les vidéos déjà téléchargées. Les abonnés ne voient pas la panne tout de suite.
3. Bloquer les nouveaux abonnements via le webhook Stripe Family : Stripe Dashboard > Webhook Family > **Disable**. Les paiements existants continuent, mais pas de nouveau founder_500.

### Mode dégradé

- iOS app : OK pour les abonnés existants si contenu en cache.
- Web `/family` côté Academy : affiche bannière, pas de checkout.
- Push notifications via OneSignal : continuent à fonctionner, on n'est pas dépendants de Supabase Family pour ça.

Le reste de la procédure est symétrique à Supabase Academy.

---

## AWS SES suspendu (reputation)

C'est le scénario qui fait le plus mal. La sortie est lente.

### Symptômes

- Email `email-feedback@amazonses.com` arrivé dans `contact@emelinesiron.com` ou `emeline@emeline-siron.fr`.
- AWS SES Console > **Reputation dashboard** : `Status: Under review` ou `At risk`.
- AWS SES Console > **Sending statistics** : `SendingEnabled: false` ou `Paused`.
- Sentry remonte des erreurs côté `@aws-sdk/client-sesv2` : `MessageRejected: ... sending pool paused`.

### Action immédiate (10 min)

1. **Freeze tous les crons d'envoi** dans Supabase SQL Editor Academy :
   ```sql
   SELECT cron.unschedule('process-sequences');
   SELECT cron.unschedule('retry-academy-welcome-mail');
   SELECT cron.unschedule('detect-behavioral-triggers');
   SELECT cron.unschedule('chatel-reminders');
   -- Vérifier les noms exacts avant : SELECT jobname FROM cron.job;
   ```
2. Toute écriture dans la queue d'envoi (table `email_outbox` ou similaire si on en a une, sinon `email_sequence_enrollments`) est mise en pause de fait.
3. Désactiver le webhook SNS bounces/complaints le temps de la mitigation, sinon il va spammer notre table `processed_sns_messages` (migration 047).

### Investigation (30-60 min)

Identifier la source du problème de réputation :

```sql
-- Quelles adresses ont bouncé / spammé dans les 24h ?
SELECT bounce_type, count(*), array_agg(email ORDER BY added_at DESC) AS sample
FROM ses_suppression_list
WHERE added_at > now() - interval '24 hours'
GROUP BY bounce_type
ORDER BY count(*) DESC;

-- Lesquelles ont reçu des mails dans la dernière séquence ?
SELECT s.slug, count(*)
FROM email_sequence_enrollments e
JOIN email_sequences s ON s.id = e.sequence_id
WHERE e.started_at > now() - interval '7 days'
GROUP BY s.slug
ORDER BY count(*) DESC;
```

Vérifier la `ses_suppression_list` : si on a une explosion de hard bounces sur un domaine (yahoo.fr, hotmail.com), c'est un problème de qualité de liste. Si on a une explosion de complaints, c'est un problème de contenu ou de fréquence.

### Mitigation

1. **Nettoyer la liste** : exécuter le script de purge des adresses non engagées :
   ```bash
   cd ~/es-academy && node --env-file=.env.local scripts/audit-from-emails.mjs --since 2026-03-01 --inactive --dry-run
   # puis sans --dry-run après revue
   ```
2. **Écrire à AWS Trust & Safety** : depuis AWS Support Center, ouvrir un ticket dans la catégorie "Account & billing > Sending limits / reputation". Coller :
   - Combien de mails envoyés sur 30 jours.
   - Liste des sources de contacts (alumni Evermind opt-in, formulaires double opt-in côté Academy).
   - Procédures de gestion des bounces (suppression list automatique via SNS migration 005, 047).
   - Lien vers la politique de confidentialité.
   - Plan d'action correctif (purge inactifs, baisse cadence, double opt-in renforcé).
3. **Baisse cadence** : si on est autorisés à reprendre, redémarrer les crons à fréquence réduite (1 fois par heure au lieu de toutes les 5 min) pendant 7 jours pour reconstruire la réputation.

### Backup plan : identité SES de secours

On garde une identité SES préparée sur un autre domaine pour le **transactionnel critique uniquement** (welcome paiement, magic link). Pas pour les sequences marketing.

- Domaine prévu : `espatrimoine.fr` (à vérifier qu'il est verified dans SES avant le lancement).
- Switch : changer `SES_FROM_EMAIL=emeline@espatrimoine.fr` côté Vercel Academy env vars, redeploy.
- Conséquence : les mails arrivent depuis un domaine différent. Risque de spam plus élevé tant que la réputation espatrimoine.fr n'est pas faite. À n'utiliser qu'en dernier recours pour les mails post-paiement.
- Critère de retour sur `emeline-siron.fr` : reputation `Healthy` sur 7 jours consécutifs.

### Recovery

- Reprise progressive : 100 mails / jour pendant 3 jours, puis 1000, puis full.
- Suivi quotidien du reputation dashboard.
- Post-mortem dans `docs/incidents/YYYY-MM-DD-ses.md` avec actions long terme (warmup automatique, A/B contenu, etc.).

---

## Stripe webhook down ou retry storm

Pas de paiement perdu (Stripe garantit la livraison), mais on peut avoir des enrollments retardés ou des doublons si on n'est pas idempotent.

### Symptômes

- Stripe Dashboard > **Developers > Webhooks > [endpoint]** : taux d'échec > 0 %.
- Sentry remonte des erreurs côté `/api/stripe/webhook`.
- Clients qui paient mais ne reçoivent pas leur accès cours (vérifier `enrollments` table).
- Antony reçoit des tickets "j'ai payé mais je n'ai rien".

### Action immédiate (10 min)

1. Stripe Dashboard > Webhooks > endpoint Academy > **Recent deliveries**. Filtrer sur `Failed`. Noter le `evt_id` du premier et du dernier failed.
2. Lire le response body du failed delivery : c'est la réponse de notre endpoint. Probablement un 500 avec un message d'erreur. Copier le message.
3. Cross-référence avec Sentry : chercher le même message d'erreur dans Sentry Issues.

### Replay

Une fois la cause identifiée et patchée :

```bash
# Via Stripe CLI (préféré pour batch)
stripe events resend evt_xxx
# Ou plusieurs d'un coup :
for evt in evt_aaa evt_bbb evt_ccc; do
  stripe events resend $evt
done
```

Ou via Dashboard : event > "Resend".

Note : on est idempotent grâce à la table `processed_stripe_events` (migration 041). Replay sans risque de doublon.

### Réconciliation manuelle

Si beaucoup d'events failed et qu'on ne veut pas replay un par un :

```bash
# Lister les sessions Stripe payées dans la dernière heure côté Stripe API
# Croiser avec enrollments Supabase
# Recréer les enrollments manquants
node --env-file=.env.local scripts/reconcile-stripe-enrollments.mjs --since "2026-05-12T10:00:00Z"
```

**Important :** ce script n'existe pas encore au moment où ce runbook est rédigé. À créer si pas existant. Squelette attendu :

1. Lire `STRIPE_SECRET_KEY`.
2. Lister `stripe.checkout.sessions.list({ created: { gte: since }, status: 'complete' })`.
3. Pour chaque session, vérifier si `enrollments.stripe_session_id` existe.
4. Si manquant, simuler la logique du webhook : créer le contact, créer l'enrollment, déclencher le mail de bienvenue, créer le coupon Family.
5. Logger chaque réconciliation dans `audit_log`.

Tant que le script n'existe pas, on fait à la main :
- Stripe Dashboard > Payments > [paiement orphelin] > Customer
- Supabase SQL Editor Academy : `INSERT INTO contacts ... ON CONFLICT DO NOTHING`, puis `INSERT INTO enrollments ...`.
- Renvoyer le mail de bienvenue via `/admin/eleves/[userId] > Renvoyer mail`.

### Cas particulier : signature invalide

Si le response body indique `Webhook signature verification failed`, c'est que `STRIPE_WEBHOOK_SECRET` côté Vercel ne matche pas le whsec de l'endpoint. Ça arrive si on a régénéré l'endpoint ou si on a confondu test et live.

Fix :
1. Dashboard > Webhooks > endpoint > **Reveal signing secret**.
2. Coller dans Vercel env vars `STRIPE_WEBHOOK_SECRET`, redeploy.

---

## Notion API rate limited

Notion limite à 3 req/s par intégration. On peut taper le mur si on régénère trop souvent le blog ou les pages cours.

### Symptômes

- Erreurs 429 dans Sentry sur les routes `/api/admin/...` ou les pages `/blog/...`.
- Blog stale : les articles publiés dans Notion ne remontent pas sur le site pendant plus de 30 min.
- Logs Vercel : `NotionAPIError: rate_limited`.

### Action immédiate

1. Le circuit breaker côté `src/lib/notion/client.ts` doit kick in et basculer sur le cache statique. Vérifier que c'est bien le cas en ouvrant le blog en navigation privée : si le contenu d'hier s'affiche, le fallback marche.
2. Si le circuit breaker n'est pas implémenté (à vérifier dans le code), il faut le considérer comme un défaut technique à fixer post-incident.

### Mode dégradé

- Blog : sert le dernier snapshot statique (revalidate ISR Next.js).
- Cours : les leçons sont précalculées au build, pas d'impact tant qu'on ne touche pas Notion en runtime.
- Admin Notion edit : impossible pendant la rate limit, attendre.

### Recovery

- Attendre 15 min minimum.
- Vérifier dans `/api/admin/notion-status` (endpoint à créer si pas existant, sinon checker manuellement) que les calls reprennent.
- Si rate limit persistant, c'est qu'un script ou un cron pulse trop : checker `scripts/list-notion-blog.mjs`, `scripts/refresh-stale-articles.mjs`, `scripts/notion-create-lesson.mjs` et leur fréquence d'appel.

### Prévention

- Le polling Notion vers blog doit être ≤ 1 appel toutes les 5 min en prod.
- Cache CDN long sur les pages blog (s-maxage 3600 mini).
- Pour les seed scripts massifs, ajouter `await new Promise(r => setTimeout(r, 350))` entre chaque page pour rester sous 3 req/s.

---

## Bunny.net down

Le CDN vidéo. Si Bunny tombe, les cours et les vidéos Family ne chargent pas.

### Symptômes

- Player vidéo qui spinne indéfiniment sur `/cours/[...]`.
- Erreurs 502 ou 403 sur les URLs `*.b-cdn.net`.
- Status page Bunny : https://status.bunny.net en orange/rouge.

### Action immédiate

1. Activer une bannière sur `/cours/[...]` : "Vidéos en maintenance, on revient vite. Tes notes et ressources PDF restent accessibles."
2. La bannière peut être activée via Vercel env var `BUNNY_MAINTENANCE_MODE=true` (à câbler côté layout cours si pas déjà fait).
3. Communication aux abonnés actifs (via mail batch sur enrollments actifs) seulement si l'incident dépasse 2h.

### Mode dégradé

- PDF ressources : continuent de charger (servis depuis Supabase Storage ou Drive).
- Notes prises par l'élève : accessibles dans `/dashboard > Mon cours > Notes`.
- Family iOS : les vidéos déjà téléchargées en cache local continuent de fonctionner.

### Backup plan : Vimeo paid

On garde une copie des 10 vidéos cours critiques sur Vimeo paid (compte `vimeo.com/esacademy`).

- Bascule manuelle : éditer la page cours dans Notion, remplacer `Video_ID` Bunny par `Video_ID` Vimeo + champ `Video_Provider=vimeo`.
- Le composant lecteur doit supporter les deux (à vérifier dans `src/components/video-player.tsx` ou équivalent).
- Si le composant ne supporte pas Vimeo, ce backup plan ne marche pas pour les abonnés Family. À évaluer en post-mortem.

### Recovery

- Quand Bunny revient, retirer la bannière, redeploy si nécessaire.
- Pas besoin de remettre les Video_ID à zéro si on a basculé Vimeo : ils continuent de fonctionner.

---

## Vercel deployment cassé

Build qui passe en local mais qui échoue ou qui sert un 500 en prod après push.

### Symptômes

- Vercel Dashboard > Deployments > dernier deploy en `Error` ou `Failed`.
- Ou deploy en `Ready` mais 500 sur les pages.
- Sentry remonte des erreurs côté serveur immédiatement après le déploiement.

### Action immédiate (2 min)

1. Vercel Dashboard > **Deployments**.
2. Identifier le dernier deploy qui était `Ready` et qui marchait (taggé en vert).
3. Clic sur ce deploy > **... menu > Promote to Production**.
4. Confirmer. La promotion est instantanée (alias change).

### Pas de redeploy avant fix

- Ne pas merger d'autre code sur `main` tant que le fix n'est pas prêt.
- Pas de `vercel --prod` à la main.
- Travailler sur une branche `hotfix/...`, ouvrir un preview Vercel, valider via smoke test, puis merger.

### Diagnostic

- Si build fail : lire les logs Vercel Build. Souvent un type TypeScript cassé ou une env var manquante.
- Si build OK mais runtime fail : Vercel Logs Runtime, filtrer sur l'URL en erreur.
- Si timeout edge function : la route est trop lourde, à découper.

---

## Vercel down (incident plateforme)

Rare, mais peut arriver.

### Symptômes

- https://vercel-status.com en orange / rouge.
- Le site `emeline-siron.fr` ne répond pas, 503 sur tous les endpoints.
- Aucun déploiement possible.

### Action immédiate

1. Attendre. On ne peut rien faire.
2. Communication : tweet / Instagram story "Notre hébergeur Vercel a un incident, on revient vite. Tous les achats et données sont en sécurité."
3. Boîte mail `contact@` redirigée vers Gmail (pas hébergée chez Vercel), donc Antony peut répondre.

### Pas de plan B sérieux

Migrer sur Netlify ou un autre host en moins d'une journée n'est pas réaliste. On accepte la dépendance Vercel comme un risque connu.

---

## Domaine DNS perdu (OVH expiration ou hack)

C'est le scénario catastrophe. Si le domaine `emeline-siron.fr` ne résout plus, plus rien ne marche.

### Symptômes

- `dig emeline-siron.fr` retourne `NXDOMAIN` ou un autre IP que ceux de Vercel.
- Mail bounce avec `domain not found`.
- Clients qui appellent ou écrivent en panique.

### Action immédiate (1h max, doit être rapide)

1. **Appeler OVH support 24/7 : 1007** (numéro court FR depuis mobile FR). Si à l'étranger : +33 9 72 10 10 07.
2. Backup d'accès : noter les identifiants OVH du compte propriétaire (NIC handle) sur un papier, dans un coffre-fort physique, et dans 1Password équipe.
3. Vérifier le statut du domaine : OVH Manager > Web > Domaines > emeline-siron.fr. Si `Expired`, payer immédiatement le renouvellement. Si `Hacked` (transfer en cours sans accord), demander OVH de **rejeter le transfer** et de placer le domaine en `clientTransferProhibited`.
4. Vérifier les autres domaines : `es-academy.fr`, `espatrimoine.fr`, et tout autre domaine de l'écosystème. Tous chez OVH ? Tous à jour de renouvellement ?

### Backup : noter le mot de passe registrar à part

- Identifiants OVH NIC (id + mdp + 2FA backup codes) : copie dans 1Password (coffre `Holdem Admin`) + copie papier dans le coffre-fort.
- Email de récupération OVH : ne pas mettre `emeline@emeline-siron.fr` (paradoxe : si le domaine tombe, le mail de récup tombe aussi). Utiliser un Gmail perso ou un mail Holdem qui n'est pas sur ce domaine.
- 2FA OVH : Yubikey physique ou app TOTP, pas SMS (vulnérable au SIM swap).

### Mode dégradé

Aucun. Le domaine est la racine, sans lui rien ne marche.

### Recovery

- Si renouvellement : DNS revient en moins de 6h après paiement.
- Si transfer abusif : OVH peut bloquer en 48h, restauration complète en 5-10 jours.
- Si compromis OVH : changer le mdp, révoquer les sessions, activer 2FA hardware.

### Prévention

- Renouvellement automatique activé sur OVH.
- Mail de notif renouvellement envoyé 30j avant à 2 adresses différentes.
- Audit annuel des domaines (date d'expiration, owner, DNS records).

---

## OneSignal down (push iOS)

P3, on ne perd personne, on perd juste un canal.

### Symptômes

- OneSignal Dashboard inaccessible ou erreurs sur l'API.
- Pushes envoyés depuis l'admin ne partent pas.

### Action immédiate

1. Status : https://status.onesignal.com
2. Pas de bannière nécessaire, l'app continue de marcher.
3. Si la com est urgente, basculer sur email (mailer SES via une séquence ad hoc).

### Recovery

- Quand OneSignal revient, les pushes en queue partent automatiquement (sur leur backend).

---

## Calendly down

P2. Antony reçoit moins de RDV.

### Symptômes

- calendly.com en panne, ou les pages embed ne chargent pas dans `/coaching`.

### Action immédiate

1. Bannière sur `/coaching` : "Réservation par mail temporairement, écris à contact@emelinesiron.com".
2. Antony répond manuellement aux demandes pour fixer un RDV par téléphone.

### Recovery

- Calendly revient en général dans l'heure. Pas de plan B nécessaire.

---

## Cron pg_cron Supabase qui ne tournent plus

Sympôme silencieux mais grave : pas de séquence envoyée, pas de retry welcome mail, etc.

### Symptômes

- BetterStack heartbeat `cron-process-sequences` `down` depuis > 30 min.
- audit_log ne reçoit plus de lignes côté `cron_*`.
- Clients qui n'ont pas reçu leur mail de bienvenue 30 min après leur achat.

### Action immédiate

```sql
-- Vérifier l'état des crons
SELECT jobname, schedule, active, last_run_started_at, last_run_completed_at, last_run_status
FROM cron.job;

-- Si un job est `active=false` :
SELECT cron.alter_job(jobid := <id>, active := true);

-- Si un job tourne mais échoue silencieusement :
SELECT * FROM cron.job_run_details
WHERE jobid = <id>
ORDER BY start_time DESC LIMIT 10;
```

### Diagnostic

- Si `last_run_status = 'failed'` : lire le `return_message`. C'est en général un secret manquant (`CRON_SECRET` rotaté côté Vercel mais pas dans Supabase Vault) ou un endpoint qui répond 401.
- Si pas de run du tout : le job a peut-être été désactivé manuellement (par exemple lors d'un STOP launch). Vérifier `audit_log` pour `cron.unschedule(...)` récents.

### Recovery

- Réactiver les crons un par un, en commençant par `process-sequences` (le plus critique).
- Vérifier dans `/admin/dashboard` que les enrollments avancent.

---

## Annexes

### Template de communication client (incident long)

```
Objet : Petit incident technique, on est dessus

Salut [prénom],

On a un souci technique côté [SES / Supabase / autre] depuis [heure]. Concrètement, ça veut dire que tu pourrais avoir reçu ton mail de bienvenue en retard, ou pas du tout.

Tes données sont en sécurité, ton achat est validé. On répare et on te tient informé.

Si tu as besoin de quoi que ce soit, réponds directement à ce mail, Antony est sur le pont.

Emeline
```

Pas d'em dash, tutoiement, signature Emeline. Max 1 émoji si tu veux humaniser, jamais plus.

### Template post-mortem

À écrire dans `docs/incidents/YYYY-MM-DD-<keyword>.md` dans la semaine suivant l'incident :

```markdown
# Incident YYYY-MM-DD : <titre court>

## Timeline (UTC)
- HH:MM : symptôme observé
- HH:MM : alerte reçue
- HH:MM : début intervention
- HH:MM : mitigation déployée
- HH:MM : résolution complète

## Impact
- Nombre d'utilisateurs affectés
- Paiements perdus / dégradés
- Mails non envoyés
- Tickets support reçus

## Cause racine
Explication technique, sans blâme. Le système doit être responsable, pas les humains.

## Ce qui a bien fonctionné
Détection, mitigation, communication.

## Ce qui doit s'améliorer
Concret, actionnable, avec un owner et une deadline.

## Actions de suivi
- [ ] Action 1 (owner, deadline)
- [ ] Action 2 (owner, deadline)
```

---

**Dernière mise à jour :** 2026-05-12.
