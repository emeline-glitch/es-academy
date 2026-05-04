# Topo à coller dans Claude (chat) pour échange architecture

> **Comment l'utiliser** : ouvre claude.ai, nouveau chat, colle TOUT le bloc ci-dessous (entre les `---` du début à la fin). Claude te donnera une recommandation argumentée et t'aidera à trancher.

---

# Rôle

Tu es un architecte logiciel senior, spécialisé dans les SaaS multi-produits avec auth distribuée. Tu connais profondément :
- Stripe (webhooks, subscriptions, customer portal, idempotence)
- Supabase (RLS, service role, Edge Functions, multi-projects)
- Next.js 16 (App Router, server components, middleware)

Ton job ici : me donner une **recommandation tranchée** sur un choix d'archi, avec les trade-offs explicites. Pas de "ça dépend de tes priorités". Donne-moi LA reco que tu prendrais à ma place, en argumentant.

# Contexte business

Je vends 2 produits payants :
- **ES Academy** : formation immobilière one-shot 998 € (1x ou 3x ou 4x via Stripe). Plateforme web sur `emeline-siron.fr` (Next.js 16, Supabase Academy `tvkzndkywznaysiqvmsh`, déployé Netlify).
- **ES Family** : abonnement mensuel récurrent 19 € (fondateur) ou 29 € (standard). App web + iOS via Capacitor sur `esfamily.fr` (Next.js + Capacitor, Supabase Family `hpcoxtpdsydcrwdudhsk`, déployé Vercel).

**Les 2 produits utilisent UN SEUL compte Stripe** (ES Academy SASU, `acct_1TPIxG6LFQ0ZMm1e`).

**Les Supabase sont strictement séparés** (2 projects distincts, 2 bases auth différentes). Pas de SSO. Un user qui achète Academy crée un compte sur Supabase Academy. Un user qui s'abonne Family crée un compte sur Supabase Family. Ils peuvent partager le même email mais ce sont 2 identités distinctes côté DB.

Lancement Academy mi-mai 2026 (J-12). Family déjà en cours mais pas encore en croissance forte (volume actuel : ~50 abonnés test).

# État technique actuel (déjà implémenté)

## Webhook Stripe centralisé sur Academy

Tous les webhooks Stripe pointent vers **`https://emeline-siron.fr/api/stripe/webhook`**. Donc tous les events (Academy ET Family) sont traités par cette unique route, qui utilise `Supabase Academy` comme source de vérité.

Events traités aujourd'hui :
- `checkout.session.completed` (scope=academy) → row dans `enrollments`, tag CRM `academy`, mail welcome
- `checkout.session.completed` (scope=family) → row dans `family_subscriptions`, tags CRM `family + family:fondateur|standard`, mail welcome
- `customer.subscription.deleted` → status `canceled` sur `family_subscriptions`
- `invoice.payment_failed` → mail dunning custom pour Academy 3x/4x

## Tables Supabase Academy concernées

```sql
-- enrollments (Academy : achats one-shot ou 3x/4x)
CREATE TABLE enrollments (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),  -- user Supabase Academy
  course_id text,
  product_name text,                        -- 'academy', 'academy-formation'
  stripe_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  amount_paid integer,                       -- en centimes
  status text DEFAULT 'active',              -- 'active', 'canceled', etc.
  installments integer,                      -- 1, 3, 4
  family_gift_code text,                     -- code 3 mois Family offert avec achat Academy
  family_gift_email_sent_at timestamptz,
  ...
);

-- family_subscriptions (Family : abonnement récurrent)
CREATE TABLE family_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),  -- user Supabase Academy (created via webhook)
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_session_id text,
  plan text CHECK (plan IN ('fondateur', 'standard')),
  status text DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid')),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  welcome_email_sent_at timestamptz,
  ...
);
```

## Le user Family vit OÙ ?

**Aujourd'hui** : quand quelqu'un achète Family via le checkout Stripe sur emeline-siron.fr, le webhook crée un user dans `Supabase Academy` + une row dans `family_subscriptions` (sur Supabase Academy).

**Mais** : l'app esfamily.fr utilise `Supabase Family` (auth + données séparées). Donc ce nouveau user n'existe PAS encore côté Family. Si je clique "Me connecter à Family" depuis le mail welcome → j'arrive sur esfamily.fr/connexion → Supabase Family ne me connaît pas.

# Le problème à résoudre

J'ai besoin que l'app `esfamily.fr` connaisse en temps quasi-réel :
1. **L'existence** d'un nouveau abonné Family (création de compte côté Supabase Family pour qu'il puisse se connecter)
2. **Le statut de paiement** (`active`, `past_due`, `unpaid`, `canceled`) pour gating + bandeau warning ("ton paiement a échoué, mets à jour ta carte")
3. **Le plan** (fondateur ou standard) pour l'affichage UI
4. **Les changements** : un user qui résilie, qui passe en past_due, qui se réabonne, etc.

Le webhook Stripe arrive sur emeline-siron.fr et écrit dans Supabase Academy. Comment je propage cette info vers Supabase Family ?

# Les 3 options que j'envisage

## Option A : Webhook écrit dans les 2 Supabase

Le webhook actuel sur emeline-siron.fr écrit comme aujourd'hui dans Supabase Academy ET fait un second appel pour écrire dans Supabase Family (création user via auth.admin, upsert dans une table équivalente `family_members`).

**Pros** :
- Source de vérité dupliquée mais cohérente : chaque app a ses données localement
- Latence nulle (pas de cross-app call à chaque login)
- L'app Family lit depuis son propre Supabase comme une app normale
- Gating facile à implémenter côté Family

**Cons** :
- Couplage : le code webhook Academy doit connaître les credentials Supabase Family (env var supplémentaire `SUPABASE_FAMILY_SERVICE_KEY`)
- Risque de désync si une écriture rate (Academy OK, Family fail). Faut implémenter un retry / une queue
- 2 sources de vérité (mais Academy reste primaire)
- Si demain je veux un 3e produit → ça grossit

## Option B : App Family appelle une API publique sur emeline-siron.fr

Je crée sur emeline-siron.fr un endpoint type `GET /api/family/subscription-status?email=xxx` (sécurisé par token API).
L'app Family appelle cette API à chaque login (ou à chaque page sensible) pour savoir si l'user est actif/past_due/canceled.

**Pros** :
- Une seule source de vérité (Supabase Academy)
- Pas de duplication de data
- Évolutif : si je veux changer la logique (ex: ajouter un statut "trial"), je le fais en un seul endroit
- Code Family Supabase reste simple : pas de table family_subscriptions de son côté

**Cons** :
- Latence : 1 round-trip HTTP entre Family et Academy à chaque check
- Couplage runtime : si emeline-siron.fr est down, Family est down aussi
- L'auth Family doit être préalablement réglée (création du compte côté Supabase Family se fait comment ? Manuel par l'user à son premier login ?)
- Impose un middleware côté Family pour appeler l'API à chaque page

## Option C : Stripe est la seule source de vérité, app Family appelle Stripe API

L'app Family utilise les clés Stripe directement et interroge `stripe.subscriptions.list({customer})` à chaque login pour vérifier le statut.

**Pros** :
- Aucune duplication data, aucun service intermédiaire
- Stripe = vérité absolue (toujours à jour)
- Pas de webhook côté Family

**Cons** :
- Latence Stripe API (~150-300 ms)
- Faut quand même mapper customer Stripe ↔ user Supabase Family (donc une table de liaison)
- Couplage à Stripe pour TOUTES les pages sensibles (fragile si Stripe rate limit ou down)
- Pas de log local des transitions (past_due → active → canceled)

# Mes contraintes

- **Time to market** : J-12 du lancement Academy. L'app Family est secondaire pour ce lancement (Academy = produit phare, Family = upsell). Mais Family doit fonctionner correctement.
- **Volume cible court terme** : ~500 abonnés Family d'ici fin 2026 (cap fondateur), ~2000 fin 2027.
- **Équipe technique** : moi (non-dev mais je code avec Claude), pas d'équipe dédiée. Je veux le truc le plus simple à maintenir.
- **Budget** : minimal, pas de service externe payant supplémentaire.

# Ce que je veux de toi

1. **Ta reco tranchée** : A, B ou C ? Argumente en 5-8 lignes.
2. **Ce que tu changerais** dans l'option recommandée vs ce que je propose (raffinements).
3. **L'ordre d'implémentation** : qu'est-ce qui doit être fait avant le lancement Academy (J-12), qu'est-ce qui peut attendre 1 mois, qu'est-ce qui peut attendre 3 mois ?
4. **Les pièges typiques** que je risque sur l'option recommandée (idempotence, race conditions, gestion des cas limites comme la résiliation puis réabonnement, etc.)
5. **Une option D** que je n'ai pas vue, si tu en penses une meilleure.

# Format de retour attendu

Markdown structuré, lisible. Pas de bla-bla d'intro, va direct dans la décision.

Si tu as besoin de précisions techniques avant de répondre (ex: comment je gère aujourd'hui telle table, telle config Stripe), pose 3 questions max et attends ma réponse. Sinon démarre.

---

# Quand tu auras ta reco

Reviens me la coller dans une réponse. Je l'apporterai à Claude Code (mon assistant développeur) pour qu'il l'implémente.
