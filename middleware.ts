import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Protection par mot de passe (désactiver en mettant SITE_PASSWORD="" dans .env)
  const sitePassword = process.env.SITE_PASSWORD;

  if (sitePassword) {
    // Ne pas protéger les assets, les API publiques, les formulaires publics et le tracking
    const path = request.nextUrl.pathname;
    if (
      path.startsWith("/api/track/") ||
      path.startsWith("/api/site-auth") ||
      path.startsWith("/api/forms/") || // Endpoint public des formulaires (GET config + POST submit)
      path.startsWith("/api/contacts") || // Endpoint public d'inscription newsletter
      path.startsWith("/form/") || // Page publique du formulaire — doit être accessible sans mot de passe site
      path.startsWith("/desabonnement") || // Lien de désinscription email doit marcher sans mdp
      path.startsWith("/_next/") ||
      path.startsWith("/favicon") ||
      path === "/site-password"
    ) {
      // Laisser passer
    } else {
      // Vérifier le cookie de mot de passe
      const authCookie = request.cookies.get("site_auth")?.value;
      if (authCookie !== sitePassword) {
        // Rediriger vers la page mot de passe
        if (path !== "/site-password") {
          const url = request.nextUrl.clone();
          url.pathname = "/site-password";
          url.searchParams.set("redirect", path);
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
