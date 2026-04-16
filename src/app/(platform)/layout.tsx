import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const platformNav = [
  { label: "Dashboard", href: "/dashboard", icon: "🏠" },
  { label: "Ma formation", href: "/cours/methode-emeline-siron", icon: "🎓" },
  { label: "Ressources", href: "/ressources", icon: "📦" },
  { label: "Examen final", href: "/evaluation", icon: "📝" },
  { label: "Coaching", href: "/coaching", icon: "💬" },
  { label: "ES Family", href: "/family", icon: "👑" },
];

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Élève";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-serif text-lg font-bold text-es-green">
              Emeline Siron
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {platformNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-es-green hover:bg-es-green/5 rounded-lg transition-colors"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/profil"
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-es-green/10 flex items-center justify-center">
                <span className="text-xs font-bold text-es-green">{initials}</span>
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">{displayName}</span>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-100 px-4 py-2 flex gap-1 overflow-x-auto">
          {platformNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-es-green hover:bg-es-green/5 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
