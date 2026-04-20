#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(l => l && !l.startsWith("#") && l.includes("=")).map(l => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const template = {
  key: "newsletter_bihebdo",
  name: "Newsletter bi-hebdomadaire (modèle)",
  description: "Modèle de base pour les newsletters envoyées 1 jeudi sur 2 à 7h30. Duplique ce modèle, ajuste le contenu, envoie.",
  subject: "Newsletter · [thème de la semaine]",
  html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.1em;">Newsletter · [DATE]</p>

<h1 style="color: #1B4332; font-size: 24px; margin-top: 10px;">[Titre de ta newsletter]</h1>

<p>Salut {{prenom}},</p>

<p>[Accroche en 2-3 lignes : question, paradoxe, ou amorce storytelling]</p>

<h2 style="color: #1B4332; font-size: 18px; margin-top: 30px;">[Sous-titre de la partie 1]</h2>

<p>[Contenu principal 400-700 mots : une idée forte, un retour d'expérience, une analyse]</p>

<h2 style="color: #1B4332; font-size: 18px; margin-top: 30px;">[Sous-titre de la partie 2 : outil ou ressource pratique]</h2>

<p>[Contenu de la partie 2]</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="[URL]" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">[CTA léger vers article, podcast ou ressource]</a>
</p>

<p>À très vite,<br><strong>Emeline</strong></p>

<p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
  Tu reçois cette newsletter parce que tu t'es inscrite sur emeline-siron.fr.<br>
  <a href="{{unsubscribe_url}}">Je me désabonne</a>
</p>
</div>`,
  from_name: "Emeline Siron",
  from_email: "emeline@es-academy.fr",
  available_variables: ["prenom", "nom", "email", "unsubscribe_url"],
};

const { data: existing } = await supabase.from("email_templates").select("id").eq("key", template.key).maybeSingle();
if (existing) {
  console.log("ℹ️  Template newsletter_bihebdo existe déjà, skip (non écrasé pour préserver tes modifs)");
} else {
  const { error } = await supabase.from("email_templates").insert(template);
  if (error) {
    console.log("❌", error.message);
  } else {
    console.log("✅ Template newsletter_bihebdo créé");
  }
}
