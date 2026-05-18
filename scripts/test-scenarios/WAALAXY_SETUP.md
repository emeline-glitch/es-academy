# Brancher Waalaxy au CRM

Tu as **Waalaxy Business annuel**. Tu as 3 chemins possibles, du plus simple au plus flexible :

| Chemin | Temps de mise en place | Coût additionnel | Fiabilité |
|--------|------------------------|-------------------|-----------|
| **1. Webhook natif** | 5 min | 0 € | ⭐⭐⭐⭐⭐ |
| **2. Zapier** (clé `zpka_…`) | 15 min | 0 € (jusqu'à 100 tasks/mois) puis ~20 €/mois | ⭐⭐⭐⭐ |
| **3. Import CSV** | manuel hebdomadaire | 0 € | ⭐⭐⭐ |

Commence par le **1**. Si Waalaxy n'expose pas l'option, retombe sur le **2** (tu as déjà la clé Zapier).

---

## Chemin 1 — Webhook natif Waalaxy (recommandé)

Va dans **app.waalaxy.com → Paramètres → Intégrations**. Si tu vois une section **"Webhooks"** (différent de "Zapier"), suis ces étapes :

1. **Ajouter un webhook**
2. Renseigne :
   - **URL** : `https://emeline-siron.fr/api/webhooks/waalaxy`
   - **Méthode** : `POST`
   - **Header personnalisé** :
     - Nom : `X-Waalaxy-Secret`
     - Valeur : la valeur de `WAALAXY_WEBHOOK_SECRET` dans ton `.env.local` (et déjà sur Vercel)
   - **Événements à écouter** :
     - ✅ `prospect_email_found` (le principal — déclenché quand Waalaxy trouve l'email pro)
     - ✅ `prospect_replied` (optionnel — si tu veux taguer les hot leads qui répondent)
3. Sauvegarde, puis clique **"Tester"**. Tu dois recevoir un `200 success`.

### Tu ne vois pas "Webhooks" dans tes intégrations ?

Passe au **Chemin 2 (Zapier)** — tu as déjà la clé qu'il faut.

---

## Chemin 2 — Zapier (ta clé `zpka_…`)

Le préfixe `zpka_` est un **Zapier Personal Key** : la clé que Waalaxy te génère pour autoriser Zapier à lire ton compte. Zapier devient le middleman entre Waalaxy et nous.

### Étape 1 — Crée un compte Zapier (gratuit jusqu'à 100 tasks/mois)

[zapier.com/sign-up](https://zapier.com/sign-up). Plan gratuit suffit pour démarrer.

### Étape 2 — Crée le Zap

1. **Make a Zap → "+ Create"**

2. **Trigger** :
   - App : **Waalaxy**
   - Event : **New Prospect with Email Found** (le nom exact peut varier : choisir celui qui correspond à "prospect_email_found")
   - Connect Account → colle ta clé Zapier `WAALAXY_ZAPIER_KEY` (valeur dans `.env.local`, format `zpka_<64-hex>`)
   - Choose Campaign : tu peux laisser **"All campaigns"** pour tout récupérer (recommandé) ou en cibler une

3. **Action** :
   - App : **Webhooks by Zapier** (intégré gratuit)
   - Event : **POST**
   - Configure :
     - **URL** : `https://emeline-siron.fr/api/webhooks/waalaxy`
     - **Payload Type** : `JSON`
     - **Data** :
       ```json
       {
         "type": "prospect_email_found",
         "data": {
           "prospect": {
             "email": "{{prospect_email}}",
             "first_name": "{{prospect_first_name}}",
             "last_name": "{{prospect_last_name}}",
             "linkedin_url": "{{prospect_linkedin_url}}",
             "company": "{{prospect_company}}",
             "headline": "{{prospect_headline}}"
           },
           "campaign": { "name": "{{campaign_name}}" }
         }
       }
       ```
     - **Headers** :
       - `Content-Type` : `application/json`
       - `X-Waalaxy-Secret` : (la valeur de `WAALAXY_WEBHOOK_SECRET`)

4. **Test action** → tu dois voir une réponse `200 {"success":true, …}`.
5. **Publish** le Zap.

### Quota Zapier

- **Free** : 100 tasks/mois = environ 100 prospects par mois
- **Starter** (~20 €/mois) : 750 tasks/mois
- **Pro** (~50 €/mois) : 2000 tasks/mois

Si tu collectes plus de 100 leads/mois via Waalaxy, le Starter Zapier est obligatoire. Re-évaluer dans 1 mois.

---

## Chemin 3 — Import CSV manuel (backup ou rattrapage)

Toujours disponible quel que soit le chemin choisi. Utile :
- Pour rattraper les prospects pré-existants avant d'activer le webhook/Zapier
- Si Waalaxy a un incident et que tu veux importer manuellement

### Workflow

1. Dans Waalaxy : campagne → **"Exporter les prospects"** → CSV
2. Va sur `/admin/import-contacts` du CRM
3. Configure :
   - **Liste de destination** : `Prospection LinkedIn`
   - **Tags supplémentaires** : `waalaxy:<nom-campagne>` (à adapter)
   - **Consent type** : `legitimate_interest` (RGPD : prospection B2B basée sur intérêt légitime, art. 6.1.f)
   - **Source** : `linkedin-waalaxy`
   - **Source detail** : nom de la campagne Waalaxy
4. Colle le CSV, **"Dry run"** pour vérifier, puis **"Importer"**.

---

## Vérifier que ça marche

### Test manuel (curl)

```bash
SECRET=$(grep '^WAALAXY_WEBHOOK_SECRET=' .env.local | cut -d= -f2-)
curl -X POST https://emeline-siron.fr/api/webhooks/waalaxy \
  -H "Content-Type: application/json" \
  -H "X-Waalaxy-Secret: $SECRET" \
  -d '{
    "type": "prospect_email_found",
    "data": {
      "prospect": {
        "email": "test-waalaxy@es-test.local",
        "first_name": "Test",
        "last_name": "Manuel",
        "linkedin_url": "https://linkedin.com/in/test"
      },
      "campaign": { "name": "Test Manuel" }
    }
  }'
```

Réponse attendue : `{"success":true,"contact_id":"…","tags_added":[…]}`.

### Test automatisé

```bash
node scripts/test-scenarios/10-waalaxy-webhook.mjs
```

Vérifie : contact créé, tags posés, metadata, liste, sécu 401, idempotence.

---

## Où retrouver les leads une fois branché

- **CRM → Listes → "Prospection LinkedIn"** : liste tag-based
- **Dashboard → CA par source** : ligne `linkedin-waalaxy` (acheteurs + taux de conversion)
- **Dashboard → Top CTA convertisseurs** : si tu fais une séquence email qui débouche sur un CTA Stripe avec `data-cta="linkedin-academy"`

Pour déclencher une séquence email sur un sous-segment Waalaxy :

```sql
INSERT INTO email_sequences (name, trigger_type, trigger_value, status, steps)
VALUES (
  'Welcome LinkedIn Investisseurs',
  'tag_added',
  'waalaxy:investisseurs-bordeaux-2026',
  'draft',     -- passe en 'active' une fois les steps écrits par Tiffany
  '[]'::jsonb
);
```

Ou cible toute la prospection LinkedIn d'un coup avec `trigger_value = 'linkedin'`.
