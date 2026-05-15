import { getCachedUser, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { updateAnnualTarget } from "./actions";

interface FinanceSummary {
  month_ttc_cents: number;
  quarter_ttc_cents: number;
  year_ttc_cents: number;
  prev_year_ttc_cents: number;
  year_ht_cents: number;
  family_mrr_cents: number;
  family_arr_cents: number;
  academy_year_cents: number;
  family_year_cents: number;
  annual_target_cents: number;
  target_progress_pct: number;
  q1_target_cents: number;
  q1_realised_cents: number;
  q2_target_cents: number;
  q2_realised_cents: number;
  q3_target_cents: number;
  q3_realised_cents: number;
  q4_target_cents: number;
  q4_realised_cents: number;
  current_quarter: number;
  current_year: number;
}

function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€`;
}

function deltaYoY(current: number, previous: number): { label: string; color: string } {
  if (previous === 0) {
    return current > 0
      ? { label: "Nouveau", color: "text-es-green" }
      : { label: "—", color: "text-gray-400" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { label: `+${pct}%`, color: "text-es-green" };
  if (pct < 0) return { label: `${pct}%`, color: "text-red-600" };
  return { label: "0%", color: "text-gray-500" };
}

/**
 * Page Finance privee : visible uniquement par Emeline (ADMIN_EMAIL).
 * Bloque l'acces aux autres admins (Antony, Tiffany) meme s'ils ont
 * role=admin en DB. Verification stricte par email.
 */
export default async function FinancePage() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  // ADMIN_EMAIL peut etre un CSV de plusieurs emails (Emeline a 2 comptes :
  // emeline@emeline-siron.fr + emeline.siron@hotmail.fr). On accepte n'importe
  // lequel pour la page Finance.
  const ownerEmails = (process.env.ADMIN_EMAIL || "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const userEmail = (user.email || "").toLowerCase();
  if (ownerEmails.length === 0 || !ownerEmails.includes(userEmail)) {
    redirect("/admin/dashboard");
  }

  const supabase = await createClient();
  const { data: summaryRaw } = await supabase.rpc("finance_summary");
  const s = (summaryRaw?.[0] as FinanceSummary | undefined) || {
    month_ttc_cents: 0,
    quarter_ttc_cents: 0,
    year_ttc_cents: 0,
    prev_year_ttc_cents: 0,
    year_ht_cents: 0,
    family_mrr_cents: 0,
    family_arr_cents: 0,
    academy_year_cents: 0,
    family_year_cents: 0,
    annual_target_cents: 0,
    target_progress_pct: 0,
    q1_target_cents: 0,
    q1_realised_cents: 0,
    q2_target_cents: 0,
    q2_realised_cents: 0,
    q3_target_cents: 0,
    q3_realised_cents: 0,
    q4_target_cents: 0,
    q4_realised_cents: 0,
    current_quarter: 1,
    current_year: new Date().getFullYear(),
  };

  const quarters = [
    { num: 1, target: s.q1_target_cents, realised: s.q1_realised_cents },
    { num: 2, target: s.q2_target_cents, realised: s.q2_realised_cents },
    { num: 3, target: s.q3_target_cents, realised: s.q3_realised_cents },
    { num: 4, target: s.q4_target_cents, realised: s.q4_realised_cents },
  ];

  const yoy = deltaYoY(s.year_ttc_cents, s.prev_year_ttc_cents);
  const remainingToTarget = Math.max(0, s.annual_target_cents - s.year_ttc_cents);
  const monthsLeftInYear = 12 - new Date().getMonth();
  const monthlyEffortNeeded = monthsLeftInYear > 0
    ? Math.ceil(remainingToTarget / monthsLeftInYear)
    : 0;

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-serif text-2xl font-bold text-gray-900">Finance</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Privé</span>
        </div>
        <p className="text-sm text-gray-500">
          Vue financière personnelle réservée à Emeline. Antony, Tiffany et les autres admins ne voient pas cette page.
        </p>
      </header>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">CA ce mois</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatEur(s.month_ttc_cents)}</p>
          <p className="text-xs text-gray-400 mt-1">TTC · {formatEur(Math.floor(s.month_ttc_cents / 1.2))} HT</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">CA trimestre Q{s.current_quarter}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatEur(s.quarter_ttc_cents)}</p>
          <p className="text-xs text-gray-400 mt-1">TTC · {formatEur(Math.floor(s.quarter_ttc_cents / 1.2))} HT</p>
        </Card>
        <Card>
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">CA année {s.current_year}</p>
            <span className={`text-xs font-semibold ${yoy.color}`}>{yoy.label}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatEur(s.year_ttc_cents)}</p>
          <p className="text-xs text-gray-400 mt-1">
            TTC · {formatEur(s.year_ht_cents)} HT · vs {formatEur(s.prev_year_ttc_cents)} en {s.current_year - 1}
          </p>
        </Card>
      </div>

      {/* Objectif annuel + edition inline */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">Objectif {s.current_year}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Progression vers la cible annuelle</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-es-green">{s.target_progress_pct}%</p>
            <p className="text-[10px] text-gray-400">{formatEur(s.year_ttc_cents)} / {formatEur(s.annual_target_cents)}</p>
          </div>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-es-green transition-all"
            style={{ width: `${Math.min(100, s.target_progress_pct)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-xs text-gray-500">Reste à faire</p>
            <p className="font-semibold text-gray-900">{formatEur(remainingToTarget)} TTC</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Effort mensuel moyen requis ({monthsLeftInYear} mois restants)</p>
            <p className="font-semibold text-gray-900">{formatEur(monthlyEffortNeeded)} TTC / mois</p>
          </div>
        </div>
        <form action={updateAnnualTarget} className="pt-4 border-t border-gray-100 space-y-3">
          <input type="hidden" name="year" value={s.current_year} />
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <div className="sm:col-span-1">
              <label htmlFor="target_eur" className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                Objectif annuel
              </label>
              <input
                id="target_eur"
                name="target_eur"
                type="text"
                inputMode="decimal"
                defaultValue={(s.annual_target_cents / 100).toString()}
                placeholder="500000"
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-es-green/30"
              />
            </div>
            {quarters.map((q) => (
              <div key={q.num}>
                <label htmlFor={`q${q.num}_target_eur`} className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                  Q{q.num}
                </label>
                <input
                  id={`q${q.num}_target_eur`}
                  name={`q${q.num}_target_eur`}
                  type="text"
                  inputMode="decimal"
                  defaultValue={(q.target / 100).toString()}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-es-green/30"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[10px] text-gray-400 italic">
              Vide ou non rempli → répartition automatique (objectif annuel / 4 par trimestre).
            </p>
            <button
              type="submit"
              className="px-4 py-1.5 bg-es-green text-white rounded text-sm font-semibold hover:bg-es-green-light transition-colors cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Card>

      {/* Détail trimestriel : Q1 / Q2 / Q3 / Q4 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">Détail trimestriel {s.current_year}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Progression de chaque Q vs son objectif</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quarters.map((q) => {
            const pct = q.target > 0 ? Math.round((q.realised / q.target) * 100) : 0;
            const isCurrent = q.num === s.current_quarter;
            const isPast = q.num < s.current_quarter;
            const isFuture = q.num > s.current_quarter;
            const ringClass = isCurrent
              ? "border-es-green ring-2 ring-es-green/20"
              : isPast
                ? pct >= 100
                  ? "border-es-green/40"
                  : "border-red-300"
                : "border-gray-200";
            const barClass = isCurrent
              ? "bg-es-green"
              : isPast
                ? pct >= 100
                  ? "bg-es-green/70"
                  : "bg-amber-500"
                : "bg-gray-300";
            return (
              <div key={q.num} className={`rounded-lg border-2 ${ringClass} p-3 ${isFuture ? "opacity-60" : ""}`}>
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-xs font-bold text-gray-700">Q{q.num}</p>
                  {isCurrent && <span className="text-[9px] uppercase tracking-wider text-es-green font-semibold">En cours</span>}
                  {isPast && pct >= 100 && <span className="text-[9px] uppercase tracking-wider text-es-green font-semibold">Atteint</span>}
                  {isPast && pct < 100 && <span className="text-[9px] uppercase tracking-wider text-amber-600 font-semibold">Manqué</span>}
                </div>
                <p className="text-lg font-bold text-gray-900">{formatEur(q.realised)}</p>
                <p className="text-[10px] text-gray-500">sur {formatEur(q.target)}</p>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div className={`h-full transition-all ${barClass}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <p className={`text-[10px] font-semibold mt-1 ${pct >= 100 ? "text-es-green" : isPast ? "text-amber-600" : "text-gray-500"}`}>{pct}%</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* MRR Family + ARR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">MRR Family</p>
          <p className="text-3xl font-bold text-fuchsia-600 mt-1">{formatEur(s.family_mrr_cents)}</p>
          <p className="text-xs text-gray-400 mt-1">Revenu récurrent mensuel</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">ARR Family (projeté)</p>
          <p className="text-3xl font-bold text-fuchsia-600 mt-1">{formatEur(s.family_arr_cents)}</p>
          <p className="text-xs text-gray-400 mt-1">MRR × 12 si rétention 100%</p>
        </Card>
      </div>

      {/* Répartition Academy / Family */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">Répartition {s.current_year} par produit</h2>
            <p className="text-xs text-gray-500 mt-0.5">CA cumulé depuis le 1er janvier</p>
          </div>
        </div>
        {(() => {
          const total = s.academy_year_cents + s.family_year_cents;
          const pctAcademy = total > 0 ? Math.round((s.academy_year_cents / total) * 100) : 0;
          const pctFamily = total > 0 ? 100 - pctAcademy : 0;
          return (
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">Academy (one-shot)</p>
                  <p className="text-sm">
                    <span className="font-bold text-gray-900">{formatEur(s.academy_year_cents)}</span>{" "}
                    <span className="text-gray-400 text-xs">({pctAcademy}%)</span>
                  </p>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-es-green" style={{ width: `${pctAcademy}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">Family (récurrent)</p>
                  <p className="text-sm">
                    <span className="font-bold text-gray-900">{formatEur(s.family_year_cents)}</span>{" "}
                    <span className="text-gray-400 text-xs">({pctFamily}%)</span>
                  </p>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-500" style={{ width: `${pctFamily}%` }} />
                </div>
              </div>
            </div>
          );
        })()}
      </Card>

      <p className="text-xs text-gray-400 italic mt-8">
        Tous les montants sont en EUR. CA Family estimé en multipliant le MRR par les mois actifs depuis le début d&apos;année (approximation). HT calculé à 20% TVA standard.
      </p>
    </div>
  );
}
