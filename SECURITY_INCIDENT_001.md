# SECURITY INCIDENT 001 : CRON_SECRET en clair dans l'historique git

**Date détection** : 2026-05-12 (audit AUDIT_STRESS_TEST.md section 5.1)
**Sévérité** : Moyenne (DoS / spam-trigger possible, pas d'accès données)
**Statut** : Rotation effectuée (migration 046_rotate_cron_secret.sql)

## Résumé

Le CRON_SECRET utilisé pour authentifier les endpoints `/api/cron/*`
était embarqué en clair dans 4 migrations SQL committées :

- `supabase/migrations/023_pg_cron_setup.sql`
- `supabase/migrations/027_welcome_mail_retry.sql`
- `supabase/migrations/035_seasonal_toggle_cron.sql`
- `supabase/migrations/045_seo_pg_cron_jobs.sql`

Le secret est donc présent dans :

1. L'historique git (toutes les branches qui contiennent ces commits)
2. La table `cron.job` côté DB (colonne `command`)
3. Les fichiers SQL sur disque local et clones

## Vecteur de risque

Un attaquant disposant de l'ancien secret peut :

- Spam-trigger `/api/cron/process-sequences` : déclenche des envois SES anticipés
- Spam-trigger `/api/cron/chatel-reminders` : envoie des rappels en boucle
- Spam-trigger `/api/cron/retry-academy-welcome-mail` : pousse SES en saturation
- Spam-trigger `/api/cron/seo-pagespeed-audit` : timeout 540s, DoS sur PageSpeed quota

Pas d'accès direct aux données : les endpoints ne renvoient pas de PII.
Le webhook Stripe n'est pas concerné (signature Stripe distincte).

## Rotation effectuée

1. **Nouveau secret généré par Emeline** (hors repo, hors logs)
2. **Stocké dans 2 emplacements** :
   - Vercel env vars (production + preview) sous le nom `CRON_SECRET`
   - Supabase Vault sous le nom `cron_secret` (à insérer manuellement via SQL Editor)
3. **Migration 046_rotate_cron_secret.sql** :
   - Active l'extension `supabase_vault`
   - Unschedule les 7 jobs existants
   - Re-schedule chaque job en lisant le secret via `vault.decrypted_secrets`
   - Ajoute le cron manquant `es-academy-cleanup-audit-log` (purge RGPD audit_log > 90j)
4. **Endpoints Next.js** : déjà en comparaison stricte `process.env.CRON_SECRET`, pas de patch code requis.

## Procédure de bascule (à exécuter par Emeline)

```sql
-- 1. Dans Supabase SQL Editor (prod), avant d'appliquer la migration 046 :
SELECT vault.create_secret(
  '<NOUVEAU_SECRET_CRON>',
  'cron_secret',
  'CRON_SECRET pour authentification des jobs pg_cron via /api/cron/*'
);

-- 2. Push migration 046 via ./scripts/apply-migration.sh ou supabase db push

-- 3. Vérifier que les jobs sont OK :
SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'es-academy-%';

-- 4. Forcer un test manuel pour valider :
SELECT net.http_post(
  url := 'https://emeline-siron.fr/api/cron/process-sequences',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
  ),
  body := '{}'::jsonb
);
-- Attendu : 200 OK avec body type {"processed": N, ...}
```

Côté Vercel : pousser la nouvelle env var `CRON_SECRET` puis redeploy
(automatique après push de cette branche). Sans cela, les endpoints
refuseront l'ancien secret et les crons retourneront 401.

## Action restante : purge git history

L'ancien secret reste visible dans les 4 commits historiques. Deux options :

### Option A : Ne rien faire (recommandé si repo non public)

- Le repo `es-academy` est privé sur GitHub
- L'ancien secret est révoqué côté Supabase Vault et côté Vercel
- Tout appel à l'endpoint avec l'ancien secret retourne 401
- Risque résiduel : faible (un attaquant qui clone le repo via accès volé devrait
  aussi accéder à Vercel/Supabase pour exploiter, et à ce stade le secret n'est
  plus utile)

### Option B : Réécriture de l'historique git

- `git filter-repo --replace-text` pour purger le secret des 4 commits
- Coûte : tous les clones locaux doivent re-cloner, force-push obligatoire
- Casse les références vers les anciens SHAs (CI logs, PRs fermées)
- Risque : pertes d'historique sur les autres branches actives

**Décision : Option A** (attendre arbitrage explicite Emeline avant force-push).

## Prévention future

Tout nouveau secret doit suivre ce pattern :

1. Côté Next.js : `process.env.NOM_SECRET` lu depuis Vercel env vars
2. Côté pg_cron : lecture via `vault.decrypted_secrets WHERE name = 'nom_secret'`
3. Migration SQL : commentaire qui pointe vers le placeholder, AUCUNE valeur en clair
4. Pull request : checklist "Aucun secret en clair dans le diff ?" cochée

## Références

- Audit complet : `AUDIT_STRESS_TEST.md` section 5.1
- Cron cleanup audit_log : `AUDIT_STRESS_TEST.md` section 5.2
- Migration de rotation : `supabase/migrations/046_rotate_cron_secret.sql`
- Endpoints concernés : `src/app/api/cron/*/route.ts` (7 routes, auth stricte OK)
