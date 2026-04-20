// Données du seed Sprint 2 : séquences SEQ_MC, SEQ_BRV, SEQ_SIM + 3 branches SEQ_QZ.
// Extrait du brief Parcours Client v1.0 (sections 7.2, 7.3, 7.4, 7.5).
// ZÉRO em dash dans aucun mail. Tutoiement partout.

const wrap = (body) => `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
${body}
<p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Tu reçois ce mail parce que tu t'es inscrite sur emeline-siron.fr. <a href="{{unsubscribe_url}}">Je me désabonne</a>.</p>
</div>`;

const cta = (url, label) => `<p style="text-align: center; margin: 30px 0;"><a href="${url}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">${label}</a></p>`;

// ──────────────────────────────────────────────────────────────────────────
// SEQ_MC : Welcome Masterclass (7 mails)
// Trigger : tag lm:masterclass ajouté
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_MC = {
  name: "Welcome Masterclass (SEQ_MC)",
  trigger_type: "tag_added",
  trigger_value: "lm:masterclass",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "Voici ta masterclass + un conseil important avant de cliquer",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Merci de t'être inscrite à la masterclass "Les 3 décisions qui séparent un investisseur rentable d'un propriétaire bailleur qui galère".</p>
<p>Voici ton accès direct :</p>
${cta("https://emeline-siron.fr/masterclass/watch?email={{email}}", "Je regarde la masterclass")}
<p><strong>Un conseil avant de cliquer.</strong></p>
<p>La masterclass fait 58 minutes. Ce n'est pas une vidéo à mettre en fond pendant que tu fais autre chose. Bloque-toi un créneau. Prends des notes. Mets ton téléphone en mode avion.</p>
<p>Si tu regardes distraitement, tu vas louper les 3 décisions cruciales que j'explique. Et tu feras partie des 95% de gens qui connaissent la théorie sans jamais passer à l'action.</p>
<p>Si tu regardes concentrée, tu vas ressortir avec une clarté mentale que tu n'as probablement pas eue depuis des mois.</p>
<p>À toi de choisir.</p>
${cta("https://emeline-siron.fr/masterclass/watch?email={{email}}", "Je regarde la masterclass (58 min)")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 1, delay_hours: 0,
      subject: "Tu l'as regardée ou pas encore ?",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je ne veux pas te harceler, mais je vérifie.</p>
<p>Hier tu t'es inscrite à ma masterclass. Tu ne l'as pas encore regardée (ou alors tu l'as juste survolée).</p>
<p>Si tu veux que je t'accompagne sur la suite (séquence de valeur, étude de cas élèves), il faut que tu l'aies regardée au moins une fois. Sinon je te parle dans le vide.</p>
<p>Je te remets le lien :</p>
${cta("https://emeline-siron.fr/masterclass/watch?email={{email}}", "Je regarde la masterclass maintenant")}
<p>Si tu n'as plus envie, dis-le moi en répondant à ce mail (juste "non merci" suffit), et je te sors de la liste sans drame.</p>
<p><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;">PS : si tu l'as déjà regardée, ignore ce mail. Je continue demain avec ce qui suit logiquement.</p>`),
    },
    {
      step_order: 3, delay_days: 2, delay_hours: 0,
      subject: "L'erreur qui m'a coûté 28 000€ (ne la fais pas)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Dans la masterclass, je parle des 3 décisions cruciales. Mais il y a une 4e décision dont je ne parle pas là, parce qu'elle est plus technique.</p>
<p><strong>C'est la décision du montage fiscal.</strong></p>
<p>À mes débuts, j'ai fait le choix du LMNP au micro-BIC. Simple, rapide. J'ai cru que j'économisais du temps.</p>
<p>Résultat : <strong>28 000€ d'impôts payés sur 4 ans</strong> que j'aurais pu amortir totalement si j'avais été en LMNP au régime réel dès le départ.</p>
<p>28 000€. Sur un seul bien. Pour une erreur qui m'aurait pris 2 heures de réflexion en plus.</p>
<p>C'est exactement le genre d'angle mort qu'on ne voit pas quand on se lance. Et c'est aussi pour ça que j'ai construit ES Academy. Pour que tu ne répètes pas mes erreurs.</p>
<p>Si tu veux voir le programme complet :</p>
${cta("https://emeline-siron.fr/academy", "Découvrir ES Academy")}
<p>Pas d'obligation, juste pour info.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 2, delay_hours: 0,
      subject: "1 800 élèves, 4,9/5 sur Trustpilot. Tu veux voir ce qu'ils disent ?",
      html_content: wrap(`<p>{{prenom}},</p>
<p>J'ai coaché environ 1 800 élèves depuis 2018.</p>
<p>Certains ont fait leur premier investissement dans les 6 mois après la formation. D'autres ont attendu 18 mois parce que la vie avait d'autres priorités.</p>
<p><strong>Quelques chiffres dont je suis fière :</strong></p>
<ul>
<li>Note moyenne sur Trustpilot : 4,9/5 (452 avis)</li>
<li>Taux de passage à l'action (au moins 1 bien acheté dans l'année) : 68%</li>
<li>Autofinancement positif moyen des élèves actifs : 620€/mois par bien</li>
</ul>
<p><strong>Voici 3 témoignages qui m'ont marquée :</strong></p>
<blockquote style="border-left: 3px solid #1B4332; padding-left: 15px; margin: 20px 0; font-style: italic; color: #555;">"J'ai acheté mon premier bien à Lyon, 35m², 98 000€, loyer 610€/mois. Autofinancement positif de 180€/mois. Sans la méthode, je tournais en rond depuis 2 ans." Clémence, 31 ans</blockquote>
<blockquote style="border-left: 3px solid #1B4332; padding-left: 15px; margin: 20px 0; font-style: italic; color: #555;">"La partie sur la négociation bancaire m'a changé la vie. J'ai obtenu un différé total d'un an et un taux à 3,2% alors que la concurrence me refusait." Thomas, 42 ans</blockquote>
<blockquote style="border-left: 3px solid #1B4332; padding-left: 15px; margin: 20px 0; font-style: italic; color: #555;">"Ma formation s'est rentabilisée sur mon premier bien : je l'ai acheté 22 000€ sous le prix du marché grâce à la méthode de négociation." Aurélie, 29 ans</blockquote>
<p>Si tu veux voir tous les avis, ils sont sur Trustpilot.</p>
<p>Et si tu veux rejoindre la prochaine promo :</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 2, delay_hours: 0,
      subject: "Oui mais… (les 3 objections que j'entends tout le temps)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>"Oui mais je ne suis pas sûre que ce soit pour moi."</p>
<p>Je l'entends au moins 3 fois par semaine. Et à chaque fois, je décode l'objection réelle derrière. Il y en a 3 principales.</p>
<p><strong>Objection 1 : "C'est trop cher."</strong><br>998€ te semble peut-être beaucoup. Regarde-le autrement. Tu vas signer un crédit de 150 à 300K€. L'écart entre un dossier moyen et un dossier excellent, c'est 20 à 40K€ sur la durée. La formation se rentabilise sur ton premier bien, pas au bout de 3 ans.</p>
<p><strong>Objection 2 : "Je peux apprendre tout ça gratuitement sur YouTube."</strong><br>En théorie, oui. En pratique, tu vas passer 200 heures à trier le vrai du faux, et à te retrouver avec 15 méthodes contradictoires. Puis tu vas passer à l'action sans savoir quoi choisir, et tu vas te planter sur un détail qui va te coûter 10K€. Une formation structurée, c'est gagner 2 ans.</p>
<p><strong>Objection 3 : "Je ne suis pas prête."</strong><br>Tu ne seras jamais "prête à 100%". Personne ne l'est. Le premier investissement se fait toujours avec 15% de doute résiduel. C'est le prix à payer pour entrer dans le jeu.</p>
<p>Si ces 3 objections te parlent, on les traite en 30 min avec Antony (mon closer). Pas de vente forcée, juste un échange honnête.</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel avec Antony")}
<p>Ou directement :</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 6, delay_days: 3, delay_hours: 0,
      subject: "Il reste quelques jours pour le bonus rentrée",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Un rappel rapide.</p>
<p>Actuellement, en rejoignant ES Academy, tu as un bonus qui disparaît bientôt :</p>
<p><strong>Bonus :</strong> 3 mois d'ES Family offerts pour tous les nouveaux élèves (valeur : 87€).</p>
<p>ES Family, c'est ma communauté privée (lives mensuels, analyses vidéo flash, opportunités exclusives, sous-groupes experts par thématique). Habituellement, c'est 29€/mois.</p>
<p>Pour les élèves Academy, c'est offert pendant 3 mois, pour faciliter ton apprentissage en groupe. Et si tu veux continuer après les 3 mois, c'est 29€/mois (résiliable en 1 clic).</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy + ES Family offerts")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 7, delay_days: 3, delay_hours: 0,
      subject: "Dernier mail commercial (promis)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>C'est mon dernier mail dédié à la vente d'ES Academy pour l'instant.</p>
<p>Si tu ne rejoins pas maintenant, ce n'est pas grave. Tu continueras à recevoir :</p>
<ul>
<li>Ma newsletter (1 jeudi sur 2, 7h30)</li>
<li>Mes épisodes de podcast Out of the Box (chaque mardi)</li>
<li>Mes autres ressources gratuites</li>
</ul>
<p>Et le jour où tu seras prête, ES Academy sera toujours là.</p>
<p>Mais si tu es sur le point de te décider et qu'il te manque juste une info, réponds à ce mail, je te réponds personnellement.</p>
<p>Ou prends directement rendez-vous avec Antony :</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel")}
<p>Bonne continuation,<br><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_BRV : Migration Brevo cohorte 2 (2 mails)
// Trigger : tag rgpd:cohorte-2-pending ajouté
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_BRV = {
  name: "Migration Brevo cohorte 2 (SEQ_BRV)",
  trigger_type: "tag_added",
  trigger_value: "rgpd:cohorte-2-pending",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "{{prenom}}, est-ce qu'on continue ?",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Tu es inscrite à ma newsletter depuis un moment (merci !), et je veux faire les choses proprement.</p>
<p>Je change d'infrastructure email en mai 2026. Pour te transférer sur la nouvelle, j'ai besoin de ton accord explicite.</p>
<p><strong>Si tu veux continuer à recevoir :</strong></p>
<ul>
<li>Mes contenus sur l'investissement immobilier (newsletter bi-mensuelle, jeudi 7h30)</li>
<li>Mes épisodes de podcast Out of the Box</li>
<li>Mes ressources gratuites (masterclass, quiz, simulateurs)</li>
</ul>
${cta("https://emeline-siron.fr/reoptin?email={{email}}", "Oui, je veux rester dans la communauté")}
<p>Si tu ne cliques pas, aucun souci. Je comprends. Tu seras automatiquement retirée de ma base, et tu ne recevras plus rien de ma part.</p>
<p>Et si tu veux aller plus loin, je t'ai préparé un cadeau en bonus pour le re-opt-in : un accès direct à ma masterclass fondatrice (60 min) sur les 3 décisions qui séparent un investisseur rentable d'un propriétaire qui galère. Elle n'est pas en accès libre.</p>
<p>À tout de suite,<br><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;">PS : tu peux aussi répondre à ce mail avec "oui" ou "non". Je trie à la main.</p>`),
    },
    {
      step_order: 2, delay_days: 7, delay_hours: 0,
      subject: "Dernier rappel (vraiment)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je te promets, c'est le dernier mail.</p>
<p>Je suis en train de basculer ma base email vers une nouvelle infrastructure le 15 mai. Si tu ne cliques pas sur le bouton ci-dessous d'ici là, tu seras retirée.</p>
<p>Ce n'est pas un drame. Mais si tu veux continuer à recevoir mes contenus, mes ressources gratuites, mes updates, c'est maintenant.</p>
${cta("https://emeline-siron.fr/reoptin?email={{email}}", "Je veux rester dans la communauté")}
<p>Si tu cliques, tu reçois en bonus ma masterclass fondatrice gratuitement.</p>
<p>Si tu ne cliques pas, aucun souci. Je te souhaite le meilleur pour la suite.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_SIM : Welcome Simulateur (5 mails)
// Trigger : tag lm:simulateur-rentabilite ajouté
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_SIM = {
  name: "Welcome Simulateur (SEQ_SIM)",
  trigger_type: "tag_added",
  trigger_value: "lm:simulateur-rentabilite",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "Ton analyse de rentabilité + 3 points à vérifier",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Merci d'avoir utilisé mon simulateur.</p>
${cta("https://emeline-siron.fr/simulateurs/rentabilite-locative", "Je consulte mon analyse")}
<p><strong>3 points à vérifier dans ton analyse :</strong></p>
<p><strong>1. La rentabilité brute est bonne mais la rentabilité nette-nette (après impôts) change tout.</strong><br>Si tu es en location nue et en TMI 30%, tu perds souvent 30 à 40% de rendement. La solution : choisir le bon régime fiscal (LMNP réel, micro-BIC, SCI IS) selon ton profil.</p>
<p><strong>2. Ton effort d'épargne mensuel (ce que tu mets de ta poche).</strong><br>S'il est positif, tu es en autofinancement. Bravo. S'il est négatif, ton crédit n'est pas bien calibré. On peut le fixer (différé, durée, assurance).</p>
<p><strong>3. Ta capacité de réinvestissement.</strong><br>Combien de temps après le 1er bien tu peux en racheter un autre ? C'est ce qui sépare un investisseur ponctuel d'un vrai bâtisseur de patrimoine.</p>
<p>Si tu veux aller plus loin sur ces 3 points, je te propose de regarder ma masterclass gratuite :</p>
${cta("https://emeline-siron.fr/masterclass", "Je regarde la masterclass")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 2, delay_hours: 0,
      subject: "Autofinancement positif ≠ bon investissement (lis ça avant d'acheter)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Tu viens peut-être de calculer ton autofinancement avec mon simulateur. Si le résultat est positif, tu es peut-être en train de sourire.</p>
<p>Attention, je vais t'arrêter 2 minutes.</p>
<p><strong>Un "autofinancement positif" sur papier ne veut pas forcément dire un bon investissement.</strong></p>
<p>Voici 4 pièges que le simulateur ne peut pas détecter tout seul :</p>
<p><strong>1. Les vacances locatives.</strong> Si tu es dans une zone tendue, OK. Sinon, compte 1 à 2 mois sans loyer par an. Ça peut transformer un +150€/mois en -50€/mois.</p>
<p><strong>2. Les travaux d'entretien.</strong> Chaudière, fuite, VMC, peinture. Budget minimum : 10% du loyer annuel en provision.</p>
<p><strong>3. La taxe foncière qui augmente.</strong> Elle monte de 3 à 5% par an en ce moment. Sur 10 ans, c'est 30 à 60% de plus.</p>
<p><strong>4. L'impayé.</strong> Tu peux te faire sortir 8 à 18 mois de loyer si un locataire ne paie pas (procédure d'expulsion = 1 an minimum).</p>
<p>Mon simulateur te donne la rentabilité théorique. Ma formation te donne la rentabilité réelle, après toutes les surprises.</p>
${cta("https://emeline-siron.fr/academy", "Découvrir ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 3, delay_hours: 0,
      subject: "Tu veux aller plus loin ? Fais mon quiz (5 min, 100% vidéo)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Le simulateur t'a donné une photo de ton projet. Mais il te manque encore une chose : savoir si TU es prête à gérer tout ça.</p>
<p>Parce qu'un projet rentable sur le papier, géré par quelqu'un qui n'a pas les bons réflexes, ça se plante quand même.</p>
<p><strong>J'ai conçu un quiz vidéo interactif</strong> (40 vidéos, 5 min).</p>
<p>Tu es mise en situation dans 9 scénarios réels (négociation, visite, banque, travaux, locataire impayé, fiscalité). Chaque réponse te donne un retour immédiat de ma part. Tu ressors avec un score sur 10 et un retour personnalisé.</p>
${cta("https://emeline-siron.fr/quiz-investisseur", "Je fais le quiz (gratuit)")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 2, delay_hours: 0,
      subject: "+420€/mois sur un studio à Paris (oui, c'est possible)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Ça fait quelques années que je coach et j'ai vu tout et n'importe quoi. Mais certaines études de cas restent gravées.</p>
<p><strong>Claire, 34 ans, consultante en stratégie.</strong><br>Elle voulait investir à Paris (tout le monde me dit que c'est impossible d'être rentable). Budget total : 240 000€ (apport + crédit).</p>
<p>Elle a acheté un studio de 18m² en 2022, dans le 19e, pour 180 000€.<br>Loyer : 920€/mois en colocation étudiante (oui, 18m² en coloc'). Travaux : 35 000€. Total projet : 215 000€.</p>
<p><strong>Résultat après travaux et location :</strong></p>
<ul>
<li>Loyer : 920€/mois</li>
<li>Mensualité crédit (sur 25 ans, taux 2,9%) : 850€/mois</li>
<li>Charges + taxe foncière + provisions : 100€/mois</li>
<li>Autofinancement : -30€/mois</li>
</ul>
<p><strong>MAIS avec l'optimisation fiscale (LMNP réel, amortissement) :</strong></p>
<ul>
<li>0€ d'impôts pendant 8 ans grâce à l'amortissement</li>
<li>Elle récupère 290€/mois en gain fiscal</li>
<li>Autofinancement réel : +260€/mois</li>
</ul>
<p>Claire est passée de "impossible à Paris" à "+3 100€/an net d'impôt" grâce à une méthode.</p>
<p>C'est exactement ce genre de méthode que tu apprends dans ES Academy.</p>
${cta("https://emeline-siron.fr/academy", "Je veux la méthode complète")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 3, delay_hours: 0,
      subject: "Je te laisse respirer (et une dernière chose)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je te laisse respirer après ces quelques mails.</p>
<p>Si tu es prête à te lancer : <a href="https://emeline-siron.fr/academy">Je rejoins ES Academy</a><br>Si tu veux un échange direct avec mon équipe : <a href="https://emeline-siron.fr/coaching/decouverte">Je prends un appel avec Antony</a></p>
<p>Dans les jours qui viennent, tu vas recevoir ma newsletter bi-mensuelle (jeudi 7h30). Je te partage mes réflexions, mes études de cas, mes coulisses, sans pression commerciale.</p>
<p><strong>Tu peux aussi me suivre ici :</strong></p>
<ul>
<li>Instagram : @emelinesiron</li>
<li>LinkedIn : Emeline Siron</li>
<li>Podcast Out of the Box : chaque mardi, 30 min</li>
</ul>
<p>Merci d'être là.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_QZ_LOW : Welcome Quiz branche "Tu perds de l'argent" (0-4 points)
// Trigger : tag quiz-score:0-4 ajouté
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_QZ_LOW = {
  name: "Welcome Quiz - Profil 0-4 (SEQ_QZ_LOW)",
  trigger_type: "tag_added",
  trigger_value: "quiz-score:0-4",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "Ton résultat : 0 à 4/10 (ne flippe pas, je t'explique)",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Tu viens de finir le quiz. Bravo d'avoir eu le courage d'aller jusqu'au bout.</p>
<p>Ton score : {{quiz_score}}/10. Ton profil : <strong>Tu perds de l'argent</strong>.</p>
<p>Je sais que ce résultat n'est pas celui que tu espérais. Ne flippe pas, je t'explique.</p>
<p>Ça ne veut pas dire que tu es incapable d'investir. Ça veut dire que si tu achetais aujourd'hui, tu ferais probablement entre 3 et 7 erreurs significatives. Et en immo, chaque erreur coûte entre 5 et 30 000€.</p>
<p>La bonne nouvelle : ces erreurs sont 100% évitables avec la bonne méthode.</p>
<p>Dans les prochains jours, je vais te transmettre les bases que je donnerais à quelqu'un qui démarre de zéro. Sans pression, sans vente forcée.</p>
<p>Première étape : regarde ma masterclass gratuite. C'est là que je pose les 3 décisions qu'il faut absolument comprendre avant d'acheter.</p>
${cta("https://emeline-siron.fr/masterclass", "Je regarde la masterclass gratuite")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 2, delay_hours: 0,
      subject: "Les 3 piliers que 95% des gens ignorent",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Tu as un score bas au quiz. Ce n'est pas grave, c'est même une excellente nouvelle : tu sais par où tu dois commencer.</p>
<p><strong>Voici les 3 piliers que 95% des débutants ignorent :</strong></p>
<p><strong>1. Le "pourquoi" clair.</strong> La plupart des gens achètent un bien parce qu'ils veulent "faire de l'investissement locatif". C'est flou. Le bon pourquoi : "je veux générer 800€/mois d'autofinancement positif dans 3 ans pour financer les études de mes enfants". Précis. Chiffré. Daté.</p>
<p><strong>2. L'étude de marché locale.</strong> Pas YouTube. Pas Instagram. Tu vas physiquement dans la ville, tu visites 15 biens comparables, tu parles à 3 agents, tu passes 1 heure chez un notaire local. Sans ça, tu achètes à l'aveugle.</p>
<p><strong>3. La simulation bancaire AVANT le bien.</strong> Tu vois ton banquier avant de commencer à chercher. Tu sais exactement combien il peut te prêter, à quel taux, à quelles conditions. Sinon tu tombes amoureuse d'un bien que tu ne peux pas financer.</p>
<p>Ces 3 piliers sont la base de tout ce que je transmets dans ES Academy.</p>
${cta("https://emeline-siron.fr/masterclass", "Je regarde la masterclass gratuite")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 2, delay_hours: 0,
      subject: "De 0 à 1 bien en 12 mois sans apport (l'histoire de Sarah)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je vais te parler de Sarah.</p>
<p>Quand on s'est rencontrées en 2022, elle avait 28 ans, travaillait en tant qu'assistante commerciale (1 900€ net/mois), et n'avait que 3 000€ d'épargne.</p>
<p>Elle m'a dit : "Je sais que je ne peux pas acheter tout de suite. Mais je veux me former pour être prête dans 2 ans."</p>
<p>12 mois plus tard (pas 2 ans), elle a signé son premier achat.</p>
<p>Comment ? Pas de magie. Juste 3 décisions bien prises :</p>
<ul>
<li>Elle a bossé son dossier bancaire pendant 6 mois (épargne régulière, 0 découvert, 0 conso en cours)</li>
<li>Elle a ciblé une petite ville à 2h de Paris où les prix étaient 3x plus bas</li>
<li>Elle a acheté un studio à 48 000€ avec 0€ d'apport (crédit à 110%)</li>
</ul>
<p>Résultat : loyer 420€/mois, mensualité 310€/mois, autofinancement +50€/mois.</p>
<p>Petit ? Oui. Mais c'est son premier. Et le deuxième arrive dans 18 mois.</p>
<p>Sarah a fait ES Academy. Si tu veux commencer pareil, la porte est ouverte :</p>
${cta("https://emeline-siron.fr/academy", "Découvrir ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 2, delay_hours: 0,
      subject: "La masterclass qui va te remettre sur les rails",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Depuis le quiz, je t'envoie de la valeur gratuite. C'est normal : je ne vais pas essayer de te vendre quelque chose avant que tu aies la base.</p>
<p>Si tu n'as pas encore regardé ma masterclass fondatrice (58 min), c'est le moment.</p>
<p>Elle couvre :</p>
<ul>
<li>Les 3 décisions cruciales à prendre avant d'acheter</li>
<li>Les 4 pièges qui ruinent 80% des investisseurs débutants</li>
<li>Comment structurer ton premier dossier bancaire</li>
</ul>
${cta("https://emeline-siron.fr/masterclass", "Je regarde la masterclass")}
<p>Bloque-toi 1 heure au calme. C'est peut-être la meilleure heure que tu investiras cette année.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 2, delay_hours: 0,
      subject: "Et si on regardait ensemble par où commencer ?",
      html_content: wrap(`<p>{{prenom}},</p>
<p>C'est mon dernier mail de cette séquence.</p>
<p>Si tu veux aller plus loin, j'ai 2 options pour toi :</p>
<p><strong>Option 1 : tu veux te former sérieusement.</strong><br>ES Academy est à 998€. 14 modules, 64 leçons, accès à vie. Pour les femmes qui veulent passer d'idée à action dans les 6 mois.</p>
${cta("https://emeline-siron.fr/academy", "Découvrir ES Academy")}
<p><strong>Option 2 : tu ne sais pas par où commencer et tu veux qu'on en parle.</strong><br>Antony (mon closer) prend un appel de 30 min avec toi. Pas de vente forcée. Juste un diagnostic honnête : est-ce le bon moment pour toi ? Quelle est la prochaine étape ?</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel découverte (gratuit)")}
<p>Dans tous les cas, tu resteras sur ma newsletter. Tu continueras à recevoir du contenu de valeur gratuitement.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_QZ_MID : Welcome Quiz branche "Opération blanche" (5-8 points)
// Trigger : tag quiz-score:5-8 ajouté
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_QZ_MID = {
  name: "Welcome Quiz - Profil 5-8 (SEQ_QZ_MID)",
  trigger_type: "tag_added",
  trigger_value: "quiz-score:5-8",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "Ton résultat : 5 à 8/10 (c'est pas si mal, mais…)",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Tu viens de finir le quiz. Bravo.</p>
<p>Ton score : {{quiz_score}}/10. Ton profil : <strong>Opération blanche</strong>.</p>
<p>Qu'est-ce que ça veut dire ?</p>
<p>Tu as des bases solides. Tu ne pars pas de zéro. Tu as un raisonnement logique et une certaine maturité sur l'investissement locatif.</p>
<p>Mais tu as aussi fait 2 à 5 erreurs significatives. Et dans l'immo, une seule erreur sur une opération peut te coûter 10 à 30 000€.</p>
<p>Tu serais capable, aujourd'hui, de trouver un bien qui s'autofinance (le loyer couvre la mensualité). Mais si ton objectif est de faire de l'autofinancement positif (de l'argent qui reste dans ta poche chaque mois), il te manque encore des briques.</p>
<p><strong>Ce qui te fait passer de "opération blanche" à "autofinancement positif", c'est :</strong></p>
<ul>
<li>La stratégie de départ (le "pourquoi" bien défini)</li>
<li>L'étude de marché locale (pas copier ce que tu vois sur Insta)</li>
<li>La négociation (pas gratter pour gratter)</li>
<li>Le montage fiscal (LMNP, SCI à l'IS, selon ton profil)</li>
</ul>
<p>Je vais te montrer comment combler tous ces trous dans les prochains jours.</p>
<p>Mais avant ça, je veux te poser une question simple :</p>
<p><em>Si tu devais investir demain, tu irais jusqu'au bout ? Ou tu attendrais "encore un peu" ?</em></p>
<p>Réponds à ce mail, je te lis.</p>
<p><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;">PS : tu as aussi accès à mon simulateur de rentabilité gratuit pour tester tes projets : <a href="https://emeline-siron.fr/simulateurs/rentabilite-locative">je l'utilise</a>.</p>`),
    },
    {
      step_order: 2, delay_days: 2, delay_hours: 0,
      subject: "L'erreur que 80% des investisseurs font (et que toi aussi, sûrement)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je vais te raconter une histoire vraie.</p>
<p>En 2018, j'ai coaché une femme (appelons-la Marie) qui voulait faire son premier investissement locatif. Salaire correct. Épargne dispo. Motivation au taquet.</p>
<p>Elle m'a présenté son projet : un T2 à Lille, 150 000€, loyer estimé 650€/mois. Elle avait déjà fait son offre. Elle attendait juste ma validation.</p>
<p>J'ai regardé les chiffres 2 minutes. Et je lui ai dit : "Marie, annule ton offre."</p>
<p>Elle m'a regardée comme si j'étais folle.</p>
<p>Le problème ? Elle n'avait pas fait d'étude de marché local sérieuse. Elle avait pris le loyer "qu'elle pensait faire" au lieu du loyer "que le marché va vraiment payer".</p>
<p><strong>Résultat : son loyer réaliste était à 550€, pas 650€. Sur 25 ans de crédit, ça représentait 30 000€ de perte.</strong></p>
<p>Marie a annulé son offre. 3 mois plus tard, elle a acheté un immeuble de rapport dans la même ville, avec un autofinancement positif de 400€/mois.</p>
<p>La différence entre les deux scénarios ? Une seule étape bien faite : l'étude de marché local.</p>
<p>Et c'est exactement ce genre d'étape que ta formation Academy te fait cocher, une par une, sans que tu puisses passer à côté.</p>
<p>Je t'en parle dans 2 jours.</p>
<p>En attendant, si tu veux regarder ma masterclass gratuite "Les 3 décisions qui séparent un investisseur rentable d'un propriétaire qui galère" :</p>
${cta("https://emeline-siron.fr/masterclass", "Je la regarde")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 2, delay_hours: 0,
      subject: "+1 800€/mois d'autofinancement en 18 mois (l'histoire de Julien)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Julien avait 38 ans quand on s'est rencontrés. Ingénieur, salaire de 4 200€ net, une épargne de 25 000€, aucun bien en locatif.</p>
<p>Il m'avait dit : "J'ai lu 10 livres sur l'immo et regardé 200 vidéos YouTube. Je ne sais toujours pas par où commencer."</p>
<p>Pas parce qu'il n'avait pas la compétence. Parce qu'il avait trop d'informations contradictoires, sans méthode pour trancher.</p>
<p>On a bossé ensemble pendant 6 mois.</p>
<p><strong>18 mois plus tard, le bilan :</strong></p>
<ul>
<li>3 biens acquis (studio + T2 + petit immeuble de rapport)</li>
<li>Autofinancement positif cumulé : 1 840€/mois</li>
<li>Épargne reconstituée (il a réinjecté 12 000€ au total, le reste vient des loyers)</li>
</ul>
<p>Pas de magie, pas de chance. Juste une méthode appliquée dans le bon ordre.</p>
<p>Cette méthode, c'est celle que je transmets dans ES Academy.</p>
<p>Si ça te parle, regarde ce que la formation couvre exactement :</p>
${cta("https://emeline-siron.fr/academy", "Découvrir ES Academy")}
<p>Pas de pression, juste de l'info.</p>
<p><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;">PS : Julien est devenu membre de ES Family, ma communauté privée. Il partage maintenant ses propres stratégies aux nouveaux membres. C'est ça, la vraie alchimie d'une communauté d'investisseurs sérieux.</p>`),
    },
    {
      step_order: 4, delay_days: 2, delay_hours: 0,
      subject: "\"Mais je n'ai pas le temps\" (les 3 fausses excuses)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je vais être cash avec toi.</p>
<p>Depuis 8 ans que je coach, j'ai entendu les mêmes 3 fausses excuses pour ne pas se lancer :</p>
<p><strong>1. "Je n'ai pas le temps"</strong><br>La vérité : tu passes en moyenne 2h15 par jour sur ton téléphone. Un bon dossier d'investissement locatif demande 80h de travail répartis sur 2 mois. Soit 1h20 par jour pendant 2 mois. Tu as le temps. Tu manques juste de méthode pour ne pas tourner en rond.</p>
<p><strong>2. "Je n'ai pas assez d'apport"</strong><br>La vérité : les banques prêtent sans apport sur des projets rentables bien ficelés. J'ai acheté mon premier bien avec 0€ d'apport. Ma méthode s'appuie sur le fait que tes loyers vont payer ton crédit, pas ton épargne.</p>
<p><strong>3. "C'est trop risqué en ce moment"</strong><br>La vérité : en 9 ans d'investissement, il n'y a jamais eu un "bon moment". Les taux montent, puis baissent. Les prix montent, puis baissent. Pendant ce temps, ceux qui investissent avec méthode continuent à capitaliser. Les autres continuent à attendre le "bon moment" qui n'arrive jamais.</p>
<p>Si tu te reconnais dans une de ces 3 excuses, c'est que tu as besoin de la méthode pour passer à l'action.</p>
<p>ES Academy, c'est 14 modules, 64 leçons, accès à vie. 998€ (paiement en 1x, 3x ou 4x possible).</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 3, delay_hours: 0,
      subject: "La dernière question qui compte",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Dernier mail de cette séquence.</p>
<p>Je te pose une question simple :</p>
<p><strong>Dans 3 ans, tu veux être où ?</strong></p>
<p><strong>Scénario A : tu continues comme aujourd'hui.</strong><br>Tu réfléchis, tu te documentes, tu regardes des vidéos YouTube, tu t'endors avec des rêves de liberté financière, et tu recommences le lundi suivant. Dans 3 ans, tu es exactement au même point. Peut-être un peu plus découragée.</p>
<p><strong>Scénario B : tu prends la méthode et tu l'appliques.</strong><br>Tu fais ton premier investissement dans les 6 mois. Le deuxième dans l'année qui suit. Dans 3 ans, tu as 2 ou 3 biens qui rapportent, un autofinancement positif, et surtout une confiance intérieure que personne ne peut te prendre.</p>
<p>Le scénario B demande une seule décision aujourd'hui.</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy")}
<p>Si tu hésites encore, tu peux aussi prendre un appel stratégique gratuit avec Antony, mon closer. Il te dira franchement si Academy est le bon choix pour toi, ou pas.</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel avec Antony")}
<p>Zéro pression. Tu avances à ton rythme.</p>
<p>Après ce mail, je te laisse tranquille côté vente. Tu recevras ma newsletter comme tout le monde.</p>
<p>Merci d'avoir fait le quiz jusqu'au bout.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_QZ_HIGH : Welcome Quiz branche "Autofinancement positif" (9-10 points)
// Trigger : tag quiz-score:9-10 ajouté
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_QZ_HIGH = {
  name: "Welcome Quiz - Profil 9-10 (SEQ_QZ_HIGH)",
  trigger_type: "tag_added",
  trigger_value: "quiz-score:9-10",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "9 ou 10/10, bravo (mais on peut monter plus haut)",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Tu viens de finir le quiz avec un score de {{quiz_score}}/10.</p>
<p>Ton profil : <strong>Autofinancement positif</strong>.</p>
<p>Je ne vais pas te flatter. Tu sais déjà ce que tu fais. Tu as les fondamentaux, tu as probablement déjà 1 à 3 biens, et tu génères de l'autofinancement positif.</p>
<p>Alors pourquoi je t'écris ?</p>
<p>Parce qu'entre "bon investisseur" et "machine de guerre", il y a un cap que peu de gens franchissent. Et ce cap, c'est la <strong>structuration</strong>.</p>
<p>La différence entre quelqu'un qui a 3 biens qui rapportent et quelqu'un qui a 15 biens, une SCI à l'IS, une holding, et un patrimoine de 2M€ en 8 ans, ce n'est pas la compétence technique. C'est l'architecture juridique et fiscale.</p>
<p>Dans les prochains jours, je vais te parler de ce cap. Pas des bases (tu les connais). Des stratégies avancées que personne ne partage gratuitement.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 2, delay_hours: 0,
      subject: "Ce que les investisseurs aguerris oublient TOUS",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Les investisseurs qui ont atteint ton niveau font tous la même erreur à un moment.</p>
<p>Ils continuent à empiler les biens en nom propre, en LMNP au réel, parce que "ça marche".</p>
<p>Et ça marche. Jusqu'à ce qu'ils se heurtent au plafond.</p>
<p><strong>Le plafond a 3 visages :</strong></p>
<p><strong>1. Le plafond bancaire.</strong> À partir de 4-5 biens en nom propre, les banques commencent à te dire non. Parce que ton taux d'endettement global dépasse les 35% malgré les loyers.</p>
<p><strong>2. Le plafond fiscal.</strong> Tes revenus locatifs finissent par rejoindre ta TMI à 30% ou 41%. Tu travailles pour payer l'État plus que pour capitaliser.</p>
<p><strong>3. Le plafond de ta patience.</strong> Gérer 10 biens en nom propre, 10 locataires, 10 comptabilités, c'est un job à temps plein. Tu n'as plus de temps pour penser stratégie.</p>
<p><strong>La solution ? La structuration avant d'avoir besoin.</strong></p>
<p>Une SCI à l'IS bien montée avant le 5e bien, c'est 2 à 3 ans de gain fiscal sur ton parcours global. Une holding patrimoniale, c'est la capacité à transmettre sans droits de succession massifs.</p>
<p>Ces sujets, je les traite en détail dans le module "Structuration avancée" d'ES Academy.</p>
${cta("https://emeline-siron.fr/academy", "Voir le programme complet")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 2, delay_hours: 0,
      subject: "Le cap des 4-5 biens (là où tout se joue vraiment)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Si tu es à ton 1er, 2e ou 3e bien, tu ne sens pas encore le mur.</p>
<p>Mais arrivée au 4e ou 5e, tout change.</p>
<p><strong>Ce qui se passe concrètement :</strong></p>
<ul>
<li>Les banques deviennent réticentes. Tes ratios sont OK mais elles veulent "diversifier leur risque"</li>
<li>Ta déclaration fiscale devient un casse-tête (LMNP réel x 5, amortissements différents)</li>
<li>La gestion mange 20h/mois (locataires, travaux, comptable)</li>
<li>Tu commences à douter : "Est-ce que je continue ? Est-ce que je ralentis ?"</li>
</ul>
<p>Ce cap, je l'ai passé en 2020. J'ai restructuré en urgence (SCI à l'IS + holding patrimoniale). Si je l'avais fait 18 mois plus tôt, j'aurais économisé l'équivalent d'un bien supplémentaire.</p>
<p>Les élèves qui arrivent chez moi AVANT d'atteindre ce cap gagnent 2 à 3 ans.</p>
<p>Si tu es à 2 ou 3 biens actuellement, tu es exactement au bon moment pour structurer.</p>
${cta("https://emeline-siron.fr/academy", "Découvrir ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 2, delay_hours: 0,
      subject: "Stratégie avancée : comment j'ai structuré mon patrimoine",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je vais te partager quelque chose que je ne mets pas sur Instagram.</p>
<p><strong>Mon architecture actuelle :</strong></p>
<ul>
<li>1 holding patrimoniale (Holdem Groupe SASU) qui détient tout</li>
<li>2 SCI à l'IS pour le locatif (une résidentielle, une commerciale)</li>
<li>1 SARL pour mon activité de formation (ES Academy)</li>
<li>Quelques biens en nom propre (LMNP réel) sur des opportunités historiques</li>
</ul>
<p>Cette architecture, je l'ai construite progressivement sur 4 ans, avec l'aide d'un expert-comptable et d'un notaire.</p>
<p><strong>Ce qu'elle me permet aujourd'hui :</strong></p>
<ul>
<li>Acheter des biens sans passer par moi physiquement (SCI à l'IS = amortissement total)</li>
<li>Faire du levier : la holding réinvestit les bénéfices des autres structures sans repasser par ma TMI</li>
<li>Transmettre à mon fils via démembrement de parts (pas de droits de succession sur la pleine propriété)</li>
</ul>
<p>Cette architecture n'est pas adaptée à tout le monde. Elle coûte environ 3 000€/an en frais de gestion. Mais si tu vises un patrimoine locatif de 1M€+, c'est un passage quasi obligé.</p>
<p>Le module "Structuration patrimoniale" d'ES Academy couvre ce sujet en détail (quand créer, comment, avec quels frais, quels pièges).</p>
${cta("https://emeline-siron.fr/academy", "Découvrir ES Academy")}
<p>Tu peux aussi prendre un appel avec Antony pour un diagnostic personnalisé :</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel avec Antony")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 2, delay_hours: 0,
      subject: "Passer de bon investisseur à machine de guerre",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Dernier mail de cette séquence.</p>
<p>Tu es un des 10% d'investisseurs les plus aguerris de ma base. Tu n'as probablement pas besoin d'une formation pour apprendre les bases.</p>
<p>Mais si tu veux accélérer, 3 leviers possibles :</p>
<p><strong>1. ES Academy</strong> (998€) pour les modules de stratégie avancée (structuration, optimisation fiscale, scaling). Même si tu connais 70% du contenu, les 30% restants te feront gagner 1 à 2 ans.</p>
${cta("https://emeline-siron.fr/academy", "Découvrir ES Academy")}
<p><strong>2. Coaching 1-to-1 avec moi</strong> (selon disponibilités) pour un audit complet de ton patrimoine et une roadmap personnalisée sur 2 ans.</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel pour un audit")}
<p><strong>3. ES Family</strong> (29€/mois) pour rejoindre une communauté d'investisseurs à ton niveau. Échanges sur les montages, opportunités rares (foncier agricole, commercial, meublé premium), lives mensuels.</p>
${cta("https://emeline-siron.fr/family", "Rejoindre ES Family")}
<p>Dans tous les cas, tu continueras à recevoir ma newsletter avec des analyses de haut niveau tous les 15 jours.</p>
<p>Bravo pour ton score. Maintenant, on monte.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// Export de l'ensemble
export const ALL_SEQUENCES = [SEQ_MC, SEQ_BRV, SEQ_SIM, SEQ_QZ_LOW, SEQ_QZ_MID, SEQ_QZ_HIGH];
