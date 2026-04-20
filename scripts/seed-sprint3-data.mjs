// Sprint 3 : SEQ_NM (nurture maître 12 mails) + SEQ_CV (cahier vacances 10 mails) + SEQ_CO (chasse oeufs 6 mails).
// Tous tutoyés, zéro em dash. Les corps sont prêts à l'usage mais restent éditables par Tiffany.

const wrap = (body) => `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
${body}
<p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Tu reçois ce mail parce que tu t'es inscrite sur emeline-siron.fr. <a href="{{unsubscribe_url}}">Je me désabonne</a>.</p>
</div>`;

const cta = (url, label) => `<p style="text-align: center; margin: 30px 0;"><a href="${url}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">${label}</a></p>`;

// ──────────────────────────────────────────────────────────────────────────
// SEQ_NM : Nurture maître (12 mails sur 8 semaines, 2 par semaine lundi+jeudi)
// Trigger : tag completed_welcome ajouté (10 jours après fin de n'importe quelle welcome)
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_NM = {
  name: "Nurture maître (SEQ_NM)",
  trigger_type: "tag_added",
  trigger_value: "completed_welcome",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 10, delay_hours: 0,
      subject: "La vraie histoire de comment j'ai commencé",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>On ne s'est pas parlé depuis un moment. Je veux te raconter quelque chose de personnel.</p>
<p>En 2016, j'étais mécanicienne dans un garage auto près de Reims. Salaire 1 450€ net. Des mains noires en rentrant chez moi tous les soirs.</p>
<p>Un client m'avait parlé d'investissement locatif. J'ai cru qu'il fallait être riche pour investir. J'avais tort.</p>
<p>J'ai acheté mon premier bien à 24 ans, avec 0€ d'apport, un crédit à 110%, et la terreur au ventre. Un T2 à 62 000€ dans une ville moyenne. Loyer 520€/mois, mensualité 380€.</p>
<p>Autofinancement positif dès le 1er mois : 40€.</p>
<p>40€. Pas de quoi changer ma vie. Mais ça m'a prouvé que c'était possible.</p>
<p>9 ans plus tard, je suis à 12 biens, 55 locataires, un patrimoine net de 1,5M€.</p>
<p>Ce n'est pas pour me vanter. C'est pour te dire : si je l'ai fait depuis un garage auto, tu peux le faire depuis ton salon.</p>
<p>Dans les semaines qui viennent, je vais partager avec toi ce que j'ai appris.</p>
<p>À bientôt,<br><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 3, delay_hours: 0,
      subject: "Étude de cas : comment Clémence a fait +180€/mois avec 25m²",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Clémence, 31 ans, consultante à Lyon. Elle m'a rejoint en formation en 2023.</p>
<p>Son projet initial : un T2 à 140 000€ à la périphérie. Bien correct, rentabilité OK (4,8% brute).</p>
<p>Je lui ai dit : "Attends. Regarde aussi le centre."</p>
<p>Elle a cherché 6 semaines de plus. Résultat : un studio de 35m² dans le 7ème arrondissement, 98 000€, loyer 610€/mois.</p>
<p>Mensualité crédit : 530€. Autofinancement positif : 180€/mois, après les charges.</p>
<p>Sur 25 ans, ces 180€/mois représentent 54 000€ d'argent supplémentaire dans sa poche, sans compter la plus-value à la revente.</p>
<p>La différence entre les deux scénarios ? Sa patience, et une seule étape de méthode bien faite : <strong>l'étude de marché locale approfondie</strong>.</p>
<p>C'est cette méthode que je transmets dans ES Academy.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 4, delay_hours: 0,
      subject: "Le chiffre qui change tout dans l'immo (et que personne n'utilise)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Tout le monde regarde la rentabilité brute. C'est l'indicateur numéro 1 sur les sites immo, les blogs, les simulateurs.</p>
<p>C'est aussi celui qui te piège le plus.</p>
<p><strong>Le vrai chiffre à regarder, c'est la rentabilité nette-nette (après impôts).</strong></p>
<p>Exemple simple :</p>
<ul>
<li>Bien A : loyer 650€/mois, rentabilité brute 5,2%, location nue, TMI 30% → rentabilité nette-nette : 3,1%</li>
<li>Bien B : loyer 620€/mois, rentabilité brute 4,8%, LMNP réel → rentabilité nette-nette : 4,9%</li>
</ul>
<p>Sur 20 ans, l'écart représente 38 000€ de gain supplémentaire pour le bien B.</p>
<p>Le régime fiscal change la rentabilité réelle de 30 à 60%. Et la plupart des gens choisissent par défaut, sans comparer.</p>
<p>Dans Academy, le module "Fiscalité optimale" te fait tester les 5 régimes sur ton projet, en 30 minutes.</p>
${cta("https://emeline-siron.fr/academy", "Découvrir Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 3, delay_hours: 0,
      subject: "Les 5 erreurs que j'ai vu faire 100 fois",
      html_content: wrap(`<p>{{prenom}},</p>
<p>8 ans à coacher des investisseurs. 1 800 élèves formés. Voici les 5 erreurs qui reviennent à chaque fois.</p>
<p><strong>1. Acheter sans "pourquoi" chiffré.</strong> "Je veux investir" n'est pas un objectif. "Je veux 800€/mois d'autofinancement d'ici 2028 pour financer les études de mes enfants" en est un.</p>
<p><strong>2. Se fier à l'agent immobilier.</strong> Son métier c'est vendre, pas t'aider. Toutes les infos qu'il te donne doivent être vérifiées (loyer marché, travaux, comparables).</p>
<p><strong>3. Négliger l'étude de marché local.</strong> YouTube te donne une vision globale. Ton marché, c'est 3 rues autour du bien. Fais-y un tour en semaine et en week-end.</p>
<p><strong>4. Oublier les provisions.</strong> Travaux, vacances locatives, impayés : compte 15 à 20% du loyer annuel. Sinon le premier coup dur te coule.</p>
<p><strong>5. Ne pas visiter le banquier en premier.</strong> Tu sais exactement combien tu peux emprunter AVANT de chercher. Sinon tu te passionnes pour un bien que tu ne peux pas financer.</p>
<p>Ces 5 erreurs coûtent 10 à 50 000€ par bien.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 4, delay_hours: 0,
      subject: "Pourquoi les banques préfèrent les investisseurs aux propriétaires",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Contre-intuitif, hein ? Tu pensais peut-être que les banques préfèrent prêter aux gens qui achètent leur résidence principale.</p>
<p>C'est faux.</p>
<p><strong>Les banques adorent les investisseurs locatifs bien calibrés.</strong></p>
<p>Pourquoi ? Parce que :</p>
<ul>
<li>Un loyer c'est un revenu supplémentaire qui rassure sur ta capacité de remboursement</li>
<li>Un bien locatif c'est une garantie solide (hypothèque)</li>
<li>Un investisseur en série devient un bon client long terme (crédits, assurances, placements)</li>
</ul>
<p>Ce qui fait la différence entre un "bon investisseur" et un "mauvais investisseur" à leurs yeux :</p>
<ul>
<li>Dossier bancaire propre (pas de découvert, pas de conso revolving)</li>
<li>Apport optionnel si le projet est bon</li>
<li>Business plan chiffré (loyer, charges, autofinancement)</li>
<li>Comptes bancaires séparés si plusieurs biens</li>
</ul>
<p>Dans Academy, le module "Stratégie bancaire" te prépare ton dossier en amont pour maximiser ta capacité d'emprunt et le nombre de biens que tu peux enchaîner.</p>
${cta("https://emeline-siron.fr/academy", "Découvrir Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 6, delay_days: 3, delay_hours: 0,
      subject: "Étude de cas : Thomas, 4 biens en 3 ans sans épargner 1€",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Thomas, 42 ans, ingénieur.</p>
<p>Quand il m'a rejointe en 2022, il avait 1 bien depuis 2018. Autofinancement ÉQUILIBRÉ (0€, ni gain ni perte). Il n'osait pas en racheter un autre, peur de "surcharger" son endettement.</p>
<p>On a bossé ensemble 3 mois. Le plan : structurer le dossier, démontrer le cash-flow positif à sa banque, puis relancer.</p>
<p>Résultat en 3 ans :</p>
<ul>
<li>Bien 1 (existant) : optimisé fiscalement (bascule en LMNP réel) → +180€/mois</li>
<li>Bien 2 (2022) : T1 à Clermont-Ferrand, 65 000€, autofinancement +90€/mois</li>
<li>Bien 3 (2023) : immeuble de rapport à Saint-Étienne (3 lots), 240 000€, autofinancement +520€/mois</li>
<li>Bien 4 (2024) : studio coloc à Grenoble, 120 000€, autofinancement +210€/mois</li>
</ul>
<p>Total autofinancement : +1 000€/mois.<br>Épargne injectée par Thomas : 0€.</p>
<p>Tous les projets ont été financés à 105-110% par les banques, grâce à un dossier carré et à la démonstration de l'autofinancement de chaque bien.</p>
<p>Thomas est passé de "j'ai peur de l'endettement" à "ma capacité d'endettement est ma principale ressource".</p>
<p>C'est exactement ce que je veux pour toi.</p>
${cta("https://emeline-siron.fr/academy", "Voir la méthode dans Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 7, delay_days: 4, delay_hours: 0,
      subject: "LMNP, SCI IS, holding : comment choisir sans te tromper",
      html_content: wrap(`<p>{{prenom}},</p>
<p>La fiscalité immo, c'est le domaine qui fait le plus peur aux débutants. Et à tort.</p>
<p>Voici le cadre de décision simple que j'utilise :</p>
<p><strong>Tu as 0 à 3 biens, revenus moyens (TMI 11% ou 30%) :</strong> LMNP au réel. Amortissement = 0€ d'impôts pendant 10-15 ans. Simplicité comptable correcte.</p>
<p><strong>Tu as 3 à 5 biens et tu veux en ajouter :</strong> SCI à l'IS. Permet d'amortir le bâti + d'optimiser la sortie (plus-value). Attention au coût comptable (1 200 à 2 000€/an).</p>
<p><strong>Tu as 5+ biens et tu penses à la transmission :</strong> Holding patrimoniale qui détient tes SCI. Permet d'empiler les biens, de faire des montages de transmission (démembrement), d'optimiser l'IS à l'échelle du groupe.</p>
<p>Ce n'est pas un choix à prendre à la légère. Une SCI à l'IS mal montée coûte 5 000€ et ne sert à rien. Une holding bien structurée peut économiser 200 000€ sur 20 ans.</p>
<p>Dans Academy, les modules "Fiscalité" et "Structuration" traitent chacun de ces scénarios en détail, avec des arbres de décision et des cas concrets.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 8, delay_days: 3, delay_hours: 0,
      subject: "Mon portefeuille personnel (transparence complète)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>La plupart des formateurs immo refusent de parler de leur portefeuille perso. Moi je joue la transparence.</p>
<p><strong>Voici mon portefeuille au 1er janvier 2026 :</strong></p>
<ul>
<li>12 biens locatifs</li>
<li>55 locataires</li>
<li>Valeur brute : environ 2,3M€</li>
<li>Encours crédit : 1,1M€</li>
<li>Patrimoine net immo : 1,2M€</li>
<li>Cashflow net mensuel (après impôts, provisions, tout) : 3 800€</li>
</ul>
<p><strong>Structure :</strong></p>
<ul>
<li>2 SCI à l'IS (résidentiel + commercial)</li>
<li>1 holding patrimoniale (Holdem Groupe SASU)</li>
<li>Quelques biens en nom propre en LMNP réel sur des opportunités historiques</li>
</ul>
<p><strong>Ce que ça me permet aujourd'hui :</strong></p>
<ul>
<li>Vivre de mes revenus locatifs (pas besoin d'Academy pour manger)</li>
<li>Réinvestir 100% des profits de ma formation dans de nouveaux biens</li>
<li>Transmettre progressivement à mon fils via démembrement</li>
</ul>
<p>J'ai commencé à 0. En 9 ans. Sans héritage, sans chance particulière.</p>
<p>La méthode fonctionne. Reste à l'appliquer.</p>
${cta("https://emeline-siron.fr/academy", "Rejoindre Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 9, delay_days: 4, delay_hours: 0,
      subject: "Les vrais risques de l'investissement locatif (et comment je les gère)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je ne vais pas te vendre un monde rose. L'investissement locatif a des risques. Les connaître, c'est les maîtriser.</p>
<p><strong>Risque 1 : l'impayé.</strong><br>Probabilité : 3 à 5% sur un portefeuille bien sélectionné.<br>Gestion : assurance loyers impayés (3% du loyer) + garant solide + vérification stricte du dossier.</p>
<p><strong>Risque 2 : la vacance locative.</strong><br>Probabilité : 1 à 2 mois par an en zone non tendue, 0 en zone tendue.<br>Gestion : choisir la bonne zone dès le départ + provision 10% du loyer annuel.</p>
<p><strong>Risque 3 : les gros travaux imprévus.</strong><br>Chaudière, fuite, toiture : budget 3 à 8 000€ tous les 5 à 10 ans.<br>Gestion : provision 10% du loyer annuel + savoir lire un diagnostic avant d'acheter.</p>
<p><strong>Risque 4 : la chute des prix.</strong><br>Historique : -15 à -25% en 2008, correction locale possible.<br>Gestion : acheter "sous" le prix du marché (10-20% de décote) + long terme + choix de zones porteuses.</p>
<p><strong>Risque 5 : la hausse des taux.</strong><br>Actuel : impact fort sur les NOUVEAUX investissements.<br>Gestion : taux fixes pour sécuriser + négocier les conditions de modulation dans ton crédit.</p>
<p>Ces 5 risques sont couverts module par module dans Academy, avec les outils pour les anticiper.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 10, delay_days: 3, delay_hours: 0,
      subject: "La rentabilité sur 20 ans (simulation réelle sur un bien moyen)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Simulons ensemble. Un bien "moyen" acheté en 2026 :</p>
<ul>
<li>Prix : 130 000€ (frais de notaire inclus)</li>
<li>Loyer : 620€/mois</li>
<li>Apport : 10% (13 000€)</li>
<li>Crédit : 117 000€ sur 25 ans à 3,8%</li>
<li>Régime fiscal : LMNP au réel</li>
</ul>
<p><strong>Sur 20 ans :</strong></p>
<ul>
<li>Total loyers encaissés : 148 800€</li>
<li>Total mensualités payées : 144 000€</li>
<li>Total gain fiscal (LMNP réel vs pas de bien) : 28 000€</li>
<li>Charges + provisions + taxe : 36 000€</li>
<li>Cash-flow net total : -3 200€ (léger effort d'épargne sur 20 ans = 13€/mois)</li>
</ul>
<p>Mais <strong>à la revente</strong> (prix moyen +25% sur 20 ans) :</p>
<ul>
<li>Valeur estimée : 162 500€</li>
<li>Capital remboursé : environ 82 000€</li>
<li>Plus-value nette (après impôts) : environ 95 000€</li>
</ul>
<p><strong>Résultat final : tu as payé 13€/mois pendant 20 ans pour toucher 95 000€ de plus-value. ROI spectaculaire sur ton apport initial de 13 000€.</strong></p>
<p>C'est ça, l'effet de levier. Et c'est ce que je t'apprends à orchestrer dans Academy.</p>
${cta("https://emeline-siron.fr/academy", "Rejoindre Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 11, delay_days: 4, delay_hours: 0,
      subject: "Passer à l'action (la seule décision qui compte)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Ça fait 8 semaines qu'on se parle. Tu as eu beaucoup d'informations. Des histoires, des chiffres, des méthodes.</p>
<p>Maintenant, je vais te demander quelque chose de difficile.</p>
<p><strong>Décide.</strong></p>
<p>Soit tu continues comme aujourd'hui. Tu continues à consommer du contenu gratuit sur YouTube, Instagram, le podcast. Dans 12 mois, tu en seras probablement au même point qu'aujourd'hui.</p>
<p>Soit tu passes à l'action. Tu prends la méthode. Tu l'appliques pendant 6 mois. Tu fais ton premier investissement.</p>
<p>Il n'y a pas de voie médiane.</p>
<p>L'immobilier ne récompense pas ceux qui savent. Il récompense ceux qui font.</p>
<p>Si tu es prête à faire :</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy (998€)")}
<p>Si tu veux un échange honnête avant :</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel avec Antony")}
<p>Le reste, c'est entre toi et tes peurs.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 12, delay_days: 3, delay_hours: 0,
      subject: "Fin de la séquence (et ES Family pour rester connectée)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>C'est le dernier mail de cette séquence de 12 mails.</p>
<p>Si tu n'as pas rejoint Academy à ce stade, aucun souci. Je respecte ton rythme.</p>
<p>Tu vas continuer à recevoir :</p>
<ul>
<li>Ma newsletter bi-hebdomadaire (1 jeudi sur 2, 7h30)</li>
<li>Les épisodes du podcast Out of the Box</li>
<li>Les saisonniers : cahier de vacances en juillet, calendrier de l'Avent en décembre, chasse aux oeufs à Pâques</li>
</ul>
<p><strong>Une dernière suggestion :</strong></p>
<p>Si tu veux rester connectée à une communauté d'investisseurs actifs sans prendre la formation complète, il y a <strong>ES Family</strong> : 29€/mois, résiliable 1 clic.</p>
<p>Tu as accès aux lives mensuels, à des analyses vidéo flash, à des opportunités rares. C'est la communauté que j'aurais voulu rejoindre à mes débuts.</p>
${cta("https://emeline-siron.fr/family", "Découvrir ES Family")}
<p>Dans tous les cas, merci d'être là. Et à bientôt sur la newsletter.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_CV : Cahier de vacances (juillet-août)
// Trigger : tag lm:cahier-vacances ajouté
// 10 mails : livraison + 7 jours d'exercices + 2 closing
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_CV = {
  name: "Welcome Cahier de vacances (SEQ_CV)",
  trigger_type: "tag_added",
  trigger_value: "lm:cahier-vacances",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "Ton cahier de vacances est prêt (7 jours pour te transformer en investisseuse)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Voici ton cahier de vacances :</p>
${cta("https://emeline-siron.fr/cahier-vacances/telecharger?email={{email}}", "Je télécharge mon cahier (PDF, 47 pages)")}
<p><strong>Le programme des 7 prochains jours :</strong></p>
<ul>
<li>Jour 1 : Mon pourquoi (et pourquoi la plupart se trompent)</li>
<li>Jour 2 : Mon budget d'investissement (calcul réel)</li>
<li>Jour 3 : Ma zone cible (étude de marché express)</li>
<li>Jour 4 : Analyser une annonce comme une pro</li>
<li>Jour 5 : Le business plan en 30 minutes</li>
<li>Jour 6 : La visite stratégique (la checklist)</li>
<li>Jour 7 : Construire ma négociation</li>
</ul>
<p>Chaque jour : 20 à 30 minutes de travail. Pas plus.</p>
<p>Tu recevras un mail quotidien à 9h avec la correction de l'exercice de la veille et l'indication de l'exercice du jour.</p>
<p><strong>On commence demain. Tiens-toi prête.</strong></p>
<p>Emeline</p>
<p style="font-size: 13px; color: #666;">PS : si tu fais ce cahier sérieusement, tu sortiras des vacances avec un projet d'investissement concret. Pas une idée. Un projet.</p>`),
    },
    {
      step_order: 2, delay_days: 1, delay_hours: 0,
      subject: "Jour 1 · Ton pourquoi (commence par là)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Jour 1 du cahier. L'exercice le plus important, et celui que 90% des gens sabotent.</p>
<p><strong>L'exercice :</strong> définir ton pourquoi chiffré et daté.</p>
<p>Pas "je veux être libre financièrement". Trop vague.</p>
<p>Voici 3 exemples de bons pourquoi :</p>
<ul>
<li>"Générer 1 500€/mois d'autofinancement positif d'ici 2030 pour quitter mon job salarié"</li>
<li>"Financer les études supérieures de mes 2 enfants à horizon 2035 (budget 80 000€)"</li>
<li>"Constituer un patrimoine de 500 000€ d'ici 2035 pour me verser une retraite à 55 ans"</li>
</ul>
<p>Pourquoi c'est crucial ? Parce que chaque décision que tu prendras ensuite (zone, bien, montage fiscal) découle de ce pourquoi. Sans lui, tu bricoles.</p>
<p>Prends 30 min aujourd'hui pour répondre aux 3 questions du cahier page 8.</p>
<p>Rendez-vous demain.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 1, delay_hours: 0,
      subject: "Jour 2 · Ton budget réel d'investissement",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Hier tu as défini ton pourquoi. Bravo.</p>
<p>Aujourd'hui, on redescend au concret : <strong>combien tu peux investir ?</strong></p>
<p>L'exercice du jour : calculer ta capacité d'endettement réelle.</p>
<p>Pas la capacité théorique que te donne un simulateur en ligne. La capacité RÉELLE une fois qu'on a :</p>
<ul>
<li>Retiré tes charges mensuelles fixes (prêt auto, conso)</li>
<li>Appliqué le taux d'usure 2026</li>
<li>Intégré 70% du loyer locatif futur</li>
<li>Gardé une marge de sécurité de 10% (la banque aussi)</li>
</ul>
<p>Tu vas probablement découvrir que tu peux emprunter 30 à 50% de plus que ce que tu pensais.</p>
<p>Instructions page 14 du cahier.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 1, delay_hours: 0,
      subject: "Jour 3 · Ta zone cible (la méthode 3 cercles)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Capacité d'endettement OK. Maintenant : <strong>où acheter ?</strong></p>
<p>La méthode que je t'apprends aujourd'hui, je l'appelle "les 3 cercles".</p>
<p><strong>Cercle 1 (priorité max) :</strong> ta zone géographique dans un rayon de 30 min de chez toi. Tu connais, tu peux y aller facilement, tu gères mieux.</p>
<p><strong>Cercle 2 (plan B) :</strong> une ville de 50 000 à 150 000 habitants à max 2h en train. Si le cercle 1 est trop tendu financièrement, tu élargis ici.</p>
<p><strong>Cercle 3 (opportunités) :</strong> des micro-opportunités spécifiques identifiées par ton réseau (un immeuble de rapport à vendre via une connaissance, etc.).</p>
<p>La majorité des débutants partent directement au cercle 3, par FOMO. C'est une erreur.</p>
<p>L'exercice page 19.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 1, delay_hours: 0,
      subject: "Jour 4 · Analyser une annonce comme une pro",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Aujourd'hui, exercice pratique. Tu vas prendre 3 annonces réelles sur Le Bon Coin ou SeLoger, et tu vas les décortiquer.</p>
<p><strong>La grille de lecture en 8 points :</strong></p>
<ol>
<li>Prix au m² vs médiane du quartier</li>
<li>Cohérence loyer affiché vs loyer marché</li>
<li>Âge du bâti + année de construction</li>
<li>DPE (F/G = risque de travaux énergétiques obligatoires)</li>
<li>Charges de copropriété annuelles</li>
<li>Taxe foncière locale</li>
<li>Distance transports + commerces (impact sur la demande locative)</li>
<li>Temps de présence sur le marché (si +3 mois → négociable)</li>
</ol>
<p>Les 8 points sont détaillés page 25 du cahier avec 3 exemples pas-à-pas.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 6, delay_days: 1, delay_hours: 0,
      subject: "Jour 5 · Le business plan en 30 minutes",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Jour 5. On assemble ton premier business plan.</p>
<p>Ce que ça contient :</p>
<ul>
<li>Prix d'achat + frais (notaire 7%, travaux estimés, agence)</li>
<li>Financement (apport, montant emprunté, taux, durée)</li>
<li>Revenus (loyer HC, charges récupérables)</li>
<li>Charges (non-récupérables, assurances, taxe foncière)</li>
<li>Fiscalité estimée selon régime choisi</li>
<li>Cash-flow mensuel net</li>
<li>Rentabilité brute et nette-nette</li>
</ul>
<p>Mon conseil : utilise mon simulateur en parallèle, il te fait gagner 20 min.</p>
${cta("https://emeline-siron.fr/simulateurs/rentabilite-locative", "Ouvrir le simulateur")}
<p>Template business plan page 32.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 7, delay_days: 1, delay_hours: 0,
      subject: "Jour 6 · La visite stratégique (la checklist qui change tout)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Aujourd'hui, on passe au terrain.</p>
<p>Une visite d'investisseur n'a rien à voir avec une visite de propriétaire occupant. Tu cherches des risques, pas des coups de coeur.</p>
<p><strong>Les 10 points à checker SYSTÉMATIQUEMENT :</strong></p>
<ol>
<li>Tableau électrique (norme NF C 15-100)</li>
<li>Tuyauterie (plomb = remplacement 3 000 à 8 000€)</li>
<li>Humidité au sol et murs (+ odeur)</li>
<li>Ventilation (VMC fonctionnelle ?)</li>
<li>Chauffage (type, âge, coût annuel)</li>
<li>Isolation thermique (combles, murs, fenêtres)</li>
<li>Toiture (si maison : âge, fuites visibles)</li>
<li>Copropriété (PV des 3 dernières AG, fonds travaux)</li>
<li>Environnement (bruit, commerces, parking)</li>
<li>Demande locative locale (temps de vacance moyen)</li>
</ol>
<p>Checklist imprimable page 38 du cahier.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 8, delay_days: 1, delay_hours: 0,
      subject: "Jour 7 · Construire ta négociation",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Dernier jour du cahier. La compétence qui rapporte le plus : la négociation.</p>
<p>Un bien négocié -15% représente 15 à 30 000€ de gain immédiat.</p>
<p><strong>La méthode en 4 étapes :</strong></p>
<p><strong>1. Identifier les points faibles du bien</strong> (DPE mauvais, travaux nécessaires, propriétaire pressé, temps de présence long, comparaison défavorable avec le marché).</p>
<p><strong>2. Chiffrer précisément chaque point faible</strong> (devis travaux réel, manque à gagner pendant les travaux, etc.).</p>
<p><strong>3. Formuler une contre-offre argumentée</strong> : "Je propose X€ au lieu de Y€ parce que [liste chiffrée des points faibles]".</p>
<p><strong>4. Savoir attendre</strong>. La plupart des vendeurs reviennent vers toi dans les 5 à 15 jours si ton offre est bien construite.</p>
<p>Template de lettre de contre-offre page 42.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 9, delay_days: 2, delay_hours: 0,
      subject: "Tu as tout ce qu'il faut maintenant (enfin presque)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Tu as fini le cahier. Bravo. Sincèrement.</p>
<p>Si tu as fait les exercices sérieusement, tu as entre tes mains :</p>
<ul>
<li>Ton pourquoi clair</li>
<li>Ton budget précis</li>
<li>Ta zone cible</li>
<li>Une méthode d'analyse d'annonces</li>
<li>Un business plan</li>
<li>Une checklist de visite</li>
<li>Une stratégie de négociation</li>
</ul>
<p>Tu as fait en 7 jours ce que 95% des gens ne font jamais.</p>
<p>Mais je vais être honnête avec toi.</p>
<p><strong>7 jours de travail ne remplacent pas 14 modules et 64 leçons.</strong></p>
<p>Tu as les bases. Il te manque les détails : le montage fiscal, la stratégie bancaire avancée, la gestion locative, la structuration juridique (SCI, LMNP réel, IS).</p>
<p>Ces détails, c'est ce que ES Academy couvre intégralement.</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 10, delay_days: 3, delay_hours: 0,
      subject: "Dernier mail (et un pont vers Academy)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>C'est mon dernier mail de la séquence cahier de vacances.</p>
<p>Tu vas continuer à recevoir ma newsletter (1 jeudi sur 2, 7h30).</p>
<p>Si tu veux continuer ta progression, deux options :</p>
<p><strong>1. ES Academy (998€)</strong> : la formation complète pour transformer les 7 exercices du cahier en un vrai portefeuille locatif.</p>
${cta("https://emeline-siron.fr/academy", "Découvrir Academy")}
<p><strong>2. Un appel de 30 min avec Antony (gratuit)</strong> : pour un diagnostic personnalisé de ton projet.</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Prendre un appel")}
<p>Bonne fin d'été,<br><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_CO : Chasse aux oeufs (semaine de Pâques)
// Trigger : tag lm:chasse-oeufs ajouté
// 6 mails : annonce, indice, J0, mi-parcours, dernier jour, clôture
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_CO = {
  name: "Welcome Chasse aux oeufs (SEQ_CO)",
  trigger_type: "tag_added",
  trigger_value: "lm:chasse-oeufs",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "{{prenom}}, la chasse aux oeufs démarre dans 7 jours",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Tu t'es inscrite à la chasse aux oeufs. Merci.</p>
<p><strong>Le principe :</strong> 5 oeufs cachés sur mes différents espaces (site, Instagram, YouTube, newsletter, podcast). Chaque oeuf contient un code.</p>
<p><strong>Les récompenses :</strong></p>
<ul>
<li>3 oeufs trouvés : un contenu bonus exclusif</li>
<li>5 oeufs trouvés : 50€ de réduction sur ES Academy</li>
</ul>
<p>Tout démarre dans 7 jours, le lundi de Pâques à 9h.</p>
<p>Je t'envoie le premier indice dans 4 jours pour que tu sois prête.</p>
<p>À bientôt,<br><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 4, delay_hours: 0,
      subject: "Premier indice (lis bien)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Dans 3 jours, la chasse démarre.</p>
<p><strong>Premier indice :</strong></p>
<p>Le premier oeuf se cache dans un article de blog qui parle d'une ville que je n'ai jamais habitée mais où j'ai 3 biens.</p>
<p>Si tu veux prendre de l'avance, tu peux déjà explorer mon blog : <a href="https://emeline-siron.fr/blog">emeline-siron.fr/blog</a>.</p>
<p>À lundi,<br><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 3, delay_hours: 0,
      subject: "C'est parti ! La chasse aux oeufs est ouverte",
      html_content: wrap(`<p>{{prenom}},</p>
<p>La chasse est ouverte depuis 9h ce matin.</p>
<p><strong>Les 5 oeufs sont cachés ici :</strong></p>
<ul>
<li>🥚 1 dans un article du blog</li>
<li>🥚 1 dans un épisode du podcast Out of the Box</li>
<li>🥚 1 dans une story Instagram (aujourd'hui)</li>
<li>🥚 1 dans une vidéo YouTube</li>
<li>🥚 1 dans un outil gratuit sur le site</li>
</ul>
<p>Chaque oeuf contient un code à 4 chiffres. Note-les, tu les saisiras à la fin.</p>
<p>Page de saisie des codes :</p>
${cta("https://emeline-siron.fr/chasse-oeufs/codes?email={{email}}", "Je saisis mes codes")}
<p>Tu as 7 jours. Go !</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 3, delay_hours: 0,
      subject: "Mi-parcours · tu bloques ?",
      html_content: wrap(`<p>{{prenom}},</p>
<p>On est à mi-parcours de la chasse.</p>
<p>Si tu bloques sur un des oeufs, voici quelques indices supplémentaires :</p>
<ul>
<li><strong>Blog :</strong> l'oeuf est dans l'article qui commence par "Comment j'ai..."</li>
<li><strong>Podcast :</strong> l'épisode contient le mot "autofinancement" dans le titre</li>
<li><strong>Instagram :</strong> je poste une nouvelle story chaque jour, l'oeuf apparaîtra quand tu l'auras trouvé</li>
<li><strong>YouTube :</strong> la vidéo fait entre 12 et 15 min</li>
<li><strong>Outil gratuit :</strong> l'oeuf est dans un simulateur</li>
</ul>
<p>Tu peux toujours saisir tes codes ici :</p>
${cta("https://emeline-siron.fr/chasse-oeufs/codes?email={{email}}", "Saisir mes codes")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 3, delay_hours: 0,
      subject: "Dernier jour · 24h pour tout retrouver",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Il te reste 24 heures avant la clôture.</p>
<p>Rappel des récompenses :</p>
<ul>
<li>3 oeufs = contenu bonus</li>
<li>5 oeufs = 50€ de réduction sur Academy</li>
</ul>
${cta("https://emeline-siron.fr/chasse-oeufs/codes?email={{email}}", "Je saisis mes codes")}
<p>Demain à minuit, la chasse se termine.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 6, delay_days: 1, delay_hours: 0,
      subject: "Merci pour ta participation (et prochain rdv)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>La chasse est finie. Merci d'avoir joué.</p>
<p>Si tu as gagné le code 50€, il est valable 30 jours sur ES Academy :</p>
${cta("https://emeline-siron.fr/academy", "Utiliser mon code 50€")}
<p>Prochain rendez-vous saisonnier : le <strong>cahier de vacances</strong> en juillet. 7 jours d'exercices pour construire ton premier projet d'investissement avant la rentrée.</p>
<p>En attendant, tu continues à recevoir la newsletter (1 jeudi sur 2, 7h30).</p>
<p>À bientôt,<br><strong>Emeline</strong></p>`),
    },
  ],
};

export const ALL_SEQUENCES_SPRINT3 = [SEQ_NM, SEQ_CV, SEQ_CO];
