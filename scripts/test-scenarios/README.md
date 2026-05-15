# Tests parcours client (E2E)

Scénarios qui simulent un visiteur réel et vérifient que toute la chaîne fonctionne (formulaire → CRM → tags → listes → séquences).

## Lancer

```bash
# Pré-requis : dev server tourne (npm run dev → localhost:3005)

# Un scénario isolé
node scripts/test-scenarios/01-cahier-vacances.mjs

# Tous les scénarios à la suite
node scripts/test-scenarios/run-all.mjs

# Cibler la prod (à éviter sauf smoke test ponctuel)
BASE_URL=https://emeline-siron.fr node scripts/test-scenarios/run-all.mjs
```

## Comment ça marche

1. Chaque scénario génère un **email unique** `e2e-<scenario>-<timestamp>@es-test.local` (TLD réservé aux tests, aucun mail réel ne part).
2. POST sur l'API publique réelle (`/api/forms/[slug]/submit`).
3. Vérifie en DB (service client, bypass RLS) chaque touchpoint attendu : table `contacts`, tags, liste, `email_sequence_enrollments`, etc.
4. **Cleanup** automatique en fin de scénario → tu peux relancer autant que tu veux sans accumuler des données de test.

## Sortie

```
━━━ Scenario 01 : Cahier de vacances ━━━
[1] Verification prealable : formulaire publie ?
    ✅ formulaire trouvé
    ✅ form.status = "published"
[2] La visiteuse remplit le formulaire (POST public)
    ✅ POST 200
...
✅ Scenario OK · 12 pass · 0 fail
```

## Inventaire scénarios

| # | Slug | Parcours testé | Découvre |
|---|------|----------------|----------|
| 01 | `cahier-vacances` | Formulaire LM saisonnier (Instagram → CRM → liste → séquence) | Séquence en draft, steps vides |
| 02 | `newsletter` | Newsletter publique (sans séquence) | Cohérence tag + liste |
| 03 | `masterclass` | LM principal masterclass fondatrice | Mismatch tag `lm:masterclass-fondatrice` vs trigger `lm:masterclass` |

## Quand ajouter un scénario

Dès qu'un parcours client critique manque de couverture. Exemples :
- Quiz investisseur (`/api/quiz/submit` → tags `quiz-score:X-Y` → SEQ_QZ_*)
- RDV Calendly (webhook → tag `rdv-calendly-pris` → audit)
- Achat Academy (Stripe webhook → enrollment + Family gift code)
- Abonnement Family (Stripe sub → membership + rappels Chatel J-15)
- Réactivation alumni (SEQ_REACT → /confirm-active → tags update + consent_log)

Nommer le fichier `NN-slug-court.mjs` (NN = ordre d'exécution dans `run-all.mjs`).

## Helpers (`_lib.mjs`)

- `submitForm(slug, body)` — POST sur l'API publique
- `getContact(email)` — fetch contact en DB
- `expectTags(contact, tags)` — assertion tags présents
- `expectInList(contact, tagKey)` — assertion appartenance à une liste tag-based
- `expectSequenceEnrollment(contact, name)` — assertion enrollment + diagnostic (seq en draft, steps vide…)
- `cleanup(email)` — suppression du contact de test
- `cleanupAll()` — purge tous les contacts `@es-test.local` (à utiliser entre runs)
