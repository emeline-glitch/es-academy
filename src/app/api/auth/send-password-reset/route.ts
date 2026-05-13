import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { validateBody } from "@/lib/validators/validate";
import { MagicLinkRequestSchema } from "@/lib/validators/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

/**
 * POST /api/auth/send-password-reset
 *
 * Reset password personnalise : on bypass l'email Supabase par defaut (moche)
 * et on envoie notre propre template `reset_password` chartre via SES.
 *
 * Flow :
 *  1) admin.generateLink(type='recovery') -> URL de reset signee Supabase
 *  2) renderEmailTemplate('reset_password') -> HTML chartre depuis email_templates
 *  3) sendEmail SES avec le HTML rendu
 *
 * Anti-enum : retourne toujours { ok: true } meme si l'email n'existe pas
 * (pas de leak d'existence de compte, conformite RGPD + bonne pratique
 * sec). Le user fait sa demande et voit "si un compte existe, le mail
 * arrivera". Si vraiment pas de compte, juste pas de mail recu.
 */
export async function POST(request: Request) {
  const v = await validateBody(request, MagicLinkRequestSchema);
  if (!v.ok) return v.response;
  const { email } = v.data;

  const admin = await createServiceClient();

  // 1) Lookup user pour recuperer first_name (pour le {{prenom}} du template)
  //    via le RPC qui passe par auth.users (admin only).
  const { data: existingList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = existingList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Pas de compte avec cet email. Anti-enum : on retourne ok sans envoyer.
    return NextResponse.json({ ok: true });
  }

  // Best-effort recup prenom : metadata Supabase, puis profile, puis fallback.
  let firstName = "";
  const metaFull = (user.user_metadata?.full_name as string | undefined) || "";
  const metaFirst = (user.user_metadata?.first_name as string | undefined) || "";
  firstName = metaFirst || metaFull.split(" ")[0] || "";

  if (!firstName) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null }>();
    firstName = profile?.full_name?.split(" ")[0] || "";
  }

  if (!firstName) firstName = "à toi";

  // 2) Genere le lien de recovery via admin.generateLink (1h de validite par defaut).
  //    Important PKCE : on route via /api/auth/callback qui fait
  //    exchangeCodeForSession et pose les cookies de session. Sans ca, la
  //    page /reset-password n'a pas de session valide cote client et
  //    updateUser plante avec "Auth session missing".
  //    L'URL doit etre dans la whitelist Supabase Auth > URL Configuration.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${SITE_URL}/api/auth/callback?next=/reset-password`,
    },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[auth/send-password-reset] generateLink failed:", linkErr?.message);
    // Anti-enum : on retourne ok meme en cas d'echec interne, le user retentera.
    return NextResponse.json({ ok: true });
  }

  const resetUrl = linkData.properties.action_link;

  // 3) Rendu du template DB + envoi SES.
  const rendered = await renderEmailTemplate("reset_password", {
    prenom: firstName,
    reset_url: resetUrl,
  });

  if (!rendered) {
    console.error("[auth/send-password-reset] template 'reset_password' introuvable en DB");
    return NextResponse.json({ ok: true });
  }

  try {
    await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      from: `${rendered.from_name} <${rendered.from_email}>`,
      replyTo: rendered.reply_to ?? undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth/send-password-reset] SES sendEmail failed:", msg);
    // Anti-enum : ok meme si SES echoue.
  }

  return NextResponse.json({ ok: true });
}
