import { getCachedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { RESOURCES, type ResourceEntry } from "@/lib/ressources-manifest";

const typeIcons: Record<string, string> = {
  Excel: "📊",
  PDF: "📄",
  Template: "📝",
  Checklist: "✅",
  Video: "🎬",
  Autre: "📁",
};

const typeColors: Record<string, string> = {
  Excel: "bg-green-50 text-green-700",
  PDF: "bg-red-50 text-red-700",
  Template: "bg-blue-50 text-blue-700",
  Checklist: "bg-amber-50 text-amber-700",
  Video: "bg-purple-50 text-purple-700",
  Autre: "bg-gray-50 text-gray-700",
};

export default async function RessourcesPage() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  // Groupe par module
  const byModule = new Map<number, { label: string; entries: ResourceEntry[] }>();
  for (const r of RESOURCES) {
    if (!byModule.has(r.moduleNum)) {
      byModule.set(r.moduleNum, { label: r.moduleLabel, entries: [] });
    }
    byModule.get(r.moduleNum)!.entries.push(r);
  }
  const sortedModules = Array.from(byModule.entries()).sort(([a], [b]) => a - b);

  const totalAvailable = RESOURCES.filter((r) => r.available).length;
  const totalUnavailable = RESOURCES.length - totalAvailable;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Ressources</h1>
        <p className="text-gray-500 mt-1">
          {totalAvailable} outils telechargeables, classes par module.
          {totalUnavailable > 0 && (
            <span className="text-amber-600"> {totalUnavailable} en cours de finalisation.</span>
          )}
        </p>
      </div>

      <div className="space-y-8">
        {sortedModules.map(([moduleNum, { label, entries }]) => (
          <section key={moduleNum}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium uppercase tracking-widest text-es-green">
                Module {moduleNum}
              </span>
              <h2 className="font-serif text-xl font-bold text-gray-900">{label}</h2>
              <span className="text-xs text-gray-400">
                {entries.filter((e) => e.available).length} / {entries.length} dispo
              </span>
            </div>

            <Card>
              <div className="grid sm:grid-cols-2 gap-2">
                {entries.map((entry, j) => {
                  const icon = typeIcons[entry.type] || typeIcons.Autre;
                  const color = typeColors[entry.type] || typeColors.Autre;
                  if (!entry.available) {
                    return (
                      <div
                        key={j}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg shrink-0">{icon}</span>
                          <span className="text-sm text-gray-500 truncate">{entry.name}</span>
                        </div>
                        <span className="text-[10px] text-amber-600 font-medium shrink-0 ml-2">
                          Bientot
                        </span>
                      </div>
                    );
                  }
                  return (
                    <a
                      key={j}
                      href={entry.path}
                      download
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-es-green/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 group-hover:text-es-green transition-colors block truncate">
                            {entry.name}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {entry.sm} &middot; {entry.format.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full shrink-0 ml-2 ${color}`}
                      >
                        {entry.type}
                      </span>
                    </a>
                  );
                })}
              </div>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
