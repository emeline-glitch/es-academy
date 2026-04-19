import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes qui nécessitent une vérification d'auth (seul endroit où on appelle getUser()).
// Pour toutes les autres URLs (blog, home, /academy, etc.), on skip → économise un RTT Supabase sur chaque requête.
const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/cours", "/profil"];
const AUTH_PAGES = ["/connexion", "/inscription"];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsAuthCheck =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) || AUTH_PAGES.includes(pathname);

  // Fast path : aucune vérification d'auth nécessaire → on laisse passer sans appeler Supabase.
  if (!needsAuthCheck) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes : redirect to /connexion if not authenticated
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
