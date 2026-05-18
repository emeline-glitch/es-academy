# Brancher Waalaxy au CRM

Tu as **Waalaxy Business annuel** + une clé API `zpka_…`.

⚠️ **Important** : Waalaxy n'a **pas d'API REST publique** à ce jour (cf. [leur doc officielle](https://intercom.help/waalaxy/fr/articles/13743138-integration-api-tout-ce-que-tu-dois-savoir-tutoriels)). La clé `zpka_` ne s'utilise qu'avec **Zapier, Make ou n8n** comme middleman. Pas de chemin direct Waalaxy → notre CRM possible.

## Comparatif des chemins

| Chemin | Setup | Coût | Volume max |
|--------|-------|------|------------|
| **1. Make.com** (recommandé) | 15 min | 0 € | 1000 prospects/mois gratuit |
| **2. Zapier** | 15 min | 0 € jusqu'à 100/mois, puis ~20 €/mois | illimité (payant) |
| **3. n8n self-hosted** | 1 h | 0 € | illimité |
| **4. Import CSV manuel** | 5 min/batch | 0 € | illimité (manuel) |

**Recommandation** : Make.com. Gratuit, suffit pour ton volume de prospection LinkedIn typique. Tu changeras si tu fais > 1000 prospects/mois.

---

## Chemin 1 — Make.com (recommandé)

### Étape 1 — Crée un compte Make gratuit

[make.com/en/register](https://www.make.com/en/register) → plan **Free** (1000 ops/mois).

### Étape 2 — Crée le scenario

1. **Create a new scenario** → cherche **"Waalaxy"** dans les apps

2. **Trigger** :
   - Module : **Waalaxy → Watch Email Found** (ou "New Prospect" selon ce que Make propose)
   - Connection → **Create new connection** → colle ta clé API (`zpka_…`, valeur dans `.env.local` → `WAALAXY_ZAPIER_KEY`)
   - Campaign : **All campaigns** (par défaut) ou cible une campagne spécifique

3. **Action** :
   - Ajoute un module **HTTP → Make a request**
   - Configure :
     - **URL** : `https://emeline-siron.fr/api/webhooks/waalaxy`
     - **Method** : `POST`
     - **Body type** : `Raw`
     - **Content type** : `application/json`
     - **Headers** :
       - `Content-Type` : `application/json`
       - `X-Waalaxy-Secret` : valeur de `WAALAXY_WEBHOOK_SECRET` dans `.env.local`
     - **Request content** (utilise les variables du trigger Waalaxy) :
       ```json
       {
         "type": "prospect_email_found",
         "data": {
           "prospect": {
             "email": "{{1.email}}",
             "first_name": "{{1.first_name}}",
             "last_name": "{{1.last_name}}",
             "linkedin_url": "{{1.linkedin_url}}",
             "company": "{{1.company}}",
             "headline": "{{1.headline}}"
           },
           "campaign": { "name": "{{1.campaign_name}}" }
         }
       }
       ```
       (Les noms exacts des variables Waalaxy `{{1.xxx}}` peuvent varier selon la version du connecteur Make. Drag-drop depuis le panneau de droite.)

4. **Run once** pour tester → tu dois voir un `200 success`.
5. **Activate the scenario** (toggle en bas) + **schedule** : "Immediately" pour temps réel ou toutes les 15 min.

### Quotas

- **Free** : 1000 operations/mois (suffit jusqu'à 1000 prospects récupérés)
- **Core** (~9 €/mois) : 10 000 operations/mois
- **Pro** (~16 €/mois) : 10 000 operations + features avancées

1 prospect Waalaxy = 1 op trigger + 1 op HTTP action = **2 ops**. Donc 500 prospects/mois max en plan Free.

---

## Chemin 2 — Zapier

Même principe que Make. Plus connu, parfois plus stable, mais plan gratuit limité à **100 tasks/mois** (= 50 prospects max). Setup détaillé :

### Étape 1 — Crée un compte Zapier

[zapier.com/sign-up](https://zapier.com/sign-up) → plan Free.

### Étape 2 — Crée le Zap

1. **Make a Zap → "+ Create"**

2. **Trigger** :
   - App : **Waalaxy**
   - Event : **New Prospect with Email Found** (le nom exact peut varier)
   - Connect Account → colle ta clé Zapier `WAALAXY_ZAPIER_KEY` (valeur dans `.env.local`, format `zpka_<64-hex>`)
   - Choose Campaign : tu peux laisser **"All campaigns"** pour tout récupérer

3. **Action** :
   - App : **Webhooks by Zapier**
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

---

## Chemin 3 — n8n self-hosted (geek mode, gratuit illimité)

Si tu veux 0 coût + volume illimité, n8n est open source et tu peux le faire tourner sur un VPS (5 €/mois ailleurs OU sur ton Mac via Docker).

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Puis `http://localhost:5678` → workflow avec node Waalaxy + node HTTP Request vers notre webhook.

Pas recommandé sauf si tu veux apprendre n8n. Make.com couvre 99% des cas.

---

## Chemin 4 — Import CSV manuel (toujours dispo)

Backup ou rattrapage. Utile pour :
- Importer les prospects pré-existants une fois avant d'activer Make
- Si Waalaxy a un incident

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

## Vérifier que le webhook répond

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
