// Sprint 4 : séquences comportementales (4 séquences, 16 mails).
// Tous tutoyés, zéro em dash.

const wrap = (body) => `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
${body}
<p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Tu reçois ce mail parce que tu t'es inscrite sur emeline-siron.fr. <a href="{{unsubscribe_url}}">Je me désabonne</a>.</p>
</div>`;

const cta = (url, label) => `<p style="text-align: center; margin: 30px 0;"><a href="${url}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">${label}</a></p>`;

// ──────────────────────────────────────────────────────────────────────────
// SEQ_CROSS : Multi-lead-magnet (3 mails sur 7 jours)
// Trigger : tag behavior:multi-magnet (a téléchargé 2+ lead magnets dans les 14 jours)
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_CROSS = {
  name: "Multi lead-magnet (SEQ_CROSS)",
  trigger_type: "tag_added",
  trigger_value: "behavior:multi-magnet",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "Je vois que tu avances (ça me fait plaisir)",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Tu as téléchargé plusieurs de mes contenus gratuits récemment. Masterclass, quiz, simulateur, cahier, peu importe l'ordre.</p>
<p>Ça me dit une chose : tu es sérieuse. Tu ne zappes pas. Tu creuses.</p>
<p>C'est exactement le profil de femme que je forme en priorité dans ES Academy.</p>
<p>Parce que la différence entre celles qui passent à l'action et celles qui restent spectatrices, c'est ça : <strong>la capacité à consommer plusieurs sources et à connecter les points.</strong></p>
<p>Si tu veux accélérer maintenant que tu as les bases, on peut en parler :</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Prendre un appel avec Antony (30 min)")}
<p>Pas de vente forcée. Juste un échange honnête sur où tu en es et quelle est la prochaine étape logique pour toi.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 3, delay_hours: 0,
      subject: "Le cap entre \"je consomme\" et \"je fais\" (la vérité)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je vais te dire quelque chose de direct.</p>
<p>Tu as téléchargé la masterclass, fait le quiz, utilisé le simulateur. C'est bien. Mais ça ne suffit pas.</p>
<p>Parce que 80% des gens qui consomment beaucoup de gratuit ne passent JAMAIS à l'action.</p>
<p>Ils deviennent "experts" sur YouTube, ils savent tout mieux que leur banquier, ils connaissent 15 méthodes contradictoires. Et 3 ans plus tard, ils n'ont toujours aucun bien.</p>
<p>Ne sois pas cette personne.</p>
<p>Le cap entre "je consomme" et "je fais", c'est une seule décision : <strong>arrêter de chercher la méthode parfaite et prendre UNE méthode, puis l'appliquer.</strong></p>
<p>Ma méthode. Celle d'un autre. Peu importe. Mais une seule. Et tu l'appliques pendant 6 mois.</p>
<p>Si tu veux mettre ta ceinture et passer à l'action :</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 4, delay_hours: 0,
      subject: "Dernière occasion d'en discuter avec Antony (si tu veux)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je ne vais pas te relancer 10 fois.</p>
<p>Tu as tout le matos gratuit entre les mains. À toi de voir.</p>
<p>Si tu veux juste une conversation honnête de 30 min avec Antony (mon closer) pour te situer, pour valider ton idée, pour qu'il te dise franchement si tu es prête ou pas :</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel avec Antony")}
<p>Aucune vente forcée. Il est formé pour te dire non si ce n'est pas le bon moment.</p>
<p>Sinon, tu continueras à recevoir ma newsletter. À ton rythme.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_PRESALE : Click CTA formation (4 mails sur 7 jours)
// Trigger : tag behavior:clicked-formation (a cliqué sur un lien vers /academy)
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_PRESALE = {
  name: "Pré-sale Academy (SEQ_PRESALE)",
  trigger_type: "tag_added",
  trigger_value: "behavior:clicked-formation",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "\"998€, c'est trop cher\" (vraiment ?)",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Tu as cliqué sur la page Academy récemment. Tu t'es probablement dit "c'est cher".</p>
<p>Je comprends. Je veux te poser une question.</p>
<p>Ton premier investissement locatif, tu vas le payer combien ?</p>
<p>Disons 130 000€ en moyenne. Avec un crédit sur 20 ans. Soit un projet de 180 000€ au total (capital + intérêts).</p>
<p>Maintenant regarde l'écart entre un bon dossier et un mauvais :</p>
<ul>
<li>Un bien négocié -10% au lieu de prix affiché : +13 000€</li>
<li>Un régime fiscal LMNP réel au lieu du micro : +20 000€ sur 10 ans</li>
<li>Un taux négocié 3,5% au lieu de 4,2% : +8 000€ sur la durée</li>
<li>Un bien en colocation au lieu de location simple : +150€/mois soit +36 000€ sur 20 ans</li>
</ul>
<p>Total : <strong>77 000€ de différence entre un bon dossier et un mauvais</strong>.</p>
<p>La formation Academy coûte 998€. Soit 1,3% de ce que tu peux gagner sur TON premier bien en l'appliquant.</p>
<p>Vraiment trop cher ?</p>
${cta("https://emeline-siron.fr/academy", "Voir le programme complet")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 1, delay_hours: 0,
      subject: "\"Ce n'est pas le bon moment pour moi\" (oui, c'est toujours le cas)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je fais un pari avec toi.</p>
<p>Si tu me dis "ce n'est pas le bon moment", je te dis "ce ne sera jamais le bon moment".</p>
<p>Parce qu'en 9 ans, j'ai entendu la même phrase de la part de <strong>toutes</strong> les femmes qui ne sont finalement jamais passées à l'action.</p>
<p>"Je veux finir mon master"<br>"J'attends ma promotion"<br>"Les taux vont baisser"<br>"Je vais d'abord stabiliser ma situation"<br>"Mon mari n'est pas encore convaincu"</p>
<p>Celles qui ont réussi, elles ont TOUTES un point commun : elles n'ont pas attendu le bon moment. Elles ont décidé que le moment, ce serait maintenant.</p>
<p>Je ne dis pas de foncer tête baissée. Je dis : prends la méthode, applique-la pendant 6 mois, et tu auras ton premier bien dans l'année.</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 2, delay_hours: 0,
      subject: "\"Je ne suis pas sûre que ce soit pour moi\"",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Si tu hésites encore, c'est normal. C'est même sain.</p>
<p>Voici comment je te propose de trancher simplement :</p>
<p>Prends un appel de 30 min avec Antony (mon closer). C'est gratuit. Il va te poser 4-5 questions :</p>
<ol>
<li>Où en es-tu aujourd'hui ?</li>
<li>Quels sont tes objectifs à 3 ans ?</li>
<li>Qu'est-ce qui te bloque concrètement ?</li>
<li>Est-ce qu'Academy correspond à ce qui te bloque ?</li>
</ol>
<p>Si oui, tu rejoins. Si non, il te dira honnêtement "attends, ce n'est pas le moment" (il le dit à 30% des gens qu'il appelle).</p>
<p>30 minutes pour trancher, au lieu de 3 mois d'hésitation.</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel avec Antony")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 4, delay_hours: 0,
      subject: "Dernière chance d'en discuter (puis on passe à autre chose)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je te laisse respirer après ce mail.</p>
<p>Si tu veux faire le saut :</p>
${cta("https://emeline-siron.fr/academy", "Je rejoins ES Academy")}
<p>Si tu veux 30 min honnêtes avec Antony :</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel")}
<p>Si rien de tout ça ne te parle, aucun souci. Tu resteras sur ma newsletter. Le jour où tu seras prête, tu le sauras.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_POSTMC : Post-masterclass visionnée (5 mails sur 10 jours)
// Trigger : tag behavior:masterclass-watched-full (>90% visionnée)
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_POSTMC = {
  name: "Post-masterclass visionnée (SEQ_POSTMC)",
  trigger_type: "tag_added",
  trigger_value: "behavior:masterclass-watched-full",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "Tu l'as regardée jusqu'au bout. Qu'est-ce que tu en retiens ?",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Tu viens de regarder ma masterclass fondatrice. Jusqu'au bout. Bravo.</p>
<p>Je vais te poser une question simple : <strong>qu'est-ce que tu en retiens ?</strong></p>
<p>Réponds à ce mail avec 2-3 phrases. Pas besoin de faire un essai. Juste ce qui t'a marquée.</p>
<p>Je te lis personnellement. Et en fonction de ta réponse, je peux t'orienter vers la suite logique pour toi.</p>
<p>À tout de suite,<br><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 2, delay_hours: 0,
      subject: "La partie que tu as probablement mal comprise",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Dans la masterclass, je parle des 3 décisions cruciales. La plupart des gens retiennent surtout la première (la stratégique) et la deuxième (la fiscale).</p>
<p><strong>La troisième (la bancaire), ils la sous-estiment.</strong></p>
<p>C'est pourtant celle qui fait la différence entre "je fais un bien tous les 3 ans" et "je fais 4 biens en 3 ans".</p>
<p>La stratégie bancaire, c'est 50% du résultat final. Pas 20%. Pas 30%. 50%.</p>
<p>Parce que :</p>
<ul>
<li>Un bon dossier bancaire te permet d'enchaîner les projets</li>
<li>Un taux négocié 0,5% plus bas = 8 à 15K€ sur la durée</li>
<li>Une durée plus longue = plus d'autofinancement mensuel</li>
<li>Une assurance déléguée = 5 à 12K€ d'économie</li>
</ul>
<p>Dans Academy, le module "Stratégie bancaire" fait 5 leçons. C'est le module le plus rentable de la formation sur un plan purement financier.</p>
${cta("https://emeline-siron.fr/academy", "Voir le programme Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 2, delay_hours: 0,
      subject: "L'étape que je n'ai PAS couverte dans la masterclass",
      html_content: wrap(`<p>{{prenom}},</p>
<p>La masterclass fait 58 minutes. J'y traite les 3 décisions cruciales avant d'acheter.</p>
<p>Mais il y a une 4e étape qui arrive APRÈS l'achat et que je n'ai pas eu le temps de couvrir : <strong>la gestion locative</strong>.</p>
<p>Parce qu'un bon bien mal géré devient un cauchemar. Et un bien correct bien géré devient un autofinancement positif.</p>
<p>Ce que ça couvre :</p>
<ul>
<li>Comment sélectionner un locataire (la grille de scoring)</li>
<li>Le bail type parfait (clauses pour te protéger)</li>
<li>La relance en cas d'impayé (procédure simplifiée)</li>
<li>Les petites réparations qui évitent les gros travaux</li>
<li>Quand passer par une agence vs gérer en direct</li>
</ul>
<p>C'est le module 10 d'ES Academy. Aussi important que les 3 décisions d'avant achat.</p>
${cta("https://emeline-siron.fr/academy", "Découvrir tous les modules")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 3, delay_hours: 0,
      subject: "Academy vs faire seule : le vrai calcul",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Tu te dis peut-être : "Je peux faire tout ça seule avec YouTube et les blogs."</p>
<p>Techniquement, oui. Voici le calcul honnête du temps que ça te prendra :</p>
<p><strong>En autodidacte :</strong></p>
<ul>
<li>Se former sérieusement : 200h réparties sur 6-12 mois</li>
<li>Trier le vrai du faux (nombreuses sources contradictoires) : 50h</li>
<li>Faire tes erreurs en live et apprendre dans la douleur : 10 000 à 30 000€ sur le 1er bien</li>
<li>Durée avant le 1er bien : 18 à 36 mois</li>
</ul>
<p><strong>Avec Academy :</strong></p>
<ul>
<li>Formation complète : 40h sur 2 mois</li>
<li>Méthode unifiée, pas de tri à faire</li>
<li>Erreurs évitées grâce aux checklists et aux arbres de décision</li>
<li>Durée avant le 1er bien : 6 à 9 mois</li>
</ul>
<p>ROI temps : Academy te fait gagner environ 18 mois.</p>
<p>ROI financier : Academy se rentabilise sur TON premier bien.</p>
${cta("https://emeline-siron.fr/academy", "Rejoindre Academy")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 5, delay_days: 3, delay_hours: 0,
      subject: "Ta décision",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Dernier mail de cette séquence.</p>
<p>Tu as regardé la masterclass. Tu as vu ce que je fais. Tu as les informations.</p>
<p>La dernière chose qui te sépare de ton premier investissement, c'est une décision.</p>
${cta("https://emeline-siron.fr/academy", "Je décide de me former (998€)")}
<p>Si tu hésites encore, prends 30 min avec Antony pour trancher :</p>
${cta("https://emeline-siron.fr/coaching/decouverte", "Je prends un appel avec Antony")}
<p>Dans tous les cas, bravo pour ton engagement. Tu fais déjà plus que 80% des gens qui disent vouloir investir.</p>
<p><strong>Emeline</strong></p>`),
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// SEQ_REACT : Réactivation inactifs 90j (4 mails sur 14 jours)
// Trigger : tag behavior:inactive-90
// ──────────────────────────────────────────────────────────────────────────
export const SEQ_REACT = {
  name: "Réactivation inactifs 90j (SEQ_REACT)",
  trigger_type: "tag_added",
  trigger_value: "behavior:inactive-90",
  status: "draft",
  steps: [
    {
      step_order: 1, delay_days: 0, delay_hours: 0,
      subject: "{{prenom}}, on ne s'est pas parlé depuis longtemps",
      html_content: wrap(`<p>Salut {{prenom}},</p>
<p>Ça fait 3 mois que tu n'as pas ouvert mes mails. Je comprends. La vie prend le dessus.</p>
<p>Je voulais juste te poser une question honnête : est-ce que tu veux que je continue à t'envoyer du contenu ?</p>
<p>Si oui, clique sur ce lien pour me le confirmer (ça me sert à nettoyer ma base et à ne pas spammer ceux qui ne sont plus intéressés) :</p>
${cta("https://emeline-siron.fr/confirm-active?email={{email}}", "Oui, je reste dans la communauté")}
<p>Si non, aucun souci. Tu seras automatiquement retirée de la liste d'ici 15 jours. Pas de dramaturgie.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 2, delay_days: 4, delay_hours: 0,
      subject: "Quoi de neuf chez moi depuis qu'on ne s'est pas vues ?",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Je te fais un résumé rapide :</p>
<ul>
<li>J'ai ouvert ES Academy (formation 998€)</li>
<li>J'ai lancé ES Family (communauté 29€/mois)</li>
<li>J'ai sorti ma masterclass fondatrice gratuite</li>
<li>J'ai fait une interview au Monde Immo en mars</li>
<li>J'ai acquis 2 nouveaux biens (un immeuble de rapport à Metz + un studio coloc à Lille)</li>
</ul>
<p>Voilà pour les highlights.</p>
<p>Si tu veux te remettre dans le bain en douceur, je te conseille la masterclass (58 min, gratuite) :</p>
${cta("https://emeline-siron.fr/masterclass", "Je regarde la masterclass")}
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 3, delay_days: 4, delay_hours: 0,
      subject: "Un contenu marquant que tu as probablement raté",
      html_content: wrap(`<p>{{prenom}},</p>
<p>Parmi tous les contenus publiés ces 3 derniers mois, voici celui que les lecteurs ont le plus aimé :</p>
<p><strong>"J'ai acheté un immeuble de rapport de 400 000€ sans apport. Voici comment."</strong></p>
<p>C'est un retour d'expérience complet : la stratégie bancaire, la négociation, les risques, les leçons apprises.</p>
${cta("https://emeline-siron.fr/blog/immeuble-rapport-sans-apport", "Je lis l'article")}
<p>Si ça te parle, tu es toujours dans le bon timing pour te remettre en mouvement.</p>
<p><strong>Emeline</strong></p>`),
    },
    {
      step_order: 4, delay_days: 6, delay_hours: 0,
      subject: "Dernière tentative (puis je te laisse tranquille)",
      html_content: wrap(`<p>{{prenom}},</p>
<p>C'est mon 4e et dernier mail de cette séquence de réactivation.</p>
<p>Si tu ne cliques pas sur le lien ci-dessous d'ici 2 jours, tu seras automatiquement sortie de ma liste. Pas de drame, juste de l'hygiène.</p>
${cta("https://emeline-siron.fr/confirm-active?email={{email}}", "Oui, je reste dans la communauté")}
<p>Le jour où tu seras de nouveau intéressée, la porte reste ouverte.</p>
<p>Bonne continuation,<br><strong>Emeline</strong></p>`),
    },
  ],
};

export const ALL_SEQUENCES_SPRINT4 = [SEQ_CROSS, SEQ_PRESALE, SEQ_POSTMC, SEQ_REACT];
