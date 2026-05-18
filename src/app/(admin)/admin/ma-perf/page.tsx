import { getCachedUser, createServiceClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/lib/utils/admin-auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";

// Mapping email -> identifiant de membre dans la RPC team_compensation_for_member.
// Quand un nouveau prestataire signe un contrat, ajoute son email ici.
const EMAIL_TO_MEMBER: Record<string, "tiffany" | "antony"> = {
  "tiffany@emeline-siron.fr": "tiffany",
  "antony@emeline-siron.fr": "antony",
};

const MEMBER_LABELS: Record<string, { name: string; role: string; color: string }> = {
  tiffany: { name: "Tiffany Grass", role: "Marketing & Community Management", color: "text-fuchsia-600" },
  antony: { name: "Antony d'Anna", role: "Commercial & Closing", color: "text-blue-600" },
};

interface MemberRow {
  member: string;
  fixed_cents: number;
  variable_academy_cents: number;
  variable_coaching_cents: number;
  variable_family_cents: number;
  total_cents: number;
  academy_sales_count: number;
  coaching_sales_count: number;
  family_new_members_count: number;
  family_active_members_count: number;
}

function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€`;
}

function monthBounds(date: Date): { start: string; end: string; label: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return { start: fmt(start), end: fmt(end), label };
}

/**
 * /admin/ma-perf : dashboard individuel pour les freelances (Tiffany, Antony).
 *
 * - Si l'admin connecte est l'owner (Emeline) -> vue d'ensemble equipe (les 2).
 * - Si l'admin connecte est Tiffany ou Antony -> vue de SES propres stats.
 * - Sinon : redirect dashboard.
 *
 * Stats du mois courant + 5 mois precedents pour comparer.
 */
export default async function MaPerfPage() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  const email = (user.email || "").toLowerCase();
  const isOwner = isOwnerEmail(email);
  const memberKey = EMAIL_TO_MEMBER[email];

  // Acces refuse si pas owner et pas membre de l'equipe configure
  if (!isOwner && !memberKey) {
    redirect("/admin/dashboard");
  }

  // Pour Emeline : on charge les 2. Pour Tiffany/Antony : seulement le leur.
  const membersToShow: Array<"tiffany" | "antony"> = isOwner
    ? ["tiffany", "antony"]
    : [memberKey as "tiffany" | "antony"];

  const supabase = await createServiceClient();
  const now = new Date();

  // 6 derniers mois (courant + 5 precedents) pour breakdown
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return monthBounds(d);
  });

  // Fetch toutes les comp pour tous les membres + 6 mois en parallele
  const results: Record<string, Record<string, MemberRow>> = {};
  for (const m of membersToShow) {
    results[m] = {};
    await Promise.all(
      months.map(async (mo) => {
        const { data } = await supabase.rpc("team_compensation_for_member", {
          p_member: m,
          p_period_start: mo.start,
          p_period_end: mo.end,
        });
        results[m][mo.start] = (data?.[0] as MemberRow) || {
          member: m,
          fixed_cents: 0,
          variable_academy_cents: 0,
          variable_coaching_cents: 0,
          variable_family_cents: 0,
          total_cents: 0,
          academy_sales_count: 0,
          coaching_sales_count: 0,
          family_new_members_count: 0,
          family_active_members_count: 0,
        };
      })
    );
  }

  const currentMonth = months[0];

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Ma performance</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isOwner
            ? `Vue d'ensemble équipe pour ${currentMonth.label}.`
            : `Tes ventes, conversions et commissions pour ${currentMonth.label}.`}
        </p>
      </header>

      {membersToShow.map((m) => {
        const profile = MEMBER_LABELS[m];
        const current = results[m][currentMonth.start];
        // Le fixe Tiffany est une donnee sensible (montant figure dans le
        // contrat). On le breakdownise UNIQUEMENT si Tiffany regarde sa
        // propre vue. Pour Emeline (owner vue equipe), on le masque dans
        // l'affichage mais on garde le total (qui l'inclut).
        const showFixedBreakdown = m === "tiffany" && memberKey === "tiffany";

        return (
          <section key={m} className="mb-10">
            {/* En-tete membre */}
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className={`font-serif text-xl font-bold ${profile.color}`}>{profile.name}</h2>
                <p className="text-xs text-gray-500">{profile.role}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">À facturer ce mois</p>
                <p className={`text-3xl font-bold ${profile.color}`}>{formatEur(current.total_cents)}</p>
                <p className="text-[10px] text-gray-400">HT</p>
              </div>
            </div>

            {/* KPI cards : breakdown commissions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {showFixedBreakdown && (
                <Card>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Fixe mensuel</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatEur(current.fixed_cents)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Contrat juin → nov 2026</p>
                </Card>
              )}
              <Card>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Academy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatEur(current.variable_academy_cents)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {current.academy_sales_count} vente{current.academy_sales_count > 1 ? "s" : ""}
                  {m === "tiffany" ? " · 3%" : " · 15%"} HT
                </p>
              </Card>
              {m === "antony" && (
                <Card>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Coaching</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatEur(current.variable_coaching_cents)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {current.coaching_sales_count} package · 15% HT
                  </p>
                </Card>
              )}
              <Card>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Family</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatEur(current.variable_family_cents)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {current.family_new_members_count} new
                  {m === "tiffany" ? " · 7€/membre actif M+2" : ` · 10% MRR sur ${current.family_active_members_count} actifs`}
                </p>
              </Card>
              {m === "tiffany" && (
                <Card>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Total à facturer</p>
                  <p className="text-2xl font-bold text-es-green mt-1">{formatEur(current.total_cents)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    HT {showFixedBreakdown ? "(fixe + variables)" : "(toutes composantes)"}
                  </p>
                </Card>
              )}
            </div>

            {/* Historique 6 derniers mois */}
            <Card>
              <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Historique 6 derniers mois</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase text-gray-500 tracking-wider border-b border-gray-100">
                      <th className="text-left py-2 px-2">Mois</th>
                      {showFixedBreakdown && <th className="text-right py-2 px-2">Fixe</th>}
                      <th className="text-right py-2 px-2">Academy</th>
                      {m === "antony" && <th className="text-right py-2 px-2">Coaching</th>}
                      <th className="text-right py-2 px-2">Family</th>
                      <th className="text-right py-2 px-2">Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((mo, i) => {
                      const r = results[m][mo.start];
                      return (
                        <tr key={mo.start} className={`border-b border-gray-50 last:border-0 ${i === 0 ? "font-semibold bg-gray-50/50" : ""}`}>
                          <td className="py-2 px-2 text-gray-700 capitalize">{mo.label}</td>
                          {showFixedBreakdown && <td className="py-2 px-2 text-right text-gray-600">{formatEur(r.fixed_cents)}</td>}
                          <td className="py-2 px-2 text-right text-gray-600">
                            {formatEur(r.variable_academy_cents)}
                            <span className="text-[10px] text-gray-400 ml-1">({r.academy_sales_count})</span>
                          </td>
                          {m === "antony" && (
                            <td className="py-2 px-2 text-right text-gray-600">
                              {formatEur(r.variable_coaching_cents)}
                              <span className="text-[10px] text-gray-400 ml-1">({r.coaching_sales_count})</span>
                            </td>
                          )}
                          <td className="py-2 px-2 text-right text-gray-600">
                            {formatEur(r.variable_family_cents)}
                            <span className="text-[10px] text-gray-400 ml-1">({r.family_new_members_count})</span>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-gray-900">{formatEur(r.total_cents)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Note explicative */}
            <p className="text-[11px] text-gray-400 italic mt-3">
              {m === "tiffany"
                ? "Attribution basée sur les contacts avec un tag lm:* (lead magnets). Le décompte définitif Family se fait à M+3 (vérification activité M+2)."
                : "Attribution basée sur les contacts avec tag closer:antony (posé automatiquement par le webhook Calendly). MRR Family : 10% pendant max 12 mois par membre actif."}
            </p>
          </section>
        );
      })}

      <p className="text-xs text-gray-400 italic mt-8">
        Montants en EUR HT. Calculés en temps réel sur la base des contrats freelance (juin → nov 2026). Une discordance ?
        Vérifie le breakdown détaillé avec Emeline qui validera l'état mensuel avant facturation.
      </p>
    </div>
  );
}
