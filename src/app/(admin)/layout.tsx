import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";
import { AdminNav } from "@/components/admin/AdminNav";
import { CommandPalette } from "@/components/admin/CommandPalette";
import Link from "next/link";

const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Pipeline", href: "/admin/pipeline", icon: "🎯" },
  { label: "Contacts CRM", href: "/admin/contacts", icon: "👥" },
  { label: "Listes", href: "/admin/lists", icon: "📋" },
  { label: "Formulaires", href: "/admin/forms", icon: "📝" },
  { label: "Lead Magnets", href: "/admin/lead-magnets", icon: "🧲" },
  { label: "Élèves", href: "/admin/eleves", icon: "🎓" },
  { label: "Emails", href: "/admin/emails", icon: "📧" },
  { label: "Séquences", href: "/admin/sequences", icon: "⚡" },
  { label: "Tunnels", href: "/admin/tunnels", icon: "🔄" },
  { label: "Activité", href: "/admin/activity", icon: "🕓" },
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

  // Check admin role (email-based for now, peut évoluer vers profile.role)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    redirect("/dashboard");
  }

  return (
    <ToastProvider>
      <CommandPalette />
      <div className="min-h-screen bg-gray-50 flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-es-green-dark text-white flex flex-col shrink-0">
          <div className="p-6 border-b border-white/10">
            <Link href="/admin/dashboard" className="font-serif text-lg font-bold">
              ES Academy
            </Link>
            <p className="text-xs text-white/50 mt-1">Administration</p>
            <p className="text-[10px] text-white/30 mt-3">
              Astuce : <kbd className="bg-white/10 px-1 rounded">⌘K</kbd> pour la recherche
            </p>
          </div>
          <AdminNav items={adminNav} />
          <div className="p-6 border-t border-white/10">
            <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              ← Espace élève
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>
    </ToastProvider>
  );
}
