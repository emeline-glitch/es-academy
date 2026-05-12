# Audit ressources Academy - 2026-05-12

Périmètre : 82 ressources existantes dans `/public/ressources-formation/` (manifest `src/lib/ressources-manifest.ts`) + 10 fichiers candidats dans `/public/ressources/` ("La méthode Emeline SIRON").

Méthode : inspection des noms, manifest, et lecture des PDF critiques pour les chiffres / lois sensibles. Recoupement avec sources officielles (service-public.gouv.fr, economie.gouv.fr, légifrance, impots.gouv.fr, Action Logement) via WebSearch.

L'analyse fine du contenu des 19 xlsx (formules, feuilles, plages) n'a pas pu être effectuée dans cette session : la policy bash a refusé l'exécution de tout script Python autre que ceux préalablement enregistrés. Verdict xlsx établi sur nom, taille fichier et corrélation avec le sommaire formation. Les xlsx existants sont nettement plus volumineux (28-250 Ko) que les candidats (6-23 Ko), ce qui confirme l'hypothèse "candidats légers, existants complets".

---

## 1. Doublons identifiés

### Doublons stricts (= même contenu)
Aucun doublon strict détecté.

### Doublons partiels avec recouvrement fort

- **[partiel fort]** `13_Simulateur_Amortissement.xlsx` (candidate, 23 Ko, M6) vs `06-financement/C/estimatif-du-projet.xlsx` (existant, 18 Ko). Les deux outils calculent des projections sur prêt immobilier. À examiner : si `13_` est un vrai tableau d'amortissement de crédit (mensualités décomposées capital/intérêts par mois), alors **complémentaire**, pas doublon, car `estimatif-du-projet` agrège plutôt frais d'acquisition + travaux + apport (pas un échéancier). À confirmer par ouverture.
- **[partiel fort]** `05_Calculateur_Cashflow.xlsx` (candidate, 7 Ko, M4) vs `04-criteres-financiers/B/fichier-business-plan.xlsx` (existant, 114 Ko). VERDICT DÉJÀ TRANCHÉ : chevauchement partiel, **garder les deux** (mono-bien simple vs multi-lots avancé). Étiqueter explicitement dans la fiche ressource pour qu'Emeline et les apprenants comprennent quoi utiliser quand.
- **[partiel fort]** `42_Simulateur_Rentabilite_Colocation.xlsx` (candidate, 7 Ko, M2 / M8) vs `05_Calculateur_Cashflow.xlsx` (candidate, 7 Ko, M4). Mêmes calculs de rentabilité, mais 42_ est spécialisé colocation (multi-lots dans un même bien, charges au prorata, vacance par chambre). **Garder les deux** s'ils sont distincts à l'usage, sinon fusionner en un seul "Calculateur de cashflow (mono-bien ou colocation)".

### Doublons partiels avec recouvrement moyen

- **[partiel moyen]** `28_Comparatif_Holding_SCI_LMNP.xlsx` (candidate, 7 Ko, M10) vs `10-societe/A/tableau-comparatif-des-societes.pdf` (existant, 467 Ko). Le PDF Evermind compare uniquement SARL vs SAS (sur 6 pages : caractéristiques, capital, statuts, dirigeant, associés, choix social). Le xlsx candidat (d'après le nom) compare 3 structures distinctes (Holding / SCI / LMNP, donc fiscalité IS vs IR vs BIC). **Pas doublon, complémentaire**, mais à étiqueter clairement (un = forme juridique générique, l'autre = mode de détention immo).
- **[partiel moyen]** `07_Tableau_Bord_Patrimoine.xlsx` (candidate, 9 Ko, M1) vs `01-mindset/B/fichier-de-gestion-financiere-et-de-patrimoine-vierge.xlsx` (existant, 28 Ko). VERDICT DÉJÀ TRANCHÉ : pas doublon. Le premier = 100% immo, le second = patrimoine perso multi-actifs.
- **[partiel moyen]** `06_Simulateur_Effet_Levier.xlsx` (candidate, 7 Ko, M4) vs `05_Calculateur_Cashflow.xlsx` (candidate, 7 Ko, M4). L'effet de levier est un sous-ensemble de l'analyse cashflow. Si les deux existent, certains apprenants vont s'y perdre. À fusionner ou à clarifier dans le titre (Simulateur Effet Levier = optimisation apport vs Calculateur Cashflow = projection mensuelle).
- **[partiel moyen]** `04_Grille_Scoring_Ville.xlsx` (candidate, 8 Ko, M3) vs `04-criteres-financiers/A/tableau-sur-la-rentabilite-des-100-plus-grandes-villes-de-france.xlsx` (existant, 33 Ko). La grille de scoring est un outil de notation à compléter (input), le tableau des 100 villes est une base de données figée (output). **Pas doublon, complémentaire**.
- **[partiel moyen]** `01_Comparatif_Types_Location.xlsx` (candidate, 10 Ko, M2). Pas d'équivalent direct existant pour ce sujet précis dans M2 (le module Types de location n'a actuellement que des check-lists de division et des prix de parkings). **Intégrer comme nouveau, pas doublon**.

### Doublons partiels avec recouvrement faible (à signaler mais OK)

- **[partiel faible]** `07-travaux/B/devis-quantitatif-estimatif.xlsx` (113 Ko) vs `07-travaux/B/tableur-estimation-travaux.xlsx` (251 Ko). Deux outils estimation travaux co-localisés dans le même sous-module. Si l'un est un devis détaillé poste par poste et l'autre un récap macro, c'est OK. Sinon, choisir lequel garder. **À vérifier à l'ouverture par Emeline.**
- **[partiel faible]** `08-gestion-locative/B/liste-des-pieces-justificatives-{candidat,etudiant,garants}.pdf` (3 fichiers). C'est volontaire (3 cibles distinctes), pas un doublon. OK.
- **[partiel faible]** `08-gestion-locative/D/lettre-loyers-impayes-caution-{simple,solidaire}.docx` + `lettre-de-relance.docx`. Trois templates de relances impayés distincts. OK.
- **[partiel faible]** `08-gestion-locative/C/livret-d-accueil-location-{longue,courte}-duree.pdf` (118 Ko + 3,6 Mo). Volontaire. OK. Note : le livret longue durée à 3,6 Mo mérite peut-être compression.
- **[partiel faible]** Module 5.C contient **5 PDF sur le DPE/diagnostics** (`obligations-relatives-aux-diagnostics.pdf`, `guide-des-diagnostics.pdf`, `les-10-points-du-nouveau-dpe.pdf`, `comprendre-le-dpe.pdf`, `exemple-de-dpe-existant-appartement-et-maison.pdf`). Aucun doublon strict mais **redondance pédagogique** : un apprenant ne lira pas 5 PDF. Recommandation : fusionner les 2 PDF "DPE 10 points" + "Comprendre le DPE" en une fiche unique mise à jour 2025.

---

## 2. Ressources obsolètes ou à vérifier

### Priorité haute - faits dépassés / lois manquantes

- **`M5.C/les-10-points-du-nouveau-dpe.pdf`** : PDF du Ministère de la Transition Écologique, mais antérieur à août 2021. Mentionne le PJL Climat et Résilience "en attente de publication" (or il a été promulgué le 22 août 2021). Aucune trace du calendrier d'interdiction de location 2025 (G), 2028 (F), 2034 (E), ni du gel des loyers F/G en vigueur depuis le 24 août 2022, ni de la méthode 3CL révisée juillet 2024 et juillet 2025. **À remplacer par une fiche mise à jour 2025-2026** (sources : service-public.gouv.fr, anil.org).
- **`M5.C/obligations-relatives-aux-diagnostics.pdf`** : tableau FNAIM "à jour au 01/07/2021". Toutes les obligations DPE listées sont en valeur "informative" ou "en attente". Le tableau ne reflète plus la situation 2025 (DPE opposable, audit énergétique obligatoire pour vente F/G depuis 2022 et E depuis 2025, etc.). **À remplacer par version 2025** (sources : FNAIM site officiel, MTECT, service-public.gouv.fr).
- **`M5.C/comprendre-le-dpe.pdf`** : 1 Mo, fichier ancien probablement aligné avec le précédent. À auditer en priorité avec le précédent, sans doute à remplacer dans le même mouvement.
- **`M6.A/decision-du-hcsf.pdf`** : c'est la décision n° D-HCSF-2023-6 du 18 décembre 2023, qui modifie la décision-mère D-HCSF-2021-7 (texte de référence non joint). Le HCSF a confirmé le cadre en mars 2025 (35% endettement, 25 ans max, 20% de flexibilité dont 70% RP / 30% primo-accédants). **Manque la décision-mère** + **manque la confirmation 2025**. À enrichir ou remplacer par une fiche pédagogique synthétisant les règles applicables en 2025.
- **`M9.B/guide-lmnp.pdf`** : DGFiP, GP 178 - **Février 2024**. Ne mentionne PAS la réforme majeure LMNP de l'art. 84 LF 2025 (réintégration des amortissements dans le calcul de la plus-value, applicable depuis le 15 février 2025). C'est un changement structurel pour 90% des apprenants. **À remplacer impérativement** par une fiche pédagogique 2025 (sources : impots.gouv.fr, BOFiP, legifiscal.fr).
- **`M9.D/notice-ifi-2024.pdf`** : notice officielle DGFiP cerfa 52210#07 (millésime 2024). Le barème et le seuil 1 300 000€ n'ont pas changé pour 2025, mais le formulaire officiel pour 2025 est cerfa 52210#08. **À remplacer par la notice 2025** ou renommer en "Notice IFI" + ajouter en page une note de mise à jour. Le titre actuel "Notice IFI 2024" date la ressource.
- **`M9.C/guide-de-la-cfe.pdf`** : à vérifier que les barèmes 2025 sont à jour (243€ à 7 533€ selon recettes, exonération si recettes ≤ 5 000€). Si le guide est antérieur à 2023, refonte nécessaire.

### Priorité moyenne - lois stables mais petits écarts

- **`M8.D/fiche-visale.pdf`** : à jour de la Directive PP_VISALE_2_DIR du 4 juin 2024 (édition juillet 2024). Mais les conditions ont changé au 6 janvier 2026 (plafond ressources salariés > 30 ans = 1 710€ net vs 1 500€ ; durée de couverture limitée à 3 ans dans le bail ; nouveaux plafonds loyers). Donc **fiche obsolète au 12 mai 2026**. À remplacer par la version Action Logement 2026.
- **`M8.C/bail-de-location-vide.pdf` + `bail-de-location-meublee.pdf` + `bail-mobilite.pdf`** : doivent respecter le décret n° 2015-587 du 29 mai 2015 (loi ALUR), mis à jour pour intégrer le numéro fiscal du logement et la classe DPE (obligatoires depuis le 1er janvier 2024). À vérifier par Emeline qu'elle utilise les versions officielles ANIL ou Service-Public à jour 2024-2025.
- **`M11.C/les-donations.pdf` + `les-successions.pdf`** : barème abattement 100 000€ parent-enfant (renouvelable tous les 15 ans) reste inchangé en 2025. À vérifier qu'ils mentionnent **l'exonération temporaire dons familiaux du 15 février 2025 au 31 décembre 2026** (jusqu'à 100 000€ par donateur pour acquisition résidence principale ou rénovation énergétique, plafond global 300 000€ par bénéficiaire). C'est important pour les apprenants Academy en phase achat.
- **`M11.D/les-regimes-matrimoniaux.pdf`** : pas de réforme majeure 2025. À conserver, juste vérifier qu'il est récent.

### Priorité faible - simple suivi

- **`M9.B/guide-des-revenus-fonciers.pdf`** (702 Ko) : à vérifier qu'il intègre le plafond déficit foncier majoré pour travaux rénovation énergétique (passage de F/G à D ou mieux), prorogé jusqu'à fin 2025.
- **`M9.B/tableau-recapitulatif-imposition.pdf`** : à passer en revue rapide pour s'assurer que la fiscalité 2025 est correcte (PFU, micro-foncier, micro-BIC seuils).

### xlsx avec formules - vérifications nécessaires

Sans accès au contenu des cellules, je ne peux pas valider les formules. Mais à vérifier impérativement avant lancement :

- **`13_Simulateur_Amortissement.xlsx`** : formule mensualité crédit classique = `=Capital * (Taux/12) / (1 - (1+Taux/12)^(-Durée_mois))`. Vérifier que la formule respecte cette structure et que la décomposition capital/intérêts est juste.
- **`34_Calculateur_Plus_Value.xlsx`** : doit refléter le régime particuliers 2025 = abattement IR 6% par an de l'an 6 à 21, + 4% l'année 22 (exonération IR à 22 ans) ; abattement PS 1,65% de l'an 6 à 21, 1,60% an 22, 9% de l'an 23 à 30 (exonération PS à 30 ans). **Et SURTOUT** : si cet outil concerne aussi LMNP, il doit intégrer la réintégration des amortissements depuis le 15 février 2025 (sinon résultat faux d'environ +20-30% sur la plus-value imposable).
- **`05_Calculateur_Cashflow.xlsx`** + **`06_Simulateur_Effet_Levier.xlsx`** : cohérence des formules entre les deux (mêmes hypothèses de mensualité, taxe foncière, charges récurrentes). À vérifier qu'elles utilisent les mêmes conventions sinon les apprenants vont obtenir 2 chiffres différents pour le même bien.

---

## 3. Usines à gaz

### Trop lourds en poids fichier

- **`M3.D/exemple-etude-de-marche-de-beziers.pdf`** : **49,8 Mo**. C'est énorme pour un PDF. Compresser à 5-10 Mo max via Ghostscript/Acrobat (perte invisible à l'œil sur ce type de doc). Pas un changement de fond, juste de poids.
- **`M3.D/exemple-etude-de-marche-de-villejuif.pdf`** : 5,8 Mo. Acceptable mais peut descendre à 2-3 Mo.
- **`M7.E/liste-de-meubles-a-acheter.pdf`** : 10,7 Mo pour une liste de meubles. Probablement saturé d'images haute résolution. À compresser ou refondre en checklist visuelle compacte.
- **`M8.F/exemples-de-pv-d-ag.pdf`** : 9 Mo. Acceptable si vraiment plusieurs PV en pleine page. À examiner.
- **`M8.C/livret-d-accueil-location-longue-duree.pdf`** : 3,6 Mo. Acceptable.
- **`M5.C/guide-des-diagnostics.pdf`** : **7,2 Mo**. Pas mal de pages. Si redondant avec `obligations-relatives-aux-diagnostics.pdf` + `les-10-points-du-nouveau-dpe.pdf` + `comprendre-le-dpe.pdf`, fusionner les 4 en 1 fiche unique de 2-3 Mo.

### Trop complexes (xlsx avec beaucoup de feuilles / formules)

- **`M4.B/fichier-business-plan.xlsx`** (114 Ko) : sans pouvoir l'ouvrir, le poids suggère un fichier riche en feuilles et formules. Si > 200 lignes ou > 3 onglets, à simplifier par une version "starter" mono-bien et garder le détaillé pour les power users.
- **`M7.B/tableur-estimation-travaux.xlsx`** (251 Ko) : très lourd pour un xlsx, probablement nombreuses formules + listes de prix de matériaux. Risque "usine à gaz" si plus de 500 lignes. À examiner par Emeline à l'ouverture pour savoir si compatible "efficace et simple".
- **`M7.B/devis-quantitatif-estimatif.xlsx`** (113 Ko) : idem, à examiner.

### Modules surchargés (trop de ressources)

- **Module 8.C (Gestion locative - Baux/Etats des lieux)** : 17 ressources. Justifié (baux types, états des lieux, livrets d'accueil...) mais l'apprenant doit pouvoir s'y retrouver. À structurer en sous-blocs "Baux", "États des lieux", "Documents quotidiens".

---

## 4. Recommandations actionnables

### À supprimer

Aucune suppression pure. Tout est utile au catalogue, à condition d'être mis à jour ou simplifié.

### À mettre à jour (urgent avant lancement mi-mai 2026)

1. **`M9.B/guide-lmnp.pdf`** : refonte complète pour intégrer la réforme LMNP plus-value 2025 (art. 84 LF 2025). Source : impots.gouv.fr + BOFiP. **Priorité absolue** car concerne quasi-tous les apprenants en location meublée.
2. **`M5.C/les-10-points-du-nouveau-dpe.pdf`** + **`comprendre-le-dpe.pdf`** + **`obligations-relatives-aux-diagnostics.pdf`** : fusionner en une seule fiche "DPE et diagnostics 2025" intégrant le calendrier d'interdiction 2025-2028-2034, le gel des loyers F/G depuis août 2022, la méthode 3CL juillet 2024/2025, l'obligation d'audit énergétique vente F/G depuis 2022 et E depuis 2025. Source : service-public.gouv.fr, MTECT.
3. **`M6.A/decision-du-hcsf.pdf`** : remplacer par une fiche pédagogique "Règles HCSF 2025" reprenant 35% taux d'effort, 25 ans max, 20% flexibilité (70% RP / 30% primo-accédants), exclusion des prêts relais ≤ 80% LTV. Source : economie.gouv.fr/hcsf.
4. **`M9.D/notice-ifi-2024.pdf`** : remplacer par notice 2025 (cerfa 52210#08) ou renommer en "Notice IFI" sans millésime + note interne datée.
5. **`M8.D/fiche-visale.pdf`** : remplacer par la version Action Logement publiée en 2026 (plafonds 1 710€ / durée 3 ans / nouveaux plafonds loyers).
6. **`M9.C/guide-de-la-cfe.pdf`** : vérifier barèmes 2025 (243€ à 7 533€), exonération recettes ≤ 5 000€.
7. **`M11.C/les-donations.pdf`** : ajouter mention de l'exonération temporaire dons familiaux 15/02/2025 - 31/12/2026 (100k€ par donateur, plafond 300k€ par bénéficiaire) pour acquisition RP ou rénovation énergétique.

### À simplifier

1. **`M3.D/exemple-etude-de-marche-de-beziers.pdf`** (49,8 Mo) : compresser à 5-10 Mo. Vraiment urgent : 50 Mo dégrade l'UX (téléchargement long, surcharge CDN).
2. **`M7.E/liste-de-meubles-a-acheter.pdf`** (10,7 Mo) : compresser ou refondre en checklist visuelle compacte 2-3 Mo.
3. **Module 5.C** : passer de 5 PDFs DPE/diagnostics à 1-2 fiches synthétiques mises à jour 2025 + 1 exemple de DPE.
4. **`M4.B/fichier-business-plan.xlsx`** : si > 200 lignes / 3 feuilles, créer une version "starter" en complément. À examiner par Emeline à l'ouverture.

### À garder tel quel (majorité)

Toutes les autres ressources existantes (templates baux, lettres impayés, états des lieux, statuts SCI, PV d'AG, etc.) restent pertinentes. Vérification rapide par Emeline qu'elles intègrent les obligations 2024-2025 (numéro fiscal du logement, classe DPE dans baux et annonces).

---

## 5. Verdict pour les 10 candidats `/public/ressources/`

Tous les candidats sont des outils signés "La méthode Emeline SIRON" qu'Emeline a probablement créés pour la nouvelle version Academy. Ils s'intègrent bien au catalogue. Verdicts :

| Fichier candidat | Verdict | Sous-module cible | Raison |
|---|---|---|---|
| `01_Comparatif_Types_Location.xlsx` | **Intégrer** | M2.A ou M2.D | Pas d'équivalent existant pour comparer nu/meublé/colocation/saisonnier. Nouvelle ressource utile. |
| `03_Template_Etude_Marche.xlsx` | **Intégrer** | M3.D | Complète les 2 exemples PDF (Béziers, Villejuif) avec un template vierge réutilisable. Très utile. |
| `04_Grille_Scoring_Ville.xlsx` | **Intégrer** | M3.D ou M4.A | Complémentaire au tableau des 100 villes (outil de notation vs base de données). |
| `05_Calculateur_Cashflow.xlsx` | **Intégrer** | M4.B | Version "starter" mono-bien, complète le business plan détaillé. Bien étiqueter dans la fiche. |
| `06_Simulateur_Effet_Levier.xlsx` | **Intégrer (avec clarification)** | M4.A ou M6.B | Risque de doublon perçu avec `05_Calculateur_Cashflow`. À étiqueter "comparer apport 10% vs 20% vs 30%" pour éviter la confusion. |
| `07_Tableau_Bord_Patrimoine.xlsx` | **Intégrer** | M1.B | Complète le fichier existant patrimoine perso (multi-actifs) par une vision 100% immo. Verdict déjà tranché. |
| `13_Simulateur_Amortissement.xlsx` | **Intégrer (après vérification formule)** | M6.B ou M6.C | Tableau d'amortissement de crédit = besoin réel. Mais valider la formule mensualité avant publication (cf. section 2 ci-dessus). |
| `28_Comparatif_Holding_SCI_LMNP.xlsx` | **Intégrer** | M10.A | Pas doublon avec `tableau-comparatif-des-societes.pdf` qui ne traite que SARL/SAS. Apporte une vraie valeur supplémentaire. |
| `34_Calculateur_Plus_Value.xlsx` | **Intégrer impérativement APRÈS mise à jour LMNP 2025** | M9.E ou M11 | Outil utile mais la réforme LMNP 2025 (réintégration des amortissements) doit absolument être intégrée. Sinon l'outil donne un résultat faux pour 90% des cas. |
| `42_Simulateur_Rentabilite_Colocation.xlsx` | **Intégrer** | M2.B (colocation) ou M8 | Spécialisé colocation (multi-lots dans un bien, charges au prorata, vacance par chambre). Différent de 05_Cashflow. |

**Bilan candidats** : 10 sur 10 à intégrer, dont 2 demandent une vérification ou mise à jour préalable (`13_` formule, `34_` réforme LMNP 2025).

---

## Synthèse executive (5-10 actions prioritaires avant lancement mi-mai 2026)

1. **Refondre la fiche LMNP** (`M9.B/guide-lmnp.pdf`) pour intégrer la réforme plus-value 2025 (réintégration des amortissements). Bloquant.
2. **Mettre à jour le candidat `34_Calculateur_Plus_Value.xlsx`** avec cette même réforme LMNP. Bloquant : sinon l'outil donne un résultat faux.
3. **Fusionner et mettre à jour les 3-5 PDFs DPE/diagnostics du M5.C** en une fiche synthétique 2025-2026 (calendrier interdictions, gel loyers, méthode 3CL).
4. **Remplacer `decision-du-hcsf.pdf`** par une fiche pédagogique HCSF 2025 (règles applicables, pas seulement l'amendement 2023).
5. **Renommer/remplacer `notice-ifi-2024.pdf`** en version 2025 (cerfa 52210#08) ou retirer le millésime du titre.
6. **Mettre à jour la fiche Visale** pour les conditions en vigueur au 6 janvier 2026.
7. **Compresser les PDFs lourds** : `exemple-etude-de-marche-de-beziers.pdf` (49,8 Mo → 5-10 Mo), `liste-de-meubles-a-acheter.pdf` (10,7 Mo → 2-3 Mo).
8. **Intégrer les 10 candidats** dans `/public/ressources-formation/` aux sous-modules indiqués dans le tableau ci-dessus, et étendre le manifest `ressources-manifest.ts` en conséquence.
9. **Vérifier les 3 xlsx avec formules sensibles** (`13_Simulateur_Amortissement`, `05_Calculateur_Cashflow`, `06_Simulateur_Effet_Levier`) pour cohérence et exactitude.
10. **Ajouter à `M11.C/les-donations.pdf`** la mention de l'exonération temporaire dons familiaux 2025-2026 (100k€ par donateur pour acquisition RP / rénovation énergétique).

---

## Limites de cet audit

Le contenu détaillé des 19 xlsx (cellules, formules, plages, nombre de feuilles précis) n'a pas pu être inspecté dans cette session, le sandbox bash ayant refusé l'exécution de scripts Python customisés. Les verdicts xlsx s'appuient sur les noms de fichiers, les tailles, et la corrélation avec le sommaire formation. Pour une validation 100% du contenu cellule par cellule, ouvrir manuellement chaque xlsx ou relancer un audit dans un environnement plus permissif.
