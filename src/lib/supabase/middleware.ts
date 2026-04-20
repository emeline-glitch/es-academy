import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware auth optimisé : on ne fait PLUS d'appel Supabase ici.
 *
 * Avant : chaque page protégée faisait 1 round-trip Supabase dans le middleware (200-500ms)
 * puis 1 autre round-trip dans le server component. 2 appels série = très lent.
 *
 * Maintenant : on check juste la présence d'un cookie Supabase (détection regex). Si présent,
 * on laisse passer sans appel réseau. Si absent sur une page protégée, on redirect vers /connexion
 * immédiatement. Le server component fait sa propre vérif (via supabase.auth.getUser() qui lit
 * le cookie) pour la logique métier. Un seul round-trip au total.
 *
 * Pour les pages publiques, on ne fait rien du tout.
 */

const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/cours", "/profil"];
const AUTH_PAGES = ["/connexion", "/inscription"];

// Pattern des cookies Supabase : sb-<projectref>-auth-token
// On détecte juste la présence, pas le contenu.
function hasSupabaseCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  return cookies.some(
    (c) => /^sb-[a-z0-9]+-auth-token/.test(c.name) && c.value && c.value.length > 20
  );
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Fast path public : aucun check
  if (!isProtected && !isAuthPage) {
    return NextResponse.next({ request });
  }

  const hasCookie = hasSupabaseCookie(request);

  // Page protégée, pas de cookie → redirect connexion immédiat (aucun appel réseau)
  if (isProtected && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Page auth avec cookie existant → redirect vers dashboard (aucun appel réseau)
  // Note : si le cookie est expiré, le server component du dashboard fera le redirect proprement.
  if (isAuthPage && hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Sinon : on laisse passer. Le server component de la page fera sa propre vérification.
  return NextResponse.next({ request });
}
