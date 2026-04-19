import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Pipeline", href: "/admin/pipeline", icon: "🎯" },
  { label: "Contacts CRM", href: "/admin/contacts", icon: "👥" },
  { label: "Listes", href: "/admin/lists", icon: "📋" },
  { label: "Élèves", href: "/admin/eleves", icon: "🎓" },
  { label: "Emails", href: "/admin/emails", icon: "📧" },
  { label: "Séquences", href: "/admin/sequences", icon: "⚡" },
  { label: "Tunnels", href: "/admin/tunnels", icon: "🔄" },
  { label: "Paramètres", href: "/admin/settings", icon: "⚙️" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Check admin role (simple email check for now)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-es-green-dark text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin/dashboard" className="font-serif text-lg font-bold">
            ES Academy
          </Link>
          <p className="text-xs text-white/50 mt-1">Administration</p>
        </div>
        <nav className="flex-1 py-4">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-white/10">
          <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            ← Espace eleve
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
