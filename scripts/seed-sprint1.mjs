#!/usr/bin/env node
/**
 * Seed Sprint 1 : crée en DB les 6 lead magnets + la séquence alumni SEQ_AL (5 steps).
 * Utilise les INSERTS directs avec service role (pas d'HTTP → pas besoin de session admin),
 * mais respecte le principe "ZERO hardcoding" en passant par les tables DB éditables
 * depuis l'admin (pas par un fichier config statique).
 *
 * Tout ce qui est seedé ici peut ensuite être modifié via l'UI admin par Emeline/Tiffany.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const LEAD_MAGNETS = [
  {
    slug: "masterclass-fondatrice",
    name: "Masterclass fondatrice",
    description: "Vidéo 45-60 min evergreen. Les 3 décisions qui séparent un investisseur rentable d'un propriétaire qui galère.",
    format: "masterclass",
    opt_in_tag: "lm:masterclass",
    landing_page_url: "/masterclass",
    sort_order: 1,
    is_active: true,
  },
  {
    slug: "quiz-investissement-locatif",
    name: "Quiz Es-tu fait pour l'investissement locatif",
    description: "40 vidéos interactives VideoAsk. 9 mises en situation réelles, score 0-10 + profil personnalisé.",
    format: "quiz",
    opt_in_tag: "lm:quiz-investissement",
    landing_page_url: "/quiz-investisseur",
    sort_order: 2,
    is_active: true,
  },
  {
    slug: "simulateur-rentabilite",
    name: "Simulateur de rentabilité",
    description: "Outil web interactif. Le prospect saisit son projet, reçoit l'analyse par email.",
    format: "simulator",
    opt_in_tag: "lm:simulateur-rentabilite",
    landing_page_url: "/simulateurs/rentabilite-locative",
    sort_order: 3,
    is_active: true,
  },
  {
    slug: "cahier-vacances",
    name: "Cahier de vacances investisseur",
    description: "PDF interactif 7 jours. Lead magnet saisonnier juillet-août : projet d'investissement concret en 7 exercices.",
    format: "pdf",
    opt_in_tag: "lm:cahier-vacances",
    landing_page_url: "/cahier-vacances",
    available_from: "2026-07-01",
    available_until: "2026-08-31",
    sort_order: 4,
    is_active: false,
  },
  {
    slug: "calendrier-avent",
    name: "Calendrier de l'Avent investisseur",
    description: "Mini-série email 24 jours. Un contenu ouvrable chaque jour du 1er au 24 décembre. Cadeau final : 20% sur Academy.",
    format: "email_series",
    opt_in_tag: "lm:calendrier-avent",
    landing_page_url: "/calendrier-avent",
    available_from: "2026-11-20",
    available_until: "2026-12-24",
    sort_order: 5,
    is_active: false,
  },
  {
    slug: "chasse-oeufs",
    name: "Chasse aux oeufs",
    description: "Jeu semaine de Pâques. 5 oeufs à trouver sur le site + réseaux. 50€ de réduction Academy si 5 oeufs.",
    format: "game",
    opt_in_tag: "lm:chasse-oeufs",
    landing_page_url: "/chasse-oeufs",
    sort_order: 6,
    is_active: false,
  },
];

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SEED SPRINT 1");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// 1. Seed les 6 lead magnets (upsert sur slug → idempotent)
console.log("\n▸ Seed lead_magnets");
for (const lm of LEAD_MAGNETS) {
  const { error } = await supabase.from("lead_magnets").upsert(lm, { onConflict: "slug" });
  if (error) {
    console.log(`  ❌ ${lm.slug} : ${error.message}`);
  } else {
    console.log(`  ✅ ${lm.slug}`);
  }
}

// 2. Crée la séquence SEQ_AL Alumni Evermind
console.log("\n▸ Seed sequence SEQ_AL (Alumni Evermind)");

const { data: existingSeq } = await supabase
  .from("email_sequences")
  .select("id")
  .eq("name", "Alumni Evermind (SEQ_AL)")
  .maybeSingle();

let seqId;
if (existingSeq) {
  seqId = existingSeq.id;
  console.log(`  ℹ️  Séquence existe déjà (id: ${seqId}), skip insert`);
} else {
  const { data: newSeq, error: seqErr } = await supabase
    .from("email_sequences")
    .insert({
      name: "Alumni Evermind (SEQ_AL)",
      trigger_type: "tag_added",
      trigger_value: "source:alumni-evermind",
      status: "draft",
    })
    .select()
    .single();
  if (seqErr) {
    console.log(`  ❌ Création séquence : ${seqErr.message}`);
    process.exit(1);
  }
  seqId = newSeq.id;
  console.log(`  ✅ Séquence créée (id: ${seqId})`);
}

// 3. Seed les 5 steps de SEQ_AL avec les mails du brief v1.0
const SEQ_AL_STEPS = [
  {
    step_order: 1,
    delay_days: 0,
    delay_hours: 0,
    subject: "{{prenom}}, j'ai une grosse annonce à te faire (et un cadeau qui va avec)",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>Salut {{prenom}},</p>
<p>Ça fait un moment qu'on ne s'est pas parlé.</p>
<p>Si tu reçois ce mail, c'est que tu as fait partie d'Evermind Formation.<br>Et franchement, rien que pour ça, je te dois la vérité.</p>
<p><strong>Evermind ferme ses portes fin mai 2026.</strong></p>
<p>Pas parce que ça n'a pas marché.<br>Pas parce que j'ai changé d'avis sur l'immobilier.</p>
<p>Mais parce que j'ai décidé de construire quelque chose de plus grand, quelque chose qui m'appartient à 100%, sans associé, sans compromis.</p>
<p>Et je veux que tu sois la première à le savoir.</p>
<p><strong>Ça s'appelle ES Academy.</strong></p>
<p>C'est la suite logique de ce qu'on a commencé ensemble.<br>Mais en mieux. Plus structuré. Plus à jour. Plus ambitieux.</p>
<p>Et parce que tu as été dans Evermind, tu ne rentres pas comme les autres.</p>
<p><strong>Tu as un cadeau de bienvenue qui t'attend.</strong></p>
<p>Je te l'explique demain dans un prochain mail.</p>
<p>À demain,<br><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;">PS : si tu préfères ne pas recevoir ces mails de transition, tu peux <a href="{{unsubscribe_url}}">te désabonner ici</a>. Je respecte ton choix à 100%.</p>
</div>`,
    status: "active",
  },
  {
    step_order: 2,
    delay_days: 2,
    delay_hours: 0,
    subject: "Ton cadeau : 12 mois offerts (et après, 19€ à vie)",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>{{prenom}},</p>
<p>Je te disais hier que tu as un cadeau qui t'attend.</p>
<p>Le voici.</p>
<p><strong>Tu as droit à 12 mois gratuits dans ES Family, ma nouvelle communauté privée.</strong></p>
<p>Pas 1 mois, pas 3 mois. 12 mois complets.</p>
<p>Et au bout des 12 mois, tu ne paies pas 29€/mois comme tout le monde.<br>Tu paies <strong>19€/mois à vie</strong>. Tarif alumni, figé, pour toujours.</p>
<p><strong>Pourquoi je fais ça ?</strong></p>
<p>Parce que tu as cru en moi quand personne ne me connaissait.<br>Parce que tu as payé pour te former, tu as joué le jeu, tu as bossé.<br>Et ça, ça ne s'oublie pas.</p>
<p><strong>ES Family, c'est quoi concrètement :</strong></p>
<ul>
<li>Des analyses vidéo flash sur l'actu immobilière (chaque semaine)</li>
<li>Des lives mensuels avec moi (+ replays si tu loupes)</li>
<li>Un ebook exclusif chaque mois sur un sujet patrimoine large</li>
<li>Des opportunités qu'on ne trouve pas sur Insta (montres, art, vin)</li>
<li>Des sous-groupes par expertise (gestion locative, Airbnb, LMNP, SCPI)</li>
<li>Un annuaire de membres + des challenges gamifiés</li>
</ul>
<p>C'est pour les investisseurs qui veulent continuer à progresser ensemble, pas juste dans les DM tous seuls devant leur écran.</p>
<p>Pour activer ton cadeau, clique ici :</p>
<p style="text-align: center; margin: 30px 0;"><a href="https://emeline-siron.fr/family/alumni?email={{email}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">J'active mes 12 mois offerts</a></p>
<p>Tu entreras ta CB (pour faciliter la bascule automatique sur le tarif 19€/mois après les 12 mois), mais tu ne seras rien débité aujourd'hui.</p>
<p>Et tu peux résilier en 1 clic à tout moment, même dans les 12 mois.</p>
<p>À tout de suite,<br><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;">Tu reçois ce mail parce que tu as fait partie d'Evermind Formation. <a href="{{unsubscribe_url}}">Je me désabonne</a>.</p>
</div>`,
    status: "active",
  },
  {
    step_order: 3,
    delay_days: 3,
    delay_hours: 0,
    subject: "Pourquoi j'ai tout reconstruit (la vraie histoire)",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>{{prenom}},</p>
<p>Quelques-uns d'entre vous m'ont écrit hier pour me demander pourquoi.</p>
<p>Pourquoi fermer Evermind alors que ça marchait.<br>Pourquoi repartir de zéro à 32 ans, avec un bébé, un portefeuille de 12 biens, et 55 locataires.</p>
<p><strong>La vérité ?</strong></p>
<p>Parce qu'à un moment, continuer à construire une maison sur un sol qui ne t'appartient pas, ça devient épuisant.</p>
<p>J'ai passé des années à tenir mon bout d'une structure à deux.<br>Des années à faire des compromis éditoriaux, stratégiques, business.<br>Des années à avoir des idées que je ne pouvais pas pousser.</p>
<p><strong>Et puis l'année dernière, j'ai eu mon fils.</strong></p>
<p>Et là, quelque chose a changé.</p>
<p>Quand tu deviens mère, tu ne peux plus faire semblant.<br>Tu ne peux plus porter une marque qui ne te ressemble qu'à moitié.<br>Tu ne peux plus perdre ton temps sur des trucs qui ne t'élèvent pas.</p>
<p>Alors j'ai fait le choix le plus difficile de ma vie professionnelle.</p>
<p><strong>Arrêter Evermind. Créer ES Academy, ES Family, ES Patrimoine.</strong><br>Tout reprendre. Tout réécrire. Tout incarner à ma façon.</p>
<p>Et aujourd'hui, je peux enfin te proposer ce que j'aurais voulu te proposer dès le premier jour.</p>
<p>Si tu n'as pas encore activé tes 12 mois d'ES Family offerts, c'est par là :</p>
<p style="text-align: center; margin: 30px 0;"><a href="https://emeline-siron.fr/family/alumni?email={{email}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">J'active mes 12 mois offerts</a></p>
<p>À très vite,<br><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;">PS : le tarif alumni à 19€/mois à vie n'existera plus après le 31 juillet 2026. Passé cette date, tu repasseras aux conditions standard (29€/mois). Donc si tu veux figer ton tarif pour toujours, c'est maintenant.</p>
<p style="font-size: 13px; color: #666;"><a href="{{unsubscribe_url}}">Je me désabonne</a></p>
</div>`,
    status: "active",
  },
  {
    step_order: 4,
    delay_days: 4,
    delay_hours: 0,
    subject: "Tes questions (les vraies)",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>{{prenom}},</p>
<p>J'ai reçu pas mal de questions depuis mon premier mail. Je te fais un récap des plus importantes.</p>
<p><strong>"Mes accès Evermind, j'en fais quoi ?"</strong><br>Tes accès restent ouverts jusqu'au 31 mai 2026. Après cette date, ils seront coupés. Si tu veux télécharger certains contenus avant, fais-le cette semaine.</p>
<p><strong>"Si je passe sur ES Family, est-ce que je perds ce que j'avais appris dans Evermind ?"</strong><br>Non. Ce que tu sais, tu le sais. ES Family n'est pas une formation, c'est une communauté active où tu continues à progresser avec des pairs et avec moi.</p>
<p><strong>"Si je veux refaire une formation plus poussée, tu proposes quoi ?"</strong><br>Oui, ES Academy remplace Evermind. C'est ma formation phare, disponible à 998€. Si tu en as envie, tu peux commencer par activer tes 12 mois d'ES Family offerts, tester la communauté, et décider ensuite.</p>
<p><strong>"Est-ce que tu vas me faire payer automatiquement après 12 mois ?"</strong><br>Non, sans autorisation. Je te rappellerai à J-15 et J-7 avant l'échéance des 12 mois (loi Chatel). Tu peux résilier avant, en 1 clic, sans rien justifier.</p>
<p><strong>"Je vis à l'étranger, ça marche pour moi ?"</strong><br>Oui, ES Family est 100% en ligne. Lives sur Zoom, replays accessibles partout.</p>
<p><strong>"Je n'ai toujours pas activé parce que j'hésite."</strong><br>C'est normal. Je te propose de venir en observateur pendant 12 mois, sans payer, et de te faire ton avis. Si tu n'accroches pas, tu résilies. Zéro risque.</p>
<p style="text-align: center; margin: 30px 0;"><a href="https://emeline-siron.fr/family/alumni?email={{email}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">J'active mes 12 mois offerts</a></p>
<p>Des questions que je n'ai pas couvertes ? Réponds à ce mail, je te lis personnellement.</p>
<p><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;"><a href="{{unsubscribe_url}}">Je me désabonne</a></p>
</div>`,
    status: "active",
  },
  {
    step_order: 5,
    delay_days: 4,
    delay_hours: 0,
    subject: "Dernier mail sur cette offre (puis je te lâche)",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>{{prenom}},</p>
<p>C'est mon dernier mail sur l'offre alumni.</p>
<p>Si tu n'as pas activé tes 12 mois offerts à ce stade, je comprends.<br>Tu as peut-être d'autres priorités, d'autres envies, d'autres combats.</p>
<p>Mais je ne veux pas te harceler. Ce n'est pas mon style.</p>
<p><strong>Donc on fait comme ça :</strong></p>
<ul>
<li>Si tu veux profiter du cadeau, c'est maintenant : <a href="https://emeline-siron.fr/family/alumni?email={{email}}">J'active mes 12 mois offerts</a></li>
<li>Si tu n'es pas intéressée, tu ne recevras plus de mail sur ce sujet.</li>
</ul>
<p>Dans tous les cas, je continuerai à partager du contenu sur le podcast Out of the Box (chaque mardi) et sur la newsletter (1 jeudi sur 2, à 7h30).</p>
<p>Tu peux y rester en me lisant sans obligation.</p>
<p>Et si jamais un jour tu veux revenir, la porte reste ouverte.</p>
<p><strong>Merci d'avoir été là au début.</strong></p>
<p>Emeline</p>
<p style="font-size: 13px; color: #666;"><a href="{{unsubscribe_url}}">Je me désabonne</a></p>
</div>`,
    status: "active",
  },
];

// Check si les steps existent déjà (idempotence)
const { data: existingSteps } = await supabase
  .from("email_sequence_steps")
  .select("step_order")
  .eq("sequence_id", seqId);

if (existingSteps && existingSteps.length >= 5) {
  console.log(`  ℹ️  ${existingSteps.length} steps déjà présents, skip insert`);
} else {
  for (const step of SEQ_AL_STEPS) {
    const { error } = await supabase.from("email_sequence_steps").insert({
      sequence_id: seqId,
      ...step,
    });
    if (error) {
      console.log(`  ❌ Step ${step.step_order} : ${error.message}`);
    } else {
      console.log(`  ✅ Step ${step.step_order} · ${step.subject.slice(0, 50)}…`);
    }
  }
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SEED TERMINÉ");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\nTu peux maintenant :");
console.log("  - Éditer les 6 lead magnets sur /admin/lead-magnets");
console.log("  - Éditer la séquence SEQ_AL sur /admin/sequences");
console.log("  - Importer les alumni via /admin/import-contacts");
console.log("  - Activer SEQ_AL (passer de 'draft' à 'active') quand prêt à envoyer\n");
