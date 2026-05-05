# SEQ_PA_ACADEMY : Version 2 (validée)

> Version expertisée par Claude (chat) le 2026-05-04. Source de vérité pour le seed Supabase.

---

## Métadonnées séquence

| Champ | Valeur |
|---|---|
| Nom DB | `Post-achat Academy (SEQ_PA_ACADEMY)` |
| Trigger | `tag_added` sur le tag `academy` (posé par webhook Stripe après achat) |
| Status seed initial | `draft` (à activer manuellement après seed + test envoi) |
| Volume | 6 mails sur 30 jours |
| Variables disponibles | `{{prenom}}`, `{{unsubscribe_url}}` |
| Audience cible | Acheteurs Academy 998€ (1x / 3x / 4x) |

## Planning des envois

| Step | Délai depuis trigger | Sujet |
|---|---|---|
| 1 | J+1 (24h) | `{{prenom}}, c'est officiel` |
| 2 | J+3 | `8 locataires sans chauffage, en plein hiver. Ma 1ère vraie leçon.` |
| 3 | J+7 | `{{prenom}}, tu as 4 trucs en main ?` |
| 4 | J+14 | `Elle a osé proposer 80% du prix. Le vendeur a dit oui.` |
| 5 | J+21 | `Ton cerveau veut te garder en sécurité. Ne le laisse pas faire.` |
| 6 | J+30 | `Si tu sens qu'il te manque un truc, lis ça` |

## KPIs cibles à monitorer

- Open rate moyen séquence : **50%**
- Click rate moyen séquence : **12%**
- Taux de connexion plateforme dans les 7j post-achat : **85%**
- Taux de prise RDV avec Antony à J+30 : **8%**
- Taux d'activation code Family dans les 30j : **40%**

---

## Mail 1 : J+1

**Sujet** : `{{prenom}}, c'est officiel`

**Body** :

```
Salut {{prenom}},

Tu viens de faire un truc que 95% des gens qui rêvent d'investir ne feront jamais : t'engager pour avoir une méthode au lieu d'errer 18 mois dans le YouTube gratuit.

Bravo. Sincèrement.

Avant de te dire par où démarrer, je veux que tu prennes 2 minutes pour réaliser où tu en es.

Il y a quelques jours encore, tu te demandais peut-être si ça allait vraiment marcher pour toi. Si l'immo c'était pas un univers réservé aux héritiers, à ceux qui ont déjà du réseau, à ceux qui ont un profil entrepreneur dès le départ. Spoiler : non. Moi j'ai grandi dans un garage auto en banlieue parisienne. Pas de patrimoine familial. Pas de réseau. Pas de capital de départ. Aujourd'hui j'ai 55 locataires en gestion. Pas parce que j'avais un truc en plus, parce que j'ai appliqué une méthode à la lettre.

Cette méthode, c'est exactement celle que tu as entre les mains depuis hier.

Voilà ce qu'on va se passer dans les semaines à venir.

Tu vas démarrer par le Module 1, mindset. Pas par hasard. C'est la fondation. La majorité des gens veulent zapper pour aller direct sur les chiffres et la négociation. Erreur classique. Sans le bon cadre mental, les modules suivants glissent sur toi sans laisser de trace.

Tu vas aussi recevoir un mail de moi tous les 7 jours pendant un mois, avec des histoires précises de mes élèves, des galères que j'ai vécues, et des cadres pour avancer. Pas de spam. Pas de blabla. Que ce qui compte à ton stade.

Et ton accès Family t'attend (3 mois offerts, code dans ton mail de bienvenue d'hier), pour échanger avec des élèves qui sont déjà passés par là où tu es ce matin.

Maintenant tu fais une seule chose : tu ouvres Module 1.

[CTA : Démarrer le Module 1]

Dans 2 jours je te raconte mon premier immeuble et la galère qui m'a appris ce que 6 ans d'études immo ne m'avaient pas appris.

On y va.

Emeline
```

**CTA URL à mapper** : URL Module 1 dans la plateforme (ex: `/cours/mindset-investisseur`)

---

## Mail 2 : J+3

**Sujet** : `8 locataires sans chauffage, en plein hiver. Ma 1ère vraie leçon.`

**Body** :

```
{{prenom}},

Été 2019. Je signe le compromis pour mon tout premier immeuble. 8 appartements à rénover entièrement.

Quelques mois plus tard, en plein hiver, mes 8 locataires viennent d'emménager. La chaudière commune lâche d'un coup. Il fait 4 degrés dehors.

Téléphones qui sonnent en boucle. Locataires qui ont froid (et qui ont bien raison de m'appeler). Moi je suis encore salariée à temps plein chez Lifento, à gérer 250 millions d'euros d'EHPAD en Europe la journée. Et la je découvre que je dois remplacer un système de chauffage complet pour 8 logements. Maintenant. Pas dans 3 semaines.

La pensée qui m'a traversé l'esprit ce matin-là : "j'ai fait une connerie, j'ai pas les épaules pour ça."

Je l'ai dit à personne. Mais je l'ai pensé fort.

Sauf que pendant que je me racontais cette histoire, mes locataires avaient toujours froid. J'ai donc fait ce que je faisais déjà dans mon job de gestionnaire de fonds : tableau Excel, 4 chauffagistes locaux contactés, le seul disponible sous 48h validé, devis signé, mail individuel à chaque locataire avec planning précis.

En 5 jours c'était réglé.

Voilà ce que je veux que tu retiennes ce matin.

Tu vas avoir des imprévus. Pas peut-être. C'est sûr. Une chaudière qui lâche, un locataire qui part en cours de bail, un voisin qui t'envoie un recommandé pour des nuisances inventées. Ça fait partie du métier d'investisseur. C'est pas le signe que tu n'es pas faite pour ça.

La vraie différence entre les investisseuses qui tiennent dans le temps et celles qui revendent au bout d'un an, c'est pas le talent ni le capital. C'est la méthode pour encaisser les imprévus à froid, sans paniquer.

C'est précisément ce que tu vas apprendre dans Academy, module après module.

[CTA : Continuer dans la formation]

Emeline

PS : Cet immeuble rapporte aujourd'hui 3250€ de loyers mensuels pour 1250€ de crédit et 700€ de charges. La galère du chauffage ne pèse plus rien dans la balance.
```

**CTA URL à mapper** : URL plateforme principale (ex: `/cours`)

---

## Mail 3 : J+7

**Sujet** : `{{prenom}}, tu as 4 trucs en main ?`

**Body** :

```
{{prenom}},

Une semaine que tu es dans Academy. On fait le point honnêtement.

Tu devrais avoir 4 choses notées quelque part (carnet, fichier, Notion, peu importe le support).

1. Ta ville cible. UNE, pas trois.
2. Ton secteur précis dans cette ville. À l'échelle de la rue si possible.
3. Tes 3 critères non-négociables.
4. Ta fourchette de prix réaliste (basée sur tes vrais chiffres, pas sur tes envies).

Si tu as les 4 : tu es dans le bon rythme. Tu peux passer à la phase visites et au Module 5.

Si tu n'en as pas encore 4 : pas de panique, mais reviens en arrière. Sans ces fondations, les modules suivants vont t'embrouiller plutôt qu'aider. C'est exactement le piège que tu veux éviter.

Au passage, petit rappel utile. Avec ton achat Academy, tu as reçu un code cadeau pour 3 mois offerts dans Family, ma communauté immo. C'est dans ton mail de bienvenue. Si tu ne l'as pas encore activé, fais-le cette semaine. Tu vas y croiser des élèves qui sont passés par exactement où tu es aujourd'hui, et d'autres qui en sont sortis avec leur 1er bien signé. C'est précieux quand tu doutes.

Maintenant prends 5 minutes ce soir. Pose-toi vraiment, sans distraction. Et identifie pour toi le point précis où tu coince dans ces 4 fondations. La clarté sur ton blocage, c'est déjà 80% du chemin pour le résoudre.

[CTA : Activer mon accès Family]

Emeline
```

**CTA URL à mapper** : `/family/activer?code={{family_gift_code}}` (nécessite ajouter cette variable à la séquence) ou simplement `/family`

---

## Mail 4 : J+14

**Sujet** : `Elle a osé proposer 80% du prix. Le vendeur a dit oui.`

> ⚠️ Correction post-PDF : Module 5 dans le PDF était une erreur (Module 5 = Travaux). La négociation est dans **Module 5 (analyse-technique)** d'après le sommaire Drive Academy. CTAs et texte corrigés ci-dessous.

**Body** :

```
{{prenom}},

Le bien était affiché 165 000€. Sandra a proposé 132 000€.

80% du prix demandé. Sans rougir. Sans excuse.

Sandra, c'est une de mes élèves. 30 ans, infirmière en service de nuit à Lyon, jamais investi avant. Quand elle a rejoint mes formations en novembre, elle me disait "Emeline, je n'ai jamais négocié un prix de ma vie, même pas une voiture d'occasion. Je vais geler au moment de proposer."

Elle a quand même appliqué la méthode du Module 5, à la lettre, en tremblant.

Elle a envoyé son offre par mail à l'agence, le matin de bonne heure pour ne pas avoir le temps de se dégonfler. Texte court, justifié sur 3 points, avec sa préqualification bancaire en pièce jointe pour montrer qu'elle était sérieuse.

Le vendeur a contre-proposé à 142 000€. Elle a signé.

23 000€ d'économisés. Soit l'équivalent de presque 3 ans d'autofinancement gagnés AVANT même d'avoir mis la clé dans la serrure.

Ce qu'il faut que tu retiennes : la négociation ce n'est pas une option, c'est LE moment où tu fais ton autofinancement. Pas quand le locataire entre dans le bien. Quand tu signes le compromis.

Et "oser", ça n'est pas un trait de caractère. C'est une méthode. C'est dans le script du Module 5, tu envoies, tu attends. Tu ne discutes pas par téléphone (c'est là qu'on flanche), tu écris.

[CTA : Module 5, Négociation]

Emeline

PS : Sandra avait peur. Elle a fait quand même. C'est ça qui change tout.
```

**CTA URL à mapper** : URL Module 5 (ex: `/cours/negociation`)

---

## Mail 5 : J+21

**Sujet** : `Ton cerveau veut te garder en sécurité. Ne le laisse pas faire.`

**Body** :

```
{{prenom}},

3 semaines dans Academy. La phase confortable se termine maintenant.

Ton cerveau va te jouer un tour cette semaine. Je veux que tu le voies venir.

Il va te dire un truc qui ressemble à ça : "j'ai encore besoin d'un peu plus de formation avant de passer à l'action". Il va te suggérer de finir TOUS les modules avant de bouger. De lire 2 livres immo en plus. De regarder 3 chaînes YouTube de plus. D'attendre la rentrée. D'attendre les taux. D'attendre.

C'est un piège. Et il est puissant parce qu'il a l'air raisonnable.

Ton cerveau veut une seule chose : te garder en sécurité. Et la sécurité pour lui, c'est la zone "j'apprends". Tant que tu apprends, tu peux pas te planter. Tu peux être jugée par ta famille qui pense de l'immobilier "c'est risqué". Tu peux perdre d'argent. Tu peux te tromper.

Sauf que l'apprentissage sans action, c'est de la procrastination déguisée en sérieux. Au bout de 6 mois, tu auras tout regardé, tu auras lu, écouté en podcast, et tu n'auras toujours pas un bien à ton nom.

Voilà le cadre pour les 30 prochains jours.

Tu choisis UNE action concrète, irréversible, et tu la fais cette semaine. Pas la semaine prochaine. Cette semaine.

Quelques exemples qui marchent :

- Mandater 1 chasseur immo dans ta ville cible
- Faire évaluer ta capacité d'emprunt par 2 banques avec rendez-vous calé
- Bloquer 2 weekends visites avec 5 biens minimum à voir
- Présenter ton dossier complet à 1 banque

UNE action. Une seule. Pas dix. Une que tu fais vraiment, dont tu ne peux pas revenir en arrière.

Concrètement : prends 5 minutes ce soir, écris ton action sur un post-it que tu colles sur ton écran de travail, avec la date butoir. Visible tous les jours. C'est tout.

Et si tu veux en parler à des gens qui comprennent ce que tu vis, ton accès Family est là pour ça. Tu y croises des élèves exactement à ton stade, et d'autres qui en sont sortis. Le partage avec des pairs vaut 10 fois plus qu'un mail de moi.

[CTA : Rejoindre Family]

Emeline

PS : La différence entre les élèves d'Evermind qui ont signé leur 1er bien et celles qui ne l'ont pas fait ? C'est pas le QI. C'est qu'à un moment elles ont arrêté d'apprendre et elles ont commencé à faire.
```

**CTA URL à mapper** : `/family` (ou /family/activer avec code)

---

## Mail 6 : J+30

**Sujet** : `Si tu sens qu'il te manque un truc, lis ça`

**Body** :

```
{{prenom}},

1 mois dans Academy. Court pour avoir signé. Long pour avoir clarifié ta stratégie.

Si tu n'as pas encore acheté à 1 mois, c'est NORMAL. La moyenne de mes élèves c'est 5 à 7 mois entre l'inscription et la première signature. Tu es dans les temps.

Mais peut-être qu'à ce stade tu sens un truc que les modules seuls ne couvrent pas.

Tu as besoin de quelqu'un qui regarde TON dossier, TES chiffres, TA ville, TA stratégie. Pas un cours générique consommé seule devant ton écran. Du vrai sur-mesure, sur tes vraies données.

C'est exactement à ça que sert le coaching personnalisé que je propose à côté d'Academy.

Tout est construit sur-mesure. Pas de package figé, pas de formule type. Le format se dessine en fonction de ton stade, de ta vitesse, de ton niveau d'autonomie sur ton dossier, et de ce que tu veux atteindre dans les 6 prochains mois.

Pour caler ce qui te correspond vraiment (et ne pas payer pour quelque chose qui ne sert pas tes objectifs), tu prends un appel avec Antony. C'est mon associé sur les inscriptions Academy depuis 2 ans. Il connaît tous les profils d'élèves, il sait identifier en 30 minutes de ce qui es vraiment besoin et te proposer la formule de coaching qui correspond à ta situation.

C'est un appel commercial, je vais pas te le cacher. Mais c'est aussi le moyen le plus efficace d'identifier le bon accompagnement avec là où tu en es.

[CTA : Prendre un appel avec Antony]

Si tu préfères continuer en autonomie avec Academy + Family, c'est totalement OK aussi. Tu as tout ce qu'il faut entre les mains, et tu progresses à ton rythme.

À très bientôt,

Emeline

PS : Si tu n'as pas encore activé ton accès Family (3 mois offerts avec ton achat Academy), le code est dans ton mail de bienvenue. C'est le moment.
```

**CTA URL à mapper** : URL Calendly Antony (à demander à Emeline)

---

## Notes techniques pour Claude Code (le seed)

- **HTML wrapper** : réutiliser celui du Sprint 4
  ```html
  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #1B4332;">...</div>
  ```
- **CTA template** : bouton vert ES (`#1B4332`) padding 14px 32px centré border-radius 4px texte blanc
- **Footer désinscription** :
  ```html
  <a href="{{unsubscribe_url}}" style="color: #888; font-size: 12px;">Je me désabonne</a>
  ```
- **Lien Family** : URL d'activation Family avec code prérempli (à confirmer avec Emeline)
- **Lien Antony (Mail 6)** : URL Calendly Antony à insérer
- **Liens modules** : URLs plateforme `/cours/[moduleSlug]` à mapper

## Checklist pré-activation

- [ ] HTML wrapper appliqué sur chaque body
- [ ] CTA URLs résolues (modules, Family, Antony)
- [ ] Test envoi sur compte test (vérifier rendu mobile + desktop)
- [ ] `{{unsubscribe_url}}` présent et fonctionnel
- [ ] `{{prenom}}` testé avec valeur vide (fallback "Salut" sans nom)
- [ ] Tracking pixel SES vérifié
- [ ] Status passé de `draft` à `active` après validation
