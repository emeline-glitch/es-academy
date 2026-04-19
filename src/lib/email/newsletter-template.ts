/**
 * Template HTML par défaut de la newsletter "L'Immo sans prise de tête"
 * Reproduit la trame Emeline Siron : header magazine, hello personnalisé,
 * intro vidéo, article principal, callout vert clair pour les liens,
 * actu immo, CTA podcast en carte verte, signature ronde, footer légal.
 *
 * Merge tags disponibles : {{prenom}}, {{nom}}, {{email}}, {{date}}
 */

// Couleurs inspirées du design system ES
const GREEN = "#1B4332";
const GREEN_LIGHT = "#E8F0E6"; // fond callout clair
const GREEN_MID = "#2D6A4F";
const TEXT = "#1A1A1A";
const TEXT_MUTED = "#555555";
const BORDER = "#E5E7EB";

export function defaultNewsletterHtml(opts?: { editionNumber?: number; edition?: string }): string {
  const num = opts?.editionNumber ?? 65;
  const edition = opts?.edition ?? new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return `
<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- HEADER : titre magazine + numéro -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="text-align:center; padding:32px 20px 16px;">
  <h1 style="margin:0; color:${GREEN}; font-size:28px; font-weight:800; letter-spacing:0.02em;">
    L'IMMO SANS PRISE DE TÊTE !
  </h1>
  <p style="margin:8px 0 0; color:${TEXT}; font-size:13px; font-weight:600;">
    ${edition.charAt(0).toUpperCase() + edition.slice(1)} — #${num}
  </p>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- HELLO + intro vidéo YouTube -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="padding:16px 24px; color:${TEXT}; font-size:15px; line-height:1.7;">
  <p style="margin:0 0 16px; font-weight:700; font-size:17px;">Hello {{prenom}},</p>

  <p style="margin:0 0 16px;">
    Il y a quelques jours, j'ai posté une <strong>nouvelle vidéo sur ma chaîne YouTube</strong>.
    Je t'explique [sujet de la vidéo en 2 lignes]. 😉
  </p>

  <p style="margin:0 0 16px;">
    <strong>Tu peux visionner <a href="#" style="color:${GREEN}; text-decoration:underline;">ma vidéo en cliquant ICI</a>.</strong>
  </p>

  <p style="margin:0 0 16px;">
    Dans cette newsletter on va <strong>[teaser du sujet principal]</strong> : "[phrase choc entre guillemets]".
  </p>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- IMAGE HERO (à remplacer) -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="padding:8px 24px; text-align:center;">
  <img src="https://via.placeholder.com/560x420?text=Image+hero+de+l%27article"
       alt="Image hero"
       style="max-width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" />
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- ARTICLE PRINCIPAL : gros titre choc + sous-titre -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="text-align:center; padding:24px 24px 8px;">
  <h2 style="margin:0 0 8px; color:${TEXT}; font-size:22px; font-weight:800; line-height:1.3;">
    "[Phrase choc ou affirmation]"
  </h2>
  <p style="margin:0; color:${TEXT}; font-size:17px; font-weight:700;">
    C'est une <u>FAUSSE</u> croyance en immobilier ❌
  </p>
</div>

<!-- Corps article -->
<div style="padding:16px 24px; color:${TEXT}; font-size:15px; line-height:1.7;">
  <p style="margin:0 0 12px;">
    C'est une phrase que j'entends même chez des investisseurs expérimentés :
  </p>
  <p style="margin:0 0 12px; padding-left:16px; border-left:3px solid ${GREEN}; font-style:italic; color:${TEXT_MUTED};">
    👉 "[Citation de la fausse croyance]"
  </p>
  <p style="margin:0 0 12px;">
    Le problème, ce n'est pas seulement que c'est faux.<br/>
    C'est que <strong>cette croyance te fait prendre de mauvaises décisions.</strong>
  </p>
  <p style="margin:0 0 12px;">
    [Contexte / conséquence pour l'investisseur, 2-3 lignes]
  </p>

  <!-- Sous-section : cadre juridique ou explication -->
  <h3 style="margin:24px 0 12px; color:${TEXT}; font-size:18px; font-weight:700;">
    Le socle juridique : ce que dit réellement la loi ⚖️
  </h3>
  <p style="margin:0 0 12px;">
    [Référence juridique, décret, article]
  </p>
  <p style="margin:0 0 12px; padding:12px 16px; background:#F9FAFB; border-radius:8px; font-style:italic; color:${TEXT_MUTED}; font-size:14px;">
    « [Citation légale entre guillemets] ».
  </p>
  <p style="margin:0 0 12px;">
    👉 <strong>Point clé :</strong> [explication simple de ce que ça signifie vraiment].
  </p>

  <!-- Sous-section : analyse -->
  <h3 style="margin:24px 0 12px; color:${TEXT}; font-size:18px; font-weight:700;">
    [Titre de la section 2]
  </h3>
  <p style="margin:0 0 12px;">
    [Développement avec exemples concrets]
  </p>

  <!-- Liste de checks ✅ -->
  <div style="margin:16px 0; padding:16px; background:#F9FAFB; border-radius:8px;">
    <p style="margin:0 0 8px; font-weight:600;">Ce qu'on retrouve fréquemment :</p>
    <p style="margin:4px 0;">✅ [Règle 1]</p>
    <p style="margin:4px 0;">✅ [Règle 2]</p>
    <p style="margin:4px 0;">✅ [Règle 3]</p>
    <p style="margin:4px 0;">✅ [Règle 4]</p>
  </div>

  <!-- Section "Lecture investisseur" -->
  <h3 style="margin:24px 0 12px; color:${TEXT}; font-size:18px; font-weight:700;">
    💡 Lecture investisseur : comment exploiter cette règle
  </h3>

  <p style="margin:12px 0 8px; font-weight:700;">1. [Premier levier]</p>
  <p style="margin:0 0 12px;">[Explication + exemple concret]</p>

  <p style="margin:12px 0 8px; font-weight:700;">2. [Deuxième levier]</p>
  <p style="margin:0 0 12px;">[Explication + exemple]</p>

  <p style="margin:12px 0 8px; font-weight:700;">3. [Troisième levier]</p>
  <p style="margin:0 0 12px;">[Explication + exemple]</p>

  <!-- Erreurs à éviter -->
  <h3 style="margin:24px 0 12px; color:${TEXT}; font-size:18px; font-weight:700;">
    Les erreurs des investisseurs (même avancés)
  </h3>
  <p style="margin:4px 0;">❌ <strong>[Erreur 1]</strong> — [explication courte]</p>
  <p style="margin:4px 0;">❌ <strong>[Erreur 2]</strong> — [explication courte]</p>
  <p style="margin:4px 0;">❌ <strong>[Erreur 3]</strong> — [explication courte]</p>

  <!-- En résumé -->
  <h3 style="margin:24px 0 12px; color:${TEXT}; font-size:18px; font-weight:700;">En résumé</h3>
  <p style="margin:4px 0;">• [Point clé 1]</p>
  <p style="margin:4px 0;">• [Point clé 2]</p>
  <p style="margin:4px 0;">• [Point clé 3]</p>
  <p style="margin:4px 0;">• [Point clé 4]</p>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CALLOUT VERT CLAIR : "Si ce n'est pas déjà fait, tu peux :" -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="margin:24px; padding:24px; background:${GREEN_LIGHT}; border-radius:12px;">
  <p style="margin:0 0 12px; text-align:center; color:${TEXT}; font-size:16px; font-weight:700;">
    Si ce n'est pas déjà fait, tu peux :
  </p>
  <p style="margin:6px 0; color:${TEXT}; font-size:15px;">
    • Me rejoindre sur <a href="https://www.instagram.com/emelinesiron/" style="color:${GREEN};">Instagram</a> et <a href="https://www.linkedin.com/in/emeline-siron/" style="color:${GREEN};">LinkedIn</a>
  </p>
  <p style="margin:6px 0; color:${TEXT}; font-size:15px;">
    • T'abonner à ma chaîne <a href="https://www.youtube.com/@emelinesiron" style="color:${GREEN};">YouTube</a>
  </p>
  <p style="margin:6px 0; color:${TEXT}; font-size:15px;">
    • Écouter mon podcast sur <a href="https://podcast.emelinesiron.com" style="color:${GREEN};">toutes les plateformes</a>
  </p>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- ACTUALITÉ IMMO : 2e article -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="padding:16px 24px;">
  <h2 style="margin:16px 0 8px; color:${TEXT}; font-size:22px; font-weight:800; text-align:center; line-height:1.3;">
    <span style="color:${GREEN};">Actualité immo</span> — [Titre de l'actu]
  </h2>
  <p style="margin:12px 0; color:${TEXT}; font-size:15px; line-height:1.7;">
    [Intro de l'actualité, 2-3 lignes pour poser le contexte]
  </p>
  <p style="margin:12px 0; color:${TEXT}; font-size:15px; line-height:1.7;">
    Sur le papier, ça paraît être [sentiment immédiat].<br/>
    Mais en immobilier, il faut toujours aller plus loin que le titre...
  </p>

  <h3 style="margin:20px 0 12px; color:${TEXT}; font-size:17px; font-weight:700;">
    Lecture investisseur : ce qu'il faut vraiment analyser
  </h3>

  <p style="margin:12px 0 6px; font-weight:700;">1. [Angle 1]</p>
  <p style="margin:0 0 12px; color:${TEXT}; font-size:15px; line-height:1.7;">[Analyse courte]</p>

  <p style="margin:12px 0 6px; font-weight:700;">2. [Angle 2]</p>
  <p style="margin:0 0 12px; color:${TEXT}; font-size:15px; line-height:1.7;">[Analyse courte]</p>

  <p style="margin:12px 0 6px; font-weight:700;">3. [Angle 3]</p>
  <p style="margin:0 0 12px; color:${TEXT}; font-size:15px; line-height:1.7;">[Analyse courte]</p>

  <h3 style="margin:20px 0 12px; color:${TEXT}; font-size:17px; font-weight:700;">
    Ce que tu dois en retenir
  </h3>
  <p style="margin:4px 0;">• [Point 1]</p>
  <p style="margin:4px 0;">• [Point 2]</p>
  <p style="margin:4px 0;">• [Point 3]</p>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CTA PODCAST : carte verte claire + bouton vert foncé -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="margin:24px; padding:28px 24px; background:${GREEN_LIGHT}; border-radius:12px; text-align:center;">
  <h2 style="margin:0 0 12px; color:${TEXT}; font-size:19px; font-weight:800; line-height:1.4;">
    Tu as écouté mon dernier podcast sur [Sujet] ? 🤯
  </h2>
  <p style="margin:0 0 12px; color:${TEXT}; font-size:15px;">On décrypte tout ça ensemble.</p>
  <p style="margin:0 0 8px; color:${TEXT}; font-size:14px; line-height:1.6;">
    [Description courte du podcast]<br/>
    Selon le cas, il peut être [angle 1] OU [angle 2]…
  </p>
  <p style="margin:0 0 20px; color:${TEXT}; font-size:15px; font-weight:700;">
    30 minutes chrono pour tout comprendre :
  </p>
  <a href="#" style="display:inline-block; padding:14px 32px; background:${GREEN_MID}; color:#fff; text-decoration:none; border-radius:12px; font-size:16px; font-weight:700;">
    👉 ÉCOUTER ICI !
  </a>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SIGNATURE -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="text-align:center; padding:24px;">
  <p style="margin:0 0 4px; color:${TEXT}; font-size:15px; font-weight:700;">
    Merci d'avoir lu ma newsletter :)
  </p>
  <p style="margin:0 0 16px; color:${TEXT}; font-size:15px; font-weight:700;">
    N'hésite pas à la partager !
  </p>
  <img src="https://emeline-siron.fr/images/site/02-patrimoine-cles/patrimoine-01-deux-trousseaux-cles.jpg"
       alt="Emeline Siron"
       style="width:96px; height:96px; border-radius:50%; object-fit:cover; display:inline-block;" />
  <p style="margin:12px 0 0; color:${TEXT}; font-size:16px; font-weight:700;">Emeline Siron</p>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- FOOTER légal -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div style="padding:24px; border-top:1px solid ${BORDER}; text-align:center; color:${TEXT_MUTED}; font-size:11px; line-height:1.6;">
  <p style="margin:0 0 4px;"><strong>SAS EVERMIND FORMATION</strong>, 67 cours Mirabeau, 13100 Aix-en-Provence</p>
  <p style="margin:0 0 4px;">Cet e-mail a été envoyé à {{email}}.</p>
  <p style="margin:0;">
    Vous ne souhaitez plus recevoir nos mails ?
    <a href="{{unsubscribe_url}}" style="color:${TEXT_MUTED}; text-decoration:underline;">Se désinscrire</a>
  </p>
</div>
  `.trim();
}
