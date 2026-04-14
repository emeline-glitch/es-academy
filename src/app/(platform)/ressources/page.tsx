import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";

const localResources = [
  { name: "Comparatif Types de Location", file: "/ressources/01_Comparatif_Types_Location.xlsx", type: "Excel" },
  { name: "Template Étude de Marché", file: "/ressources/03_Template_Etude_Marche.xlsx", type: "Excel" },
  { name: "Grille Scoring Ville", file: "/ressources/04_Grille_Scoring_Ville.xlsx", type: "Excel" },
  { name: "Calculateur Cash-Flow", file: "/ressources/05_Calculateur_Cashflow.xlsx", type: "Excel" },
  { name: "Simulateur Effet de Levier", file: "/ressources/06_Simulateur_Effet_Levier.xlsx", type: "Excel" },
  { name: "Tableau de Bord Patrimoine", file: "/ressources/07_Tableau_Bord_Patrimoine.xlsx", type: "Excel" },
  { name: "Simulateur Amortissement LMNP", file: "/ressources/13_Simulateur_Amortissement.xlsx", type: "Excel" },
  { name: "Comparatif Holding / SCI / LMNP", file: "/ressources/28_Comparatif_Holding_SCI_LMNP.xlsx", type: "Excel" },
  { name: "Calculateur Plus-Value Immobilière", file: "/ressources/34_Calculateur_Plus_Value.xlsx", type: "Excel" },
  { name: "Simulateur Rentabilité Colocation", file: "/ressources/42_Simulateur_Rentabilite_Colocation.xlsx", type: "Excel" },
];

const RESOURCES_DB = process.env.NOTION_RESOURCES_DB || "";
const NOTION_API_KEY = process.env.NOTION_API_KEY || "";

interface NotionResource {
  name: string;
  type: string;
}

async function getNotionResources(): Promise<NotionResource[]> {
  if (!RESOURCES_DB || !NOTION_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${RESOURCES_DB}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { property: "Published", checkbox: { equals: true } },
          sorts: [{ property: "Order", direction: "ascending" }],
          page_size: 100,
        }),
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((page: Record<string, unknown>) => {
      const props = page.properties as Record<string, Record<string, unknown>>;
      const title = props?.Name?.title as Array<{ plain_text: string }> | undefined;
      const typeSelect = props?.Type?.select as { name: string } | null;
      return {
        name: title?.[0]?.plain_text || "",
        type: typeSelect?.name || "Autre",
      };
    });
  } catch {
    return [];
  }
}

const typeIcons: Record<string, string> = {
  Excel: "📊", PDF: "📄", Template: "📝", Checklist: "✅", Video: "🎬", Autre: "📁",
};

export default async function RessourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const notionResources = await getNotionResources();

  // Group Notion resources by type (non-downloadable for now)
  const notionByType: Record<string, NotionResource[]> = {};
  for (const r of notionResources) {
    const type = r.type || "Autre";
    if (!notionByType[type]) notionByType[type] = [];
    notionByType[type].push(r);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Ressources</h1>
        <p className="text-gray-500 mt-1">
          Tous les outils et documents de la formation.
        </p>
      </div>

      {/* Simulateurs & Calculateurs — téléchargeables */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">Simulateurs &amp; Calculateurs</h2>
            <p className="text-xs text-gray-400">{localResources.length} fichiers Excel téléchargeables</p>
          </div>
        </div>
        <div className="space-y-2">
          {localResources.map((item, j) => (
            <a
              key={j}
              href={item.file}
              download
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-es-green/5 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <svg className="w-5 h-5 text-es-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700 group-hover:text-es-green transition-colors truncate">{item.name}</span>
              </div>
              <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full text-green-600 bg-green-50 shrink-0 ml-2">
                Excel
              </span>
            </a>
          ))}
        </div>
      </Card>

      {/* Notion resources — grouped by type */}
      {Object.entries(notionByType).length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(notionByType).map(([type, items]) => (
            <Card key={type}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{typeIcons[type] || "📁"}</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-gray-900">{type}</h2>
                  <p className="text-xs text-gray-400">{items.length} ressource{items.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="space-y-2">
                {items.map((item, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-500 truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">Bientôt</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
