# Prompt à coller dans Claude (chat) pour expertise marketing

> **Comment l'utiliser** : ouvre claude.ai, crée un nouveau chat, colle TOUT le bloc ci-dessous (entre les `---` du début à la fin). Claude te livrera la version améliorée des 6 mails.

---

# Rôle

Tu es un expert senior en email marketing B2C, spécialisé dans les séquences post-achat pour formations en ligne dans le secteur immobilier français. Tu maîtrises la philosophie StoryBrand (Donald Miller), les principes d'André Chaperon (Autoresponder Madness), et les meilleures pratiques 2026 en matière de deliverability, anti-spam, engagement et conversion.

Ton boulot ici n'est pas de réécrire à ta sauce, c'est d'**élever** les mails existants tout en respectant la voix de l'auteur. Tu critiques avant de proposer.

# Contexte business

**Marque** : ES Academy, formation en investissement immobilier locatif (SASU à Paris, RCS Nanterre 104020078).

**Fondatrice** : Emeline Siron. Elle a 55 locataires en gestion en nom propre, vit de l'immobilier en autofinancement (pas en cashflow tendu, c'est important pour son positionnement), formatrice depuis 2020. Storytelling perso fort : son premier appartement à Châtenay-Malabry en 2014 (Crédit Foncier), elle a aussi un projet "garage auto" qu'elle aime raconter (à utiliser comme métaphore mais pas systématiquement).

**Produit Academy** : 998€ TTC, payable 1x / 3x / 4x. 14 modules, 66 leçons. Méthodologie pas-à-pas appelée "la méthode Emeline SIRON". Lancement mi-mai 2026 (en remplacement d'Evermind qui ferme fin mai).

**Avatar cible** : Femmes 28-45 ans, principalement salariées CSP+, qui veulent devenir indépendantes financièrement via l'immobilier. Profil rationnel-prudent : elles ont peur de se planter, elles cherchent la maîtrise avant l'action. Beaucoup ont déjà leur résidence principale, certaines un premier locatif, mais elles ne sentent pas leur "système" cohérent. Elles consomment beaucoup de gratuit (YouTube, Instagram, podcasts) et ont du mal à passer à l'achat formation.

**Promesse Academy** : "Acheter ton premier bien locatif rentable et autofinancé en 6 à 9 mois, avec une méthode validée par les 55 locataires d'Emeline et 250+ alumni."

# Le contexte précis de la séquence

Le client vient d'acheter Academy. Il a déjà reçu un mail de bienvenue immédiat (avec accès plateforme + un code cadeau ES Family valable 3 mois). Cette séquence post-achat de 6 mails commence à J+1 et s'étale sur 30 jours.

**Objectifs business de la séquence (par ordre d'importance) :**

1. **Réduire le taux d'abandon** (qui survient typiquement entre J14 et J21, quand l'enthousiasme initial retombe et que le client se sent submergé par le volume de contenu).
2. **Pousser à l'action concrète** (visiter, négocier, mandater) plutôt que de rester dans l'apprentissage passif (le piège des formations).
3. **Onboarder vers la communauté Family** (ils ont un code cadeau de 3 mois offerts, à utiliser).
4. **Convertir 5-10% vers le coaching premium** à J30 (appel avec Antony, le closer interne).

**KPIs à monitorer** (tu en proposeras toi-même les cibles) :
- Open rate par mail
- Click rate par mail
- Taux de connexion plateforme dans les 7j
- Taux de conversion vers le coaching à J30+

# Contraintes éditoriales NON-NÉGOCIABLES

- **Tutoiement** uniquement. Jamais de vouvoiement.
- **ZÉRO em dash** (le caractère "—" est interdit). Tu utilises virgule, deux-points, point, parenthèse à la place. C'est non-négociable, c'est dans la charte.
- **INTERDIT** : "certifiant", "certification", "certifié", "diplômant" (Academy n'est pas RNCP, donc copy non-conforme = risque légal).
- Utiliser **"autofinancement"** plutôt que "cashflow" en messaging principal (positionnement Emeline : prudence + long terme, pas spéculation).
- **Style** : storytelling, voix d'Emeline (directe, sans détour, avec exemples chiffrés et histoires vécues). Plutôt phrases courtes. Plutôt verbes d'action. Pas de jargon corporate.
- Pas de spoiler ou tirets longs.
- **1 emoji max par mail**, et de préférence aucun.
- Variables disponibles dans les templates : `{{prenom}}` et `{{unsubscribe_url}}`.
- Surnommer la fondatrice **Emeline** dans la signature (jamais "Emeline Siron" en signature, juste "Emeline").

# Les 6 mails actuels (drafts v1 à améliorer)

[ICI tu colles le contenu du fichier seq-pa-academy-v1.md, les 6 mails complets]

# Ce que tu dois me livrer

## Pour chaque mail (1 à 6)

1. **Critique en 3 points** : ce qui marche, ce qui peut être nettement amélioré (sois précis : accroche, promesse, narration, CTA, etc.)
2. **2 sujets alternatifs** : un sage (proche de l'original) + un plus accrocheur. Précise pourquoi le 2e fonctionne mieux.
3. **Le hook d'ouverture séparé** (les 3 premières lignes, qui décident si le mail est lu en entier ou jeté).
4. **Mail réécrit complet**, prêt à coller en DB. Respecte ABSOLUMENT toutes les contraintes éditoriales ci-dessus.

## Recommandations globales (à la fin)

- L'ordre optimal des 6 mails : faut-il décaler les délais entre J+1, J+3, J+7, J+14, J+21, J+30 ? Justifier.
- 1 mail BONUS optionnel à insérer si la séquence te semble incomplète (par ex : un mail "résultat à 7j" entre M2 et M3, ou un mail "rappel Family" pour activer le code cadeau).
- Tes 3 KPIs cibles à atteindre pour cette séquence (open rate, click rate, taux d'activation plateforme).
- 1 conseil d'AB-test à mettre en place dans les 2 premières semaines de prod.

# Format de retour attendu

Markdown structuré, lisible. Un H2 par mail (`## Mail 1 — J+1`), des sous-sections clairement séparées. Pas de blabla d'introduction, va direct dans le boulot.

Si tu as besoin de précisions avant de commencer, pose 3 questions max et attends ma réponse. Sinon, démarre.

---

# Quand tu auras les versions améliorées

Reviens me les coller dans une réponse, je m'occupe de :
1. Les remplacer dans `seq-pa-academy-v1.md` (ou créer une `seq-pa-academy-v2.md`)
2. Générer le `seed-sprint5-data.mjs` avec le HTML wrapper + CTAs
3. Lancer le seed en DB Supabase
4. Tu pourras ensuite éditer en live depuis `/admin/sequences`
