// 3 pipelines ES Academy : Academy (formation), Family (abonnement récurrent), Sur-mesure (coaching/custom)
// Chaque pipeline a ses propres stages. Un contact peut être dans 0, 1, 2 ou 3 pipelines simultanément.

export type PipelineType = "academy" | "family" | "custom";

export interface StageDef<T extends string = string> {
  key: T;
  label: string;
  color: string;
  textColor: string;
}

// ──────────────────────────────────────────────────────────────────────
// Academy : formation unique 998€, cycle de vente long (prospect → RDV → offre → signature)
// ──────────────────────────────────────────────────────────────────────
export type PipelineAcademyStage =
  | "leads"
  | "prospect"
  | "rdv_pris"
  | "rdv_effectif"
  | "rdv_non_effectif"
  | "offre_envoyee"
  | "non_qualifie"
  | "gagne"
  | "perdu";

export const PIPELINE_ACADEMY_STAGES: StageDef<PipelineAcademyStage>[] = [
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

// ──────────────────────────────────────────────────────────────────────
// Family : abonnement récurrent 29€/mois (19€ alumni)
// Cycle court : arrive en trial, devient payant, ou churn
// ──────────────────────────────────────────────────────────────────────
export type PipelineFamilyStage =
  | "leads"
  | "trial_actif"
  | "membre_payant"
  | "churn"
  | "perdu";

export const PIPELINE_FAMILY_STAGES: StageDef<PipelineFamilyStage>[] = [
  { key: "leads", label: "Leads", color: "bg-gray-50 border-gray-300", textColor: "text-gray-700" },
  { key: "trial_actif", label: "Trial actif", color: "bg-amber-50 border-amber-300", textColor: "text-amber-700" },
  { key: "membre_payant", label: "Membre payant", color: "bg-green-50 border-green-400", textColor: "text-green-700" },
  { key: "churn", label: "Churné", color: "bg-orange-50 border-orange-300", textColor: "text-orange-700" },
  { key: "perdu", label: "Perdu", color: "bg-red-50 border-red-300", textColor: "text-red-700" },
];

// ──────────────────────────────────────────────────────────────────────
// Sur-mesure : coaching 1-to-1, demandes custom
// ──────────────────────────────────────────────────────────────────────
export type PipelineCustomStage =
  | "demande"
  | "qualification"
  | "devis_envoye"
  | "accepte"
  | "en_cours"
  | "termine"
  | "perdu";

export const PIPELINE_CUSTOM_STAGES: StageDef<PipelineCustomStage>[] = [
  { key: "demande", label: "Demande", color: "bg-gray-50 border-gray-300", textColor: "text-gray-700" },
  { key: "qualification", label: "Qualification", color: "bg-blue-50 border-blue-300", textColor: "text-blue-700" },
  { key: "devis_envoye", label: "Devis envoyé", color: "bg-purple-50 border-purple-300", textColor: "text-purple-700" },
  { key: "accepte", label: "Accepté", color: "bg-cyan-50 border-cyan-300", textColor: "text-cyan-700" },
  { key: "en_cours", label: "En cours", color: "bg-es-green/10 border-es-green", textColor: "text-es-green" },
  { key: "termine", label: "Terminé", color: "bg-green-50 border-green-400", textColor: "text-green-700" },
  { key: "perdu", label: "Perdu", color: "bg-red-50 border-red-300", textColor: "text-red-700" },
];

// ──────────────────────────────────────────────────────────────────────
// Config centrale des 3 pipelines
// ──────────────────────────────────────────────────────────────────────
export interface PipelineConfig {
  type: PipelineType;
  label: string;
  icon: string;
  columnDb: string;
  columnUpdatedAt: string;
  stages: StageDef[];
  description: string;
}

export const PIPELINES: Record<PipelineType, PipelineConfig> = {
  academy: {
    type: "academy",
    label: "Academy",
    icon: "🎓",
    columnDb: "pipeline_stage",
    columnUpdatedAt: "pipeline_updated_at",
    stages: PIPELINE_ACADEMY_STAGES as StageDef[],
    description: "Formation 998€ · cycle de vente long avec RDV et offre",
  },
  family: {
    type: "family",
    label: "Family",
    icon: "🏡",
    columnDb: "pipeline_family_stage",
    columnUpdatedAt: "pipeline_family_updated_at",
    stages: PIPELINE_FAMILY_STAGES as StageDef[],
    description: "Abonnement 29€/mois · trial → payant → churn",
  },
  custom: {
    type: "custom",
    label: "Sur-mesure",
    icon: "💎",
    columnDb: "pipeline_custom_stage",
    columnUpdatedAt: "pipeline_custom_updated_at",
    stages: PIPELINE_CUSTOM_STAGES as StageDef[],
    description: "Coaching 1-to-1 · demande → devis → accepté → en cours",
  },
};

// Legacy export pour compatibilité avec les anciens imports PIPELINE_STAGES et type PipelineStage
export const PIPELINE_STAGES = PIPELINE_ACADEMY_STAGES;
export type PipelineStage = PipelineAcademyStage;

export function getStageLabel(stage: string, pipelineType: PipelineType = "academy"): string {
  return PIPELINES[pipelineType].stages.find((s) => s.key === stage)?.label || stage;
}
