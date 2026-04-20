#!/usr/bin/env node
/**
 * Seed Sprint 2 : crée les 6 séquences (MC, BRV, SIM, QZ_LOW, QZ_MID, QZ_HIGH)
 * + les 6 formulaires d'opt-in reliés aux lead magnets + lead_magnets.welcome_sequence_id.
 * Idempotent : upsert sur les noms de séquence et slugs de form.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { ALL_SEQUENCES } from "./seed-sprint2-data.mjs";

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

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SEED SPRINT 2 : séquences + formulaires");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ──────────────────────────────────────────────────────────────────────────
// 1. Seed les séquences + steps
// ──────────────────────────────────────────────────────────────────────────
const seqIdBySlug = new Map(); // map lm_slug → sequence_id pour relier après

console.log("\n▸ Création des séquences + steps");
for (const seq of ALL_SEQUENCES) {
  const { data: existing } = await supabase
    .from("email_sequences")
    .select("id")
    .eq("name", seq.name)
    .maybeSingle();

  let seqId;
  if (existing) {
    seqId = existing.id;
    console.log(`  ℹ️  ${seq.name} (déjà existe, id: ${seqId})`);
  } else {
    const { data, error } = await supabase
      .from("email_sequences")
      .insert({
        name: seq.name,
        trigger_type: seq.trigger_type,
        trigger_value: seq.trigger_value,
        status: seq.status,
      })
      .select()
      .single();
    if (error) {
      console.log(`  ❌ ${seq.name} : ${error.message}`);
      continue;
    }
    seqId = data.id;
    console.log(`  ✅ ${seq.name} (créé, id: ${seqId})`);
  }

  // Check si steps existent déjà
  const { data: existingSteps } = await supabase
    .from("email_sequence_steps")
    .select("step_order")
    .eq("sequence_id", seqId);

  if (existingSteps && existingSteps.length >= seq.steps.length) {
    console.log(`    └ ${existingSteps.length} steps déjà présents, skip`);
  } else {
    for (const step of seq.steps) {
      const { error } = await supabase.from("email_sequence_steps").insert({
        sequence_id: seqId,
        ...step,
      });
      if (error) {
        console.log(`    └ ❌ step ${step.step_order} : ${error.message}`);
      } else {
        console.log(`    └ ✅ step ${step.step_order} · ${step.subject.slice(0, 55)}…`);
      }
    }
  }

  // Mémoriser l'id par trigger_value pour relier ensuite aux lead magnets
  if (seq.trigger_value) {
    seqIdBySlug.set(seq.trigger_value, seqId);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 2. Relier lead_magnets.welcome_sequence_id aux séquences créées
// ──────────────────────────────────────────────────────────────────────────
console.log("\n▸ Liaison lead_magnets → séquences welcome");

const LM_TO_SEQ_TAG = {
  "masterclass-fondatrice": "lm:masterclass",
  "simulateur-rentabilite": "lm:simulateur-rentabilite",
  // Le quiz a 3 séquences selon le score, on ne lie pas au niveau LM mais via le webhook VideoAsk
};

for (const [lmSlug, triggerTag] of Object.entries(LM_TO_SEQ_TAG)) {
  const seqId = seqIdBySlug.get(triggerTag);
  if (!seqId) continue;
  const { error } = await supabase
    .from("lead_magnets")
    .update({ welcome_sequence_id: seqId })
    .eq("slug", lmSlug);
  if (error) {
    console.log(`  ❌ ${lmSlug} : ${error.message}`);
  } else {
    console.log(`  ✅ ${lmSlug} → séquence ${triggerTag}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 3. Créer les 6 formulaires d'opt-in (idempotent sur slug)
// ──────────────────────────────────────────────────────────────────────────
console.log("\n▸ Création des 6 formulaires d'opt-in");

const FORMS = [
  {
    name: "Opt-in Masterclass fondatrice",
    slug: "masterclass",
    title: "Je veux regarder la masterclass",
    description: "58 min. Les 3 décisions qui séparent un investisseur rentable d'un propriétaire qui galère.",
    status: "published",
    success_message: "C'est bon ! Vérifie ta boîte mail dans 2 minutes, le lien d'accès t'arrive.",
    redirect_url: "/masterclass/merci",
    require_phone: false,
    require_last_name: false,
  },
  {
    name: "Opt-in Quiz investissement locatif",
    slug: "quiz-investisseur",
    title: "Je fais le quiz gratuit",
    description: "40 vidéos, 5 min. Score sur 10 + profil personnalisé.",
    status: "published",
    success_message: "Merci ! Tu vas être redirigée vers le quiz dans quelques secondes.",
    redirect_url: "/quiz-investisseur/play",
    require_phone: false,
    require_last_name: false,
  },
  {
    name: "Opt-in Simulateur rentabilité",
    slug: "simulateur-rentabilite",
    title: "Je veux mon analyse de rentabilité par email",
    description: "Je reçois une analyse détaillée de mon projet immobilier.",
    status: "published",
    success_message: "Ton analyse arrive dans ta boîte mail dans 2 minutes.",
    require_phone: false,
    require_last_name: false,
  },
  {
    name: "Opt-in Cahier de vacances",
    slug: "cahier-vacances",
    title: "Je télécharge le cahier de vacances",
    description: "7 jours d'exercices pour construire ton 1er projet d'investissement cet été.",
    status: "draft",
    success_message: "Le cahier arrive dans ta boîte mail. On commence demain à 9h avec l'exercice du Jour 1.",
    require_phone: false,
    require_last_name: false,
  },
  {
    name: "Opt-in Calendrier de l'Avent",
    slug: "calendrier-avent",
    title: "Je rejoins le calendrier de l'Avent",
    description: "24 cadeaux du 1er au 24 décembre. Tips, études de cas, outils, réductions.",
    status: "draft",
    success_message: "Tu es inscrite ! Le 1er cadeau t'arrive le 1er décembre à 7h.",
    require_phone: false,
    require_last_name: false,
  },
  {
    name: "Opt-in Chasse aux œufs",
    slug: "chasse-oeufs",
    title: "Je participe à la chasse aux œufs",
    description: "5 œufs à trouver. 5 œufs = 50€ de réduction sur Academy.",
    status: "draft",
    success_message: "On est partis ! Le premier indice t'arrive par email maintenant.",
    require_phone: false,
    require_last_name: false,
  },
];

for (const form of FORMS) {
  const { data: existing } = await supabase
    .from("forms")
    .select("id")
    .eq("slug", form.slug)
    .maybeSingle();

  if (existing) {
    console.log(`  ℹ️  /form/${form.slug} (déjà existe)`);
  } else {
    const { error } = await supabase.from("forms").insert(form);
    if (error) {
      console.log(`  ❌ /form/${form.slug} : ${error.message}`);
    } else {
      console.log(`  ✅ /form/${form.slug} (${form.status})`);
    }
  }
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SEED SPRINT 2 TERMINÉ");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\nProchaines étapes :");
console.log("  - Va sur /admin/sequences vérifier les 6 séquences (toutes en draft)");
console.log("  - Va sur /admin/forms pour vérifier les 6 formulaires");
console.log("  - Quand prêt à lancer : status draft → active sur les séquences\n");
