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

const templates = [
  {
    key: "chatel_j15",
    name: "Rappel Chatel · J-15 ES Family",
    description: "Envoyé 15 jours avant la fin de la période gratuite ES Family (loi Chatel).",
    subject: "{{prenom}}, ton ES Family passe en mode payant dans 15 jours",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>{{prenom}},</p>
<p><strong>Rappel important :</strong> ton cadeau ES Family offert se termine le {{family_trial_end}}.</p>
<p>À partir de cette date, tu seras automatiquement débitée de <strong>{{monthly_price}}€/mois</strong> sur la carte que tu as enregistrée le {{enroll_date}}.</p>
<p>Tu as 3 options :</p>
<p><strong>1. Laisser faire (je reste membre ES Family)</strong><br>
Tu es automatiquement facturée {{monthly_price}}€/mois à partir du {{family_trial_end}}. Tu profites de la communauté, des lives, des ebooks, des opportunités. Tu peux résilier en 1 clic à tout moment.</p>
<p><strong>2. Résilier avant la fin de la période offerte</strong><br>
Tu cliques ici : <a href="https://emeline-siron.fr/desabonnement-family?token={{cancel_token}}">Je résilie mon abonnement ES Family</a>. Aucun débit, aucune justification à donner.</p>
<p><strong>3. Ne rien faire mais résilier plus tard</strong><br>
Tu peux aussi attendre, être débitée {{monthly_price}}€ ce mois-ci, et résilier au mois suivant.</p>
<p>Dans tous les cas : je respecte ton choix à 100%. Zéro pression.</p>
<p><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Ce mail est envoyé dans le cadre de la loi Chatel. <a href="https://emeline-siron.fr/desabonnement-family?token={{cancel_token}}">Résilier maintenant</a>.</p>
</div>`,
    available_variables: ["prenom", "email", "family_trial_end", "monthly_price", "enroll_date", "cancel_token"],
  },
  {
    key: "chatel_j7",
    name: "Rappel Chatel · J-7 ES Family",
    description: "Dernier rappel 7 jours avant la facturation ES Family.",
    subject: "Dernier rappel (7 jours) · ES Family facturation",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>{{prenom}},</p>
<p><strong>Dernier rappel officiel.</strong></p>
<p>Dans 7 jours, le {{family_trial_end}}, tu seras débitée de {{monthly_price}}€ pour ton premier mois payant d'ES Family.</p>
<p>Tu veux continuer ? Parfait, laisse faire.</p>
<p>Tu veux résilier ? Clique ici :</p>
<p style="text-align: center; margin: 30px 0;"><a href="https://emeline-siron.fr/desabonnement-family?token={{cancel_token}}" style="background: #1B4332; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Je résilie ES Family</a></p>
<p>Aucune justification n'est demandée. Aucun débit ne sera effectué. Tu gardes bien sûr tous tes accès ES Academy (c'est différent).</p>
<p><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Loi Chatel. <a href="https://emeline-siron.fr/desabonnement-family?token={{cancel_token}}">Résilier</a>.</p>
</div>`,
    available_variables: ["prenom", "email", "family_trial_end", "monthly_price", "cancel_token"],
  },
  {
    key: "family_activation_confirmed",
    name: "Confirmation activation ES Family (bascule payante)",
    description: "Envoyé quand la bascule automatique vers l'abonnement payant ES Family réussit.",
    subject: "Bienvenue dans ES Family (niveau payant activé)",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>{{prenom}},</p>
<p>Ton abonnement ES Family est maintenant actif à {{monthly_price}}€/mois. Première échéance : aujourd'hui.</p>
<p>Tu gardes accès à tout ce qui fait ES Family :</p>
<ul>
<li>Lives mensuels avec moi</li>
<li>Analyses vidéo flash hebdomadaires</li>
<li>Ebook exclusif chaque mois</li>
<li>Opportunités rares</li>
<li>Sous-groupes par expertise</li>
</ul>
<p>Tu peux résilier en 1 clic à tout moment depuis ton espace membre ou via <a href="https://emeline-siron.fr/desabonnement-family?token={{cancel_token}}">ce lien</a>.</p>
<p>Merci de ta confiance,<br><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;"><a href="{{unsubscribe_url}}">Se désabonner des emails</a></p>
</div>`,
    available_variables: ["prenom", "email", "monthly_price", "cancel_token", "unsubscribe_url"],
  },
  {
    key: "family_cancelled",
    name: "Confirmation résiliation ES Family",
    description: "Envoyé quand le contact clique sur le lien de résiliation Chatel.",
    subject: "Ton abonnement ES Family est bien résilié",
    html_content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>{{prenom}},</p>
<p>C'est confirmé : ton abonnement ES Family est résilié. Aucun prélèvement ne sera effectué.</p>
<p>Tu resteras bien sûr dans ma base email newsletter (sauf si tu veux te désinscrire <a href="{{unsubscribe_url}}">ici</a>).</p>
<p>Si un jour tu veux revenir, la porte reste ouverte.</p>
<p>Merci d'avoir essayé,<br><strong>Emeline</strong></p>
</div>`,
    available_variables: ["prenom", "email", "unsubscribe_url"],
  },
];

for (const t of templates) {
  const { data: existing } = await supabase.from("email_templates").select("id").eq("key", t.key).maybeSingle();
  if (existing) {
    console.log(`ℹ️  ${t.key} existe déjà, skip`);
  } else {
    const { error } = await supabase.from("email_templates").insert(t);
    if (error) console.log(`❌ ${t.key} : ${error.message}`);
    else console.log(`✅ ${t.key}`);
  }
}
