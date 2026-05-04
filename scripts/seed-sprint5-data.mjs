// Sprint 5 : SEQ_PA_ACADEMY (post-achat Academy, 6 mails sur 30 jours).
// Tutoiement, ZÉRO em dash. Source de vérité : docs/sprint5/seq-pa-academy-v2.md
// Voix d'Emeline : storytelling direct, exemples chiffrés, pas de blabla.
//
// PLACEHOLDER À REMPLACER : CALENDLY_ANTONY_URL ci-dessous (Antony n'a pas encore
// activé son Calendly au 2026-05-04).

const SITE_URL = "https://emeline-siron.fr";
const COURSE_BASE = `${SITE_URL}/cours/methode-emeline-siron`;
const FAMILY_URL = `${SITE_URL}/family`;
// PLACEHOLDER : à remplacer quand Antony aura activé son Calendly
const CALENDLY_ANTONY_URL = "https://calendly.com/X/appel-academy";

const wrap = (body) => `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
${body}
<p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Tu reçois ce mail parce que tu as acheté ES Academy. <a href="{{unsubscribe_url}}" style="color: #888;">Je me désabonne</a>.</p>
</div>`;

const cta = (url, label) => `<p style="text-align: center; margin: 30px 0;"><a href="${url}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">${label}</a></p>`;

// ──────────────────────────────────────────────────────────────────────────
// SEQ_PA_ACADEMY : Post-achat Academy (6 mails sur 30 jours)
// Trigger : tag academy (posé par webhook Stripe après checkout.session.completed)
// ──────────────────────────────────────────────────────────────────────────

export const SEQ_PA_ACADEMY = {
  name: "Post-achat Academy (SEQ_PA_ACADEMY)",
  trigger_type: "tag_added",
  trigger_value: "academy",
  status: "draft",
  steps: [
    // ──────────────────────────────────────────────────────────────────
    // Mail 1 — J+1 — Bienvenue + cadre des 30 jours à venir
    // ──────────────────────────────────────────────────────────────────
    {
      step_order: 1, delay_days: 1, delay_hours: 0,
      subject: "{{prenom}}, c'est officiel",
      html_content: wrap(`<p>Salut {{prenom}},</p>

<p>Tu viens de faire un truc que 95% des gens qui rêvent d'investir ne feront jamais : t'engager pour avoir une méthode au lieu d'errer 18 mois dans le YouTube gratuit.</p>

<p>Bravo. Sincèrement.</p>

<p>Avant de te dire par où démarrer, je veux que tu prennes 2 minutes pour réaliser où tu en es.</p>

<p>Il y a quelques jours encore, tu te demandais peut-être si ça allait vraiment marcher pour toi. Si l'immo c'était pas un univers réservé aux héritiers, à ceux qui ont déjà du réseau, à ceux qui ont un profil entrepreneur dès le départ. Spoiler : non. Moi j'ai grandi dans un garage auto en banlieue parisienne. Pas de patrimoine familial. Pas de réseau. Pas de capital de départ. Aujourd'hui j'ai 55 locataires en gestion. Pas parce que j'avais un truc en plus, parce que j'ai appliqué une méthode à la lettre.</p>

<p>Cette méthode, c'est exactement celle que tu as entre les mains depuis hier.</p>

<p>Voilà ce qui va se passer dans les semaines à venir.</p>

<p>Tu vas démarrer par le Module 1, mindset. Pas par hasard. C'est la fondation. La majorité des gens veulent zapper pour aller direct sur les chiffres et la négociation. Erreur classique. Sans le bon cadre mental, les modules suivants glissent sur toi sans laisser de trace.</p>

<p>Tu vas aussi recevoir un mail de moi tous les 7 jours pendant un mois, avec des histoires précises de mes élèves, des galères que j'ai vécues, et des cadres pour avancer. Pas de spam. Pas de blabla. Que ce qui compte à ton stade.</p>

<p>Et ton accès Family t'attend (3 mois offerts, code dans ton mail de bienvenue d'hier), pour échanger avec des élèves qui sont déjà passés par là où tu es ce matin.</p>

<p>Maintenant tu fais une seule chose : tu ouvres Module 1.</p>

${cta(`${COURSE_BASE}/mindset`, "Démarrer le Module 1")}

<p>Dans 2 jours je te raconte mon premier immeuble et la galère qui m'a appris ce que 6 ans d'études immo ne m'avaient pas appris.</p>

<p>On y va.</p>

<p><strong>Emeline</strong></p>`),
    },

    // ──────────────────────────────────────────────────────────────────
    // Mail 2 — J+3 — Storytelling chaudière 8 logements (résilience)
    // ──────────────────────────────────────────────────────────────────
    {
      step_order: 2, delay_days: 3, delay_hours: 0,
      subject: "8 locataires sans chauffage, en plein hiver. Ma 1ère vraie leçon.",
      html_content: wrap(`<p>{{prenom}},</p>

<p>Été 2019. Je signe le compromis pour mon tout premier immeuble. 8 appartements à rénover entièrement.</p>

<p>Quelques mois plus tard, en plein hiver, mes 8 locataires viennent d'emménager. La chaudière commune lâche d'un coup. Il fait 4 degrés dehors.</p>

<p>Téléphones qui sonnent en boucle. Locataires qui ont froid (et qui ont bien raison de m'appeler). Moi je suis encore salariée à temps plein chez Lifento, à gérer 250 millions d'euros d'EHPAD en Europe la journée. Et là je découvre que je dois remplacer un système de chauffage complet pour 8 logements. Maintenant. Pas dans 3 semaines.</p>

<p>La pensée qui m'a traversé l'esprit ce matin-là : "j'ai fait une connerie, j'ai pas les épaules pour ça."</p>

<p>Je l'ai dit à personne. Mais je l'ai pensé fort.</p>

<p>Sauf que pendant que je me racontais cette histoire, mes locataires avaient toujours froid. J'ai donc fait ce que je faisais déjà dans mon job de gestionnaire de fonds : tableau Excel, 4 chauffagistes locaux contactés, le seul disponible sous 48h validé, devis signé, mail individuel à chaque locataire avec planning précis.</p>

<p>En 5 jours c'était réglé.</p>

<p>Voilà ce que je veux que tu retiennes ce matin.</p>

<p>Tu vas avoir des imprévus. Pas peut-être. C'est sûr. Une chaudière qui lâche, un locataire qui part en cours de bail, un voisin qui t'envoie un recommandé pour des nuisances inventées. Ça fait partie du métier d'investisseur. C'est pas le signe que tu n'es pas faite pour ça.</p>

<p>La vraie différence entre les investisseuses qui tiennent dans le temps et celles qui revendent au bout d'un an, c'est pas le talent ni le capital. C'est la méthode pour encaisser les imprévus à froid, sans paniquer.</p>

<p>C'est précisément ce que tu vas apprendre dans Academy, module après module.</p>

${cta(COURSE_BASE, "Continuer dans la formation")}

<p><strong>Emeline</strong></p>

<p style="font-size: 14px; color: #555;">PS : Cet immeuble rapporte aujourd'hui 3250€ de loyers mensuels pour 1250€ de crédit et 700€ de charges. La galère du chauffage ne pèse plus rien dans la balance.</p>`),
    },

    // ──────────────────────────────────────────────────────────────────
    // Mail 3 — J+7 — Check-in semaine 1 + activation Family
    // ──────────────────────────────────────────────────────────────────
    {
      step_order: 3, delay_days: 7, delay_hours: 0,
      subject: "{{prenom}}, tu as 4 trucs en main ?",
      html_content: wrap(`<p>{{prenom}},</p>

<p>Une semaine que tu es dans Academy. On fait le point honnêtement.</p>

<p>Tu devrais avoir 4 choses notées quelque part (carnet, fichier, Notion, peu importe le support).</p>

<ol>
<li>Ta ville cible. UNE, pas trois.</li>
<li>Ton secteur précis dans cette ville. À l'échelle de la rue si possible.</li>
<li>Tes 3 critères non-négociables.</li>
<li>Ta fourchette de prix réaliste (basée sur tes vrais chiffres, pas sur tes envies).</li>
</ol>

<p>Si tu as les 4 : tu es dans le bon rythme. Tu peux passer à la phase visites et au Module 5.</p>

<p>Si tu n'en as pas encore 4 : pas de panique, mais reviens en arrière. Sans ces fondations, les modules suivants vont t'embrouiller plutôt qu'aider. C'est exactement le piège que tu veux éviter.</p>

<p>Au passage, petit rappel utile. Avec ton achat Academy, tu as reçu un code cadeau pour 3 mois offerts dans Family, ma communauté immo. C'est dans ton mail de bienvenue. Si tu ne l'as pas encore activé, fais-le cette semaine. Tu vas y croiser des élèves qui sont passés par exactement où tu es aujourd'hui, et d'autres qui en sont sortis avec leur 1er bien signé. C'est précieux quand tu doutes.</p>

<p>Maintenant prends 5 minutes ce soir. Pose-toi vraiment, sans distraction. Et identifie pour toi le point précis où tu coinces dans ces 4 fondations. La clarté sur ton blocage, c'est déjà 80% du chemin pour le résoudre.</p>

${cta(FAMILY_URL, "Activer mon accès Family")}

<p><strong>Emeline</strong></p>`),
    },

    // ──────────────────────────────────────────────────────────────────
    // Mail 4 — J+14 — Sandra + push Module 5 (négociation)
    // ──────────────────────────────────────────────────────────────────
    {
      step_order: 4, delay_days: 14, delay_hours: 0,
      subject: "Elle a osé proposer 80% du prix. Le vendeur a dit oui.",
      html_content: wrap(`<p>{{prenom}},</p>

<p>Le bien était affiché 165 000€. Sandra a proposé 132 000€.</p>

<p>80% du prix demandé. Sans rougir. Sans excuse.</p>

<p>Sandra, c'est une de mes élèves. 30 ans, infirmière en service de nuit à Lyon, jamais investi avant. Quand elle a rejoint mes formations en novembre, elle me disait "Emeline, je n'ai jamais négocié un prix de ma vie, même pas une voiture d'occasion. Je vais geler au moment de proposer."</p>

<p>Elle a quand même appliqué la méthode du Module 5, à la lettre, en tremblant.</p>

<p>Elle a envoyé son offre par mail à l'agence, le matin de bonne heure pour ne pas avoir le temps de se dégonfler. Texte court, justifié sur 3 points, avec sa préqualification bancaire en pièce jointe pour montrer qu'elle était sérieuse.</p>

<p>Le vendeur a contre-proposé à 142 000€. Elle a signé.</p>

<p>23 000€ d'économisés. Soit l'équivalent de presque 3 ans d'autofinancement gagnés AVANT même d'avoir mis la clé dans la serrure.</p>

<p>Ce qu'il faut que tu retiennes : la négociation ce n'est pas une option, c'est LE moment où tu fais ton autofinancement. Pas quand le locataire entre dans le bien. Quand tu signes le compromis.</p>

<p>Et "oser", ça n'est pas un trait de caractère. C'est une méthode. C'est dans le script du Module 5 (analyse technique, section négociation), tu envoies, tu attends. Tu ne discutes pas par téléphone (c'est là qu'on flanche), tu écris.</p>

${cta(`${COURSE_BASE}/analyse-technique`, "Module 5 - La négociation")}

<p><strong>Emeline</strong></p>

<p style="font-size: 14px; color: #555;">PS : Sandra avait peur. Elle a fait quand même. C'est ça qui change tout.</p>`),
    },

    // ──────────────────────────────────────────────────────────────────
    // Mail 5 — J+21 — Cap mental "savoir vs faire"
    // ──────────────────────────────────────────────────────────────────
    {
      step_order: 5, delay_days: 21, delay_hours: 0,
      subject: "Ton cerveau veut te garder en sécurité. Ne le laisse pas faire.",
      html_content: wrap(`<p>{{prenom}},</p>

<p>3 semaines dans Academy. La phase confortable se termine maintenant.</p>

<p>Ton cerveau va te jouer un tour cette semaine. Je veux que tu le voies venir.</p>

<p>Il va te dire un truc qui ressemble à ça : "j'ai encore besoin d'un peu plus de formation avant de passer à l'action". Il va te suggérer de finir TOUS les modules avant de bouger. De lire 2 livres immo en plus. De regarder 3 chaînes YouTube de plus. D'attendre la rentrée. D'attendre les taux. D'attendre.</p>

<p>C'est un piège. Et il est puissant parce qu'il a l'air raisonnable.</p>

<p>Ton cerveau veut une seule chose : te garder en sécurité. Et la sécurité pour lui, c'est la zone "j'apprends". Tant que tu apprends, tu peux pas te planter. Tu peux être jugée par ta famille qui pense de l'immobilier "c'est risqué". Tu peux perdre d'argent. Tu peux te tromper.</p>

<p>Sauf que l'apprentissage sans action, c'est de la procrastination déguisée en sérieux. Au bout de 6 mois, tu auras tout regardé, tu auras lu, écouté en podcast, et tu n'auras toujours pas un bien à ton nom.</p>

<p>Voilà le cadre pour les 30 prochains jours.</p>

<p>Tu choisis UNE action concrète, irréversible, et tu la fais cette semaine. Pas la semaine prochaine. Cette semaine.</p>

<p>Quelques exemples qui marchent :</p>
<ul>
<li>Mandater 1 chasseur immo dans ta ville cible</li>
<li>Faire évaluer ta capacité d'emprunt par 2 banques avec rendez-vous calé</li>
<li>Bloquer 2 weekends visites avec 5 biens minimum à voir</li>
<li>Présenter ton dossier complet à 1 banque</li>
</ul>

<p>UNE action. Une seule. Pas dix. Une que tu fais vraiment, dont tu ne peux pas revenir en arrière.</p>

<p>Concrètement : prends 5 minutes ce soir, écris ton action sur un post-it que tu colles sur ton écran de travail, avec la date butoir. Visible tous les jours. C'est tout.</p>

<p>Et si tu veux en parler à des gens qui comprennent ce que tu vis, ton accès Family est là pour ça. Tu y croises des élèves exactement à ton stade, et d'autres qui en sont sortis. Le partage avec des pairs vaut 10 fois plus qu'un mail de moi.</p>

${cta(FAMILY_URL, "Rejoindre Family")}

<p><strong>Emeline</strong></p>

<p style="font-size: 14px; color: #555;">PS : La différence entre les élèves d'Evermind qui ont signé leur 1er bien et celles qui ne l'ont pas fait ? C'est pas le QI. C'est qu'à un moment elles ont arrêté d'apprendre et elles ont commencé à faire.</p>`),
    },

    // ──────────────────────────────────────────────────────────────────
    // Mail 6 — J+30 — Pitch coaching Antony (PLACEHOLDER Calendly)
    // ──────────────────────────────────────────────────────────────────
    {
      step_order: 6, delay_days: 30, delay_hours: 0,
      subject: "Si tu sens qu'il te manque un truc, lis ça",
      html_content: wrap(`<p>{{prenom}},</p>

<p>1 mois dans Academy. Court pour avoir signé. Long pour avoir clarifié ta stratégie.</p>

<p>Si tu n'as pas encore acheté à 1 mois, c'est NORMAL. La moyenne de mes élèves c'est 5 à 7 mois entre l'inscription et la première signature. Tu es dans les temps.</p>

<p>Mais peut-être qu'à ce stade tu sens un truc que les modules seuls ne couvrent pas.</p>

<p>Tu as besoin de quelqu'un qui regarde TON dossier, TES chiffres, TA ville, TA stratégie. Pas un cours générique consommé seule devant ton écran. Du vrai sur-mesure, sur tes vraies données.</p>

<p>C'est exactement à ça que sert le coaching personnalisé que je propose à côté d'Academy.</p>

<p>Tout est construit sur-mesure. Pas de package figé, pas de formule type. Le format se dessine en fonction de ton stade, de ta vitesse, de ton niveau d'autonomie sur ton dossier, et de ce que tu veux atteindre dans les 6 prochains mois.</p>

<p>Pour caler ce qui te correspond vraiment (et ne pas payer pour quelque chose qui ne sert pas tes objectifs), tu prends un appel avec Antony. C'est mon associé sur les inscriptions Academy depuis 2 ans. Il connaît tous les profils d'élèves, il sait identifier en 30 minutes ce dont tu as vraiment besoin et te proposer la formule de coaching qui correspond à ta situation.</p>

<p>C'est un appel commercial, je vais pas te le cacher. Mais c'est aussi le moyen le plus efficace d'identifier le bon accompagnement avec là où tu en es.</p>

${cta(CALENDLY_ANTONY_URL, "Prendre un appel avec Antony")}

<p>Si tu préfères continuer en autonomie avec Academy + Family, c'est totalement OK aussi. Tu as tout ce qu'il faut entre les mains, et tu progresses à ton rythme.</p>

<p>À très bientôt,</p>

<p><strong>Emeline</strong></p>

<p style="font-size: 14px; color: #555;">PS : Si tu n'as pas encore activé ton accès Family (3 mois offerts avec ton achat Academy), le code est dans ton mail de bienvenue. C'est le moment.</p>`),
    },
  ],
};

export const ALL_SEQUENCES_SPRINT5 = [SEQ_PA_ACADEMY];
