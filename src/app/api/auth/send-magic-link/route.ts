import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * POST /api/auth/send-magic-link
 *
 * Renvoie un magic link de connexion a l'email donne. Utilise quand un user
 * arrive sur /connexion via un lien expire (?error=auth) ou veut juste se
 * connecter sans mot de passe.
 *
 * Important : on n'expose PAS si l'email existe en DB ou non (anti-enum).
 * Supabase signInWithOtp envoie un mail si le user existe, sinon rien.
 * Cote client on retourne toujours { ok: true } pour eviter de leaker.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = (body as { email?: unknown })?.email;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = await createClient();
  // shouldCreateUser=false : on ne cree PAS de compte si l'email n'existe pas.
  // Pour Academy, l'user a forcement deja un compte (cree par le webhook Stripe).
  const { error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${SITE_URL}/api/auth/callback?next=/dashboard`,
    },
  });

  if (error && !error.message.toLowerCase().includes("not allowed")) {
    // Erreur reelle (rate limit, SMTP down, etc) : log mais retourne ok
    // pour ne pas leaker l'existence du compte. Le user retentera.
    console.error("[auth/send-magic-link] supabase error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
