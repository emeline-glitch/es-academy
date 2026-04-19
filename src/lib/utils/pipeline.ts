export type PipelineStage =
  | "leads"
  | "prospect"
  | "rdv_pris"
  | "rdv_effectif"
  | "rdv_non_effectif"
  | "offre_envoyee"
  | "non_qualifie"
  | "gagne"
  | "perdu";

export const PIPELINE_STAGES: {
  key: PipelineStage;
  label: string;
  color: string;
  textColor: string;
}[] = [
  { key: "leads", label: "Leads", color: "bg-gray-50 border-gray-300", textColor: "text-gray-700" },
  { key: "prospect", label: "Prospect", color: "bg-blue-50 border-blue-300", textColor: "text-blue-700" },
  { key: "rdv_pris", label: "RDV pris", color: "bg-indigo-50 border-indigo-300", textColor: "text-indigo-700" },
  { key: "rdv_effectif", label: "RDV effectif", color: "bg-cyan-50 border-cyan-300", textColor: "text-cyan-700" },
  { key: "rdv_non_effectif", label: "RDV non effectif", color: "bg-amber-50 border-amber-300", textColor: "text-amber-700" },
  { key: "offre_envoyee", label: "Offre envoyée", color: "bg-purple-50 border-purple-300", textColor: "text-purple-700" },
  { key: "non_qualifie", label: "Non qualifié", color: "bg-zinc-50 border-zinc-300", textColor: "text-zinc-600" },
  { key: "gagne", label: "Gagné", color: "bg-green-50 border-green-400", textColor: "text-green-700" },
  { key: "perdu", label: "Perdu", color: "bg-red-50 border-red-300", textColor: "text-red-700" },
];

export function getStageLabel(stage: PipelineStage): string {
  return PIPELINE_STAGES.find((s) => s.key === stage)?.label || stage;
}
