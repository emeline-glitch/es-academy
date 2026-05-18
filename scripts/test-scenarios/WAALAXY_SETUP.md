# Brancher Waalaxy au CRM

Deux chemins selon ton plan Waalaxy. Tu peux vérifier ton plan dans **app.waalaxy.com > Paramètres > Mon abonnement**.

---

## Chemin 1 — Webhook temps réel (plan Business)

Si tu as le plan **Business**, chaque email collecté arrive automatiquement dans le CRM en quelques secondes, sans toi.

### Configuration Waalaxy

1. Va dans **Paramètres → Intégrations → Webhooks → Ajouter un webhook**
2. Renseigne :
   - **URL** : `https://emeline-siron.fr/api/webhooks/waalaxy`
   - **Méthode** : `POST`
   - **Header personnalisé** :
     - Nom : `X-Waalaxy-Secret`
     - Valeur : la valeur de `WAALAXY_WEBHOOK_SECRET` dans ton `.env.local` (et sur Vercel)
   - **Événements à écouter** :
     - ✅ `prospect_email_found` (le principal — déclenché quand Waalaxy trouve l'email pro)
     - ✅ `prospect_replied` (optionnel — si tu veux taguer les hot leads qui répondent)
3. Sauvegarde, puis **"Tester"** dans Waalaxy. Tu dois recevoir un `200 success`.

### Ce que ça fait automatiquement

Chaque prospect avec email collecté :
- Atterrit dans la table `contacts` (CRM)
- Source = `linkedin-waalaxy` (visible dans le dashboard CA par source)
- Tags appliqués :
  - `source:linkedin-waalaxy` (générique)
  - `linkedin` (raccourci segmentation)
  - `waalaxy:<nom-de-campagne-slugifié>` (1 tag par campagne pour la perf)
- Apparait dans la liste CRM **"Prospection LinkedIn"**
- Metadata enrichies : `linkedin_url`, `linkedin_company`, `linkedin_headline`, `waalaxy_campaign`

Les events sans email (ex: `prospect_visited`) sont ignorés (200) pour ne pas faire retry Waalaxy inutilement.

### Sécurité

L'endpoint refuse toute requête sans le header `X-Waalaxy-Secret`. Le secret est rotation-safe : tu peux le régénérer (`openssl rand -hex 32`) et le re-pousser sur Vercel + Waalaxy. Reload des webhooks en cours après ça.

---

## Chemin 2 — Import CSV (tous les plans)

Si tu n'as pas le plan Business, Waalaxy te laisse exporter les contacts collectés en CSV.

### Workflow manuel (5 min par batch)

1. Dans Waalaxy, va sur ta campagne → **"Exporter les prospects"** → CSV
2. Ouvre le CSV pour vérifier les colonnes : `email`, `first_name`, `last_name`, `linkedin_url`, `company`
3. Va sur `/admin/import-contacts` sur ton CRM
4. Configure :
   - **Liste de destination** : `Prospection LinkedIn`
   - **Tags supplémentaires** : `waalaxy:<nom-de-ta-campagne>` (à adapter)
   - **Consent type** : `legitimate_interest` (RGPD : prospection B2B basée sur intérêt légitime, cf article 6.1.f)
   - **Source** : `linkedin-waalaxy`
   - **Source detail** : nom de la campagne Waalaxy
5. Colle le CSV, **"Dry run"** pour vérifier, puis **"Importer"**.

### Cadence recommandée

Une fois par semaine. Si tu fais plus de 1 batch / semaine, le plan Business devient rentable (~50€/mois) pour gagner ce temps.

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

Réponse attendue : `{"success":true,"contact_id":"...","tags_added":[...]}`.

### Test automatisé

```bash
node scripts/test-scenarios/10-waalaxy-webhook.mjs
```

Vérifie : contact créé, tags posés, metadata, liste, sécu 401, idempotence.

---

## Tableau de bord

Une fois actif, retrouve les leads LinkedIn dans :

- **CRM → Listes → "Prospection LinkedIn"** : liste tag-based
- **Dashboard → CA par source** : ligne `linkedin-waalaxy` (acheteurs + conversion)
- **Dashboard → Top CTA convertisseurs** : si tu mets en place une séquence email qui débouche sur un CTA Stripe avec `data-cta="linkedin-academy"`

---

## Faire évoluer

Pour déclencher une séquence email automatique sur un sous-segment Waalaxy :

```sql
INSERT INTO email_sequences (name, trigger_type, trigger_value, status, steps)
VALUES (
  'Welcome LinkedIn Investisseurs',
  'tag_added',
  'waalaxy:investisseurs-bordeaux-2026',
  'draft',     -- passe en 'active' une fois les steps écrits
  '[]'::jsonb
);
```

Tu peux aussi router toutes les prospections LinkedIn vers une séquence générique en utilisant `trigger_value = 'linkedin'`.
