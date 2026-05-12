import { getCachedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RESOURCES } from "@/lib/ressources-manifest";
import { RessourcesList } from "@/components/platform/RessourcesList";
import { Breadcrumb } from "@/components/platform/Breadcrumb";

export default async function RessourcesPage() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  const availableCount = RESOURCES.filter((r) => r.available).length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Ressources" }]} />

      <header>
        <h1 className="font-serif text-3xl font-bold text-gray-900">Ressources de la formation</h1>
        <p className="text-gray-500 mt-1">
          {availableCount} outils téléchargeables, classes par module. Excel, PDF, modèles a remplir.
        </p>
      </header>

      <RessourcesList resources={RESOURCES} />
    </div>
  );
}
