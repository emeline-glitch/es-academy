# MONITORING : ES Academy + ES Family

Ce qu'on surveille, comment, où, et avec quelles alertes. Si une métrique critique ne déclenche pas d'alerte, elle n'est pas surveillée, elle est espérée.

- **Stack observabilité :** Sentry (erreurs front + back), BetterStack Uptime (heartbeats + status page), BetterStack Logs (ou Logtail) (logs structurés Vercel), Supabase Logs (Postgres + cron), AWS CloudWatch (SES + Lambda si applicable), Stripe Dashboard (paiements + webhooks), Vercel Analytics (web vitals).
- **Cible SLO globale :** 99,5 % disponibilité sur les routes critiques de paiement. Reste du site : best effort.

## Définitions

| Terme | Définition |
|---|---|
| **SLI** | Service Level Indicator : une mesure (ex. p95 latence checkout) |
| **SLO** | Service Level Objective : une cible sur le SLI (ex. p95 < 800ms) |
| **Error budget** | (1 - SLO) sur la période : combien d'erreurs on peut "se permettre" |
| **Alerte P1** | Réveille Emeline 24/7 |
| **Alerte P2** | Notification Slack/WhatsApp, traitée en heure de bureau |
| **Alerte P3** | Email digest quotidien, traitée en hebdo |

## Routes critiques (à protéger en priorité)

Si l'une de ces routes casse, on perd du chiffre direct.

| Route | Type | SLO disponibilité | SLO latence p95 |
|---|---|---|---|
| `/academy` | Landing | 99,9 % | < 1500ms |
| `/family` | Landing | 99,9 % | < 1500ms |
| `/api/stripe/checkout` | API | 99,5 % | < 1000ms |
| `/api/stripe/checkout-family` | API | 99,5 % | < 1000ms |
| `/api/stripe/webhook` | API | 99,9 % | < 2000ms |
| `/dashboard` | App | 99 % | < 2000ms |
| `/cours/[slug]` | App | 99 % | < 2500ms |
| `/api/contacts` (POST) | API | 99,5 % | < 800ms |
| `/api/forms/[slug]/submit` | API | 99,5 % | < 800ms |

Les autres routes (admin, blog, ressources) sont best effort.

---

## Sentry

### Configuration

- 2 projets : `es-academy` (Next.js) et `es-family` (Next.js + Capacitor iOS).
- DSN configurés via env vars `SENTRY_DSN` (back) et `NEXT_PUBLIC_SENTRY_DSN` (front).
- Release tagging : intégration Vercel > Sentry doit créer une release à chaque deploy.
- Sourcemaps : uploadées au build.
- Sample rate : 100 % erreurs, 10 % performance.

### Règles d'alerte (5 minimum)

1. **P1, Webhook Stripe en erreur** : tag `transaction:/api/stripe/webhook`, level `error`, condition `count() > 0 in 5 minutes`. Notif : SMS Emeline + WhatsApp groupe.
2. **P1, Erreur fatale globale** : level `fatal`, environment `production`, condition `count() > 0 in 1 minute`. Notif : SMS Emeline.
3. **P2, Pic d'erreurs** : level `error`, environment `production`, condition `count() > 20 in 10 minutes`. Notif : WhatsApp + email.
4. **P2, Nouveau type d'erreur** : `is_new`, environment `production`. Notif : WhatsApp.
5. **P3, Erreurs front user-facing** : level `warning` ou `error` côté navigateur, condition `count() > 50 in 1 hour`. Notif : digest mail quotidien.

### Triage quotidien

Procédure dans `OPERATIONS_RUNBOOK.md` section "Sentry triage". Règle : aucune erreur P1 ne reste `Unresolved` plus de 24h.

### Erreurs à ignorer

- `AbortError: The user aborted a request` côté front : utilisateur a fermé l'onglet, pas un bug.
- `ResizeObserver loop limit exceeded` : noise Chrome, pas un bug.
- `Webhook signature verification failed` côté Stripe : tentative d'appel webhook depuis source non Stripe (curl, scan). Loguer en info, pas en error.

---

## BetterStack Uptime

### Heartbeats (crons doivent ping toutes les N minutes)

Chaque cron pg_cron Supabase doit faire un `curl https://uptime.betterstack.com/api/v1/heartbeat/<token>` en fin d'exécution. Si BetterStack ne reçoit pas le ping dans l'intervalle attendu, alerte.

| Heartbeat | Cron source | Intervalle attendu | Grace period |
|---|---|---|---|
| `cron-process-sequences` | Supabase pg_cron + `/api/cron/process-sequences` | 5 min | 10 min |
| `cron-chatel-reminders` | `/api/cron/chatel-reminders` | 1h | 90 min |
| `cron-retry-welcome-mail` | `/api/cron/retry-academy-welcome-mail` | 10 min | 20 min |
| `cron-detect-triggers` | `/api/cron/detect-behavioral-triggers` | 15 min | 30 min |
| `cron-seasonal-toggle` | `/api/cron/seasonal-toggle` | 1h | 90 min |
| `cron-seo-audit` | `/api/cron/seo-audit` | 24h | 48h |
| `cron-seo-pagespeed` | `/api/cron/seo-pagespeed-audit` | 24h | 48h |
| `cron-sync-ses-suppression` | `/api/cron/sync-ses-suppression` | 1h | 90 min |

Si le call HTTP au heartbeat n'est pas câblé dans le code des routes cron, c'est un défaut à corriger (chacune doit terminer par `await fetch(BETTERSTACK_HEARTBEAT_URL)`).

### Monitors HTTP

Surveiller les routes critiques toutes les 1-5 min, depuis 3 régions différentes pour éviter les faux positifs réseau.

| Monitor | URL | Fréquence | Régions | Alerte si |
|---|---|---|---|---|
| `academy-homepage` | https://emeline-siron.fr | 5 min | EU + US + AP | down 10 min |
| `academy-landing` | https://emeline-siron.fr/academy | 5 min | EU + US | down 10 min |
| `family-homepage` | https://es-family.vercel.app | 5 min | EU + US | down 10 min |
| `family-landing` | https://emeline-siron.fr/family | 5 min | EU + US | down 10 min |
| `stripe-webhook-health` | https://emeline-siron.fr/api/stripe/webhook | 5 min, POST avec body invalide, attendre 400 | EU | down 15 min |
| `supabase-academy` | https://tvkzndkywznaysiqvmsh.supabase.co/rest/v1/ + apikey | 5 min | EU | 5xx 10 min |
| `supabase-family` | https://hpcoxtpdsydcrwdudhsk.supabase.co/rest/v1/ + apikey | 5 min | EU | 5xx 10 min |

### Status page publique

- URL : https://status.emeline-siron.fr (à configurer si pas encore prêt).
- Composants affichés : Site Academy, Site Family, Paiements, Mailing, Vidéos.
- Incidents : créés automatiquement quand un monitor passe down > 10 min. Editables manuellement pour ajouter contexte.

---

## Logs (Vercel + Supabase)

### Vercel Logs

- Tier : Pro plan recommandé pour rétention 7 jours + filtres avancés.
- Intégration BetterStack Logs (ou Logtail) : forward des logs en temps réel pour requêtes longues.
- Champs structurés à logger côté code :
  - `request_id` : UUID par requête (généré middleware).
  - `user_id` : si authentifié.
  - `event` : nom logique (par ex. `stripe_webhook_received`, `enrollment_created`, `mail_sent`).
  - `latency_ms` : pour les routes critiques.

### Supabase Postgres logs

- Onglet Supabase Dashboard > Logs > Postgres logs.
- Filtres à garder en favoris :
  - `severity: ERROR`
  - `query: "DELETE FROM contacts"` (pour audit des suppressions)
  - `event_message: "RLS"` (violations RLS)

### Supabase Cron logs

- Onglet Database > Cron Jobs > [job] > Recent runs.
- Vérifier les exit codes : 0 = OK, autre = échec.
- Pour audit en lot :
  ```sql
  SELECT jobname, status, return_message, start_time, end_time
  FROM cron.job_run_details
  JOIN cron.job USING (jobid)
  WHERE start_time > now() - interval '24 hours'
    AND status = 'failed'
  ORDER BY start_time DESC;
  ```

### audit_log (table applicative)

Notre table custom (migration 005 et suivantes) trace les events business critiques :

- `welcome_mail_sent`, `welcome_mail_failed`, `welcome_mail_giveup`
- `stripe_session_created`, `stripe_webhook_received`, `enrollment_created`, `enrollment_failed`
- `sequence_step_sent`, `sequence_step_skipped`, `sequence_completed`
- `unsubscribe`, `consent_given`, `consent_withdrawn`
- `admin_login`, `admin_action`

Conserver 90 jours. Cron de purge `prune_audit_log` (migration 005) tourne quotidien.

---

## Métriques business (à brancher)

Au-delà des erreurs, surveiller la santé business :

### Cohorte de paiement

```sql
-- Achats par jour, 14 derniers jours
SELECT
  date_trunc('day', created_at) as jour,
  count(*) FILTER (WHERE product = 'academy') as academy,
  count(*) FILTER (WHERE product = 'family') as family,
  sum(amount_cents)/100.0 FILTER (WHERE product = 'academy') as ca_academy,
  sum(amount_cents)/100.0 FILTER (WHERE product = 'family') as ca_family
FROM enrollments
WHERE created_at > now() - interval '14 days'
GROUP BY jour
ORDER BY jour DESC;
```

### Funnel landing → achat

```sql
-- Conversion landing /academy → /merci sur 7 jours
WITH landing AS (
  SELECT count(DISTINCT session_id) as visits
  FROM page_views
  WHERE path = '/academy' AND created_at > now() - interval '7 days'
),
merci AS (
  SELECT count(DISTINCT session_id) as conversions
  FROM page_views
  WHERE path = '/merci' AND created_at > now() - interval '7 days'
)
SELECT
  landing.visits, merci.conversions,
  round(100.0 * merci.conversions / NULLIF(landing.visits, 0), 2) as taux_pct
FROM landing CROSS JOIN merci;
```

### Engagement séquences mail

```sql
-- Taux d'ouverture par séquence
SELECT
  s.slug,
  count(*) FILTER (WHERE e.opened_at IS NOT NULL) * 100.0 / NULLIF(count(*), 0) as open_rate_pct,
  count(*) FILTER (WHERE e.clicked_at IS NOT NULL) * 100.0 / NULLIF(count(*), 0) as click_rate_pct,
  count(*) as total_envois
FROM email_step_events e
JOIN email_sequences s ON s.id = e.sequence_id
WHERE e.sent_at > now() - interval '30 days'
GROUP BY s.slug
ORDER BY total_envois DESC;
```

(NB : la table `email_step_events` est à vérifier dans le schéma, le nom exact peut varier selon la migration de tracking. Voir `src/lib/email/tracking.ts`.)

### Churn Family

```sql
-- Abonnés Family qui ont annulé dans les 30 derniers jours
SELECT count(*)
FROM family_subscriptions
WHERE canceled_at > now() - interval '30 days'
  AND canceled_at >= started_at + interval '7 days';  -- exclut les annulations dans la période de réflexion légale
```

Ces métriques sont à brancher dans un dashboard (Metabase, Retool, ou simple page Next côté `/admin/analytics`). Aujourd'hui elles sont en SQL ad hoc.

---

## Alertes consolidées

### P1 (réveille Emeline)

- Webhook Stripe en erreur (Sentry).
- Erreur fatale globale (Sentry).
- Site Academy down > 10 min (BetterStack).
- Supabase Academy 5xx > 10 min (BetterStack).
- SES sending state passé en Paused (CloudWatch alarm, à configurer).
- DNS emeline-siron.fr ne résout plus (BetterStack monitor DNS).

### P2 (heure de bureau)

- Bounce rate SES > 2 % sur 1h (CloudWatch alarm).
- Complaint rate SES > 0,1 % sur 24h.
- Pic d'erreurs Sentry (> 20 / 10 min).
- Nouveau type d'erreur Sentry.
- Heartbeat cron `down` > grace period.
- Site Family down > 30 min.

### P3 (digest hebdo)

- Erreurs front utilisateur agrégées.
- Tickets support volumétrie inhabituelle.
- Performance régressée sur p95 (à configurer).

---

## Web vitals et performance front

### Vercel Analytics

Onglet Vercel > Project Academy > Analytics. Suivre :
- LCP (Largest Contentful Paint) : cible < 2.5s mobile.
- FID/INP (Interaction to Next Paint) : cible < 200ms.
- CLS (Cumulative Layout Shift) : cible < 0.1.

Si un release dégrade un de ces metrics de > 20 % vs baseline, alerte P3.

### Google Search Console

- Soumettre sitemap.xml.
- Surveiller Core Web Vitals report.
- Errors crawl : à régler dans la semaine.

---

## Annexes

### Configurer un nouveau monitor BetterStack

1. Connect : ouvrir https://uptime.betterstack.com.
2. **Monitors > New monitor**.
3. URL, fréquence, régions.
4. Alert escalation : créer une "on call rotation" Emeline > Claude.
5. Channel : WhatsApp pour P1, email pour P2/P3.

### Configurer une règle Sentry

1. Ouvrir Sentry > project > **Alerts > Create Alert**.
2. Issue Alert (pour les erreurs nouvelles ou récurrentes) vs Metric Alert (pour les seuils).
3. Conditions, filtres, actions (notif).
4. Tester avec un event volontaire avant de save.

### Coupler CloudWatch à Slack/WhatsApp

- AWS SNS topic dédié `alerts-prod`.
- CloudWatch alarms publient sur ce topic.
- SNS HTTP subscription vers un webhook (n8n, Pipedream, ou direct WhatsApp Business API si on a accès).
- Tester avec une alarme volontaire (puis désactiver).

---

**Dernière mise à jour :** 2026-05-12.
