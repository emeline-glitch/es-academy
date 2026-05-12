import { getCachedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RESOURCES } from "@/lib/ressources-manifest";
import { RessourcesList } from "@/components/platform/RessourcesList";

export default async function RessourcesPage() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Ressources</h1>
        <p className="text-gray-500 mt-1">
          {RESOURCES.length} outils telechargeables, classes par module.
        </p>
      </div>

      <RessourcesList resources={RESOURCES} />
    </div>
  );
}
