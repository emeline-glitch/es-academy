import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}

/**
 * getCachedUser : wrapper sur supabase.auth.getUser() avec React cache.
 * Pendant un même render-tree (page + layouts), le résultat est mémoïsé.
 * Si 3 composants appellent getCachedUser(), il n'y aura qu'UN seul round-trip Supabase.
 * Gain attendu : /admin/xxx qui check user dans le layout + dans la page = 1 call au lieu de 2.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Service role client — bypasse RLS. À utiliser uniquement après un `requireAdmin()` côté API.
 * N'utilise PAS @supabase/ssr : ce dernier passe le JWT du cookie utilisateur en Authorization,
 * ce qui invalide le service role et fait apparaître des erreurs RLS fantômes sur les INSERT.
 * Ici on utilise directement supabase-js avec la clé service role → plein pouvoir, sans cookie.
 */
export async function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
