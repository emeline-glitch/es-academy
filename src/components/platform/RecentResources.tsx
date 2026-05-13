import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { ResourceEntry } from "@/lib/ressources-manifest";

const typeIcons: Record<string, string> = {
  Excel: "Excel",
  PDF: "PDF",
  Template: "Modèle",
  Checklist: "Check-list",
  Video: "Vidéo",
  Autre: "Fichier",
};

export function RecentResources({ resources }: { resources: ResourceEntry[] }) {
  if (resources.length === 0) return null;
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-gray-900">A télécharger pour ce module</h3>
        <Link href="/ressources" className="text-sm text-es-green hover:underline">
          Voir tout
        </Link>
      </div>
      <ul className="space-y-2">
        {resources.map((r) => (
          <li key={r.path}>
            <a
              href={r.path}
              download
              className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-es-green/5 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 truncate">{r.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {r.sm} <span className="text-gray-300">·</span> {r.format.toUpperCase()}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {typeIcons[r.type] || "Fichier"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
