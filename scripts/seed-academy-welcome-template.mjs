#!/usr/bin/env node
// Seed le template email "academy_welcome_with_family_gift" dans la table
// email_templates. Envoyé par le webhook Stripe au client qui vient d'acheter
// Academy (1x, 3x ou 4x). Contient le code cadeau Family a coller sur /family.
//
// Idempotent : re-run l'écrase via UPSERT sur la colonne unique "key".

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const template = {
  key: "academy_welcome_with_family_gift",
  name: "Bienvenue Academy + code cadeau Family",
  description:
    "Envoyé automatiquement par le webhook Stripe après un achat Academy (1x/3x/4x). Contient le code FAMILYXXXX à coller sur /family pour obtenir 3 mois gratuits.",
  subject: "Bienvenue dans ES Academy — ton code cadeau Family est dedans",
  html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">

<h1 style="color: #1B4332; font-size: 26px;">Bienvenue {{prenom}} !</h1>

<p>Bravo pour ton inscription à <strong>ES Academy</strong> ({{payment_label}}). Tu as maintenant accès à la méthode complète, aux 60 outils et aux mises à jour à vie.</p>

<p style="background: #f5f1e8; padding: 20px; border-radius: 10px; margin: 25px 0;">
  <strong style="color: #1B4332;">1. Active ton compte</strong><br>
  Rends-toi sur <a href="{{site_url}}/connexion" style="color: #1B4332;">{{site_url}}/connexion</a> avec ton email <strong>{{email}}</strong>. Tu choisiras ton mot de passe au premier login.
</p>

<p style="background: #fef6ec; padding: 20px; border-radius: 10px; margin: 25px 0; border: 2px dashed #d4a24c;">
  <strong style="color: #1B4332;">2. Active tes 3 mois ES Family offerts</strong><br>
  Colle ce code sur la page ES Family pour activer tes 3 mois gratuits :<br><br>
  <span style="display: inline-block; background: #1B4332; color: #d4a24c; font-family: monospace; font-size: 22px; letter-spacing: 2px; padding: 12px 20px; border-radius: 8px; font-weight: bold;">{{family_gift_code}}</span><br><br>
  <a href="{{family_activation_url}}" style="background: #d4a24c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Activer mes 3 mois Family</a>
  <br><br>
  <span style="font-size: 13px; color: #666;">Ce code est personnel, utilisable une seule fois. À l&apos;issue des 3 mois, ton abonnement se poursuit à 29€/mois, sans engagement, résiliable en 1 clic.</span>
</p>

<p>Dans ES Family tu retrouveras Emeline, les partenaires experts, les lives mensuels, les simulateurs, et surtout la communauté qui te fera passer de la théorie à l&apos;action.</p>

<p>Si tu as la moindre question, réponds directement à ce mail.</p>

<p>À très vite,<br><strong>Emeline</strong></p>

<p style="font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
  ES Academy · Holdem SASU · RCS Nanterre 920244563<br>
  Tu reçois ce mail suite à ton achat sur emeline-siron.fr.
</p>

</div>`,
  from_name: "Emeline Siron",
  from_email: "emeline@es-academy.fr",
  reply_to: "emeline@es-academy.fr",
  available_variables: [
    "prenom",
    "email",
    "family_gift_code",
    "family_activation_url",
    "payment_label",
    "site_url",
  ],
};

const { data, error } = await supabase
  .from("email_templates")
  .upsert(template, { onConflict: "key" })
  .select("key, name")
  .single();

if (error) {
  console.error("[seed] Erreur:", error);
  process.exit(1);
}

console.log(`[seed] Template upserté: ${data.key} (${data.name})`);
