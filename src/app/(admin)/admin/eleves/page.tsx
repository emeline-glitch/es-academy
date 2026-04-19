"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CoachingCreditsCell } from "@/components/admin/CoachingCreditsCell";
import { useToast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useDebounce";
import { formatRelative, formatMoney } from "@/lib/utils/format";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  coaching_credits_total: number;
  coaching_credits_used: number;
  created_at: string;
}

interface Enrollment {
  id: string;
  product_name: string;
  amount_paid: number;
  purchased_at: string;
  status: string;
  profiles: Profile | null;
  progress_count: number;
}

interface Response {
  enrollments: Enrollment[];
  total: number;
  page: number;
  pageSize: number;
  kpis: { total_eleves: number; month_count: number; month_revenue: number };
}

const PRODUCTS = [
  { key: "all", label: "Toutes formules" },
  { key: "academy", label: "Academy" },
  { key: "expert", label: "Expert" },
  { key: "coaching", label: "Coaching seul" },
  { key: "family", label: "Family" },
];

const TOTAL_LESSONS = 64; // 14 modules · ~4-5 leçons

export default function AdminEleves() {
  const toast = useToast();
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);
  const [product, setProduct] = useState("all");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "30" });
      if (search) params.set("q", search);
      if (product !== "all") params.set("product", product);
      const res = await fetch(`/api/admin/eleves?${params}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Impossible de charger les élèves");
    } finally {
      setLoading(false);
    }
  }, [search, product, page, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = data?.kpis;
  const enrollments = data?.enrollments || [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="text-sm text-gray-500 mt-1">
            {kpis?.total_eleves || 0} élèves inscrits au total
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total élèves</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{kpis?.total_eleves || 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Ce mois-ci</p>
          <p className="text-2xl font-bold text-es-green mt-1">{kpis?.month_count || 0} ventes</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider">CA ce mois-ci</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatMoney(kpis?.month_revenue || 0)}</p>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          placeholder="Rechercher par nom ou email…"
          value={rawSearch}
          onChange={(e) => {
            setRawSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm"
        />
        <select
          value={product}
          onChange={(e) => {
            setProduct(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          {PRODUCTS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Liste */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Élève</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Formule</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Achat</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Progression</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Coaching</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="w-6 h-6 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin mx-auto" />
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    {search ? `Aucun élève pour « ${search} »` : "Aucun élève pour l'instant"}
                  </td>
                </tr>
              ) : (
                enrollments.map((e) => {
                  const p = e.profiles;
                  const name = p?.full_name || p?.email || "—";
                  const progressPct = Math.round((e.progress_count / TOTAL_LESSONS) * 100);
                  return (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={p?.id ? `/admin/eleves/${p.id}` : "#"} className="group">
                          <p className="text-sm text-gray-900 font-medium group-hover:text-es-green truncate">{name}</p>
                          {p?.email && p.email !== name && (
                            <p className="text-xs text-gray-500 truncate">{p.email}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={e.product_name === "expert" ? "warning" : "success"}>
                          {e.product_name}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {formatRelative(e.purchased_at)}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-gray-900">
                        {formatMoney(e.amount_paid)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                            <div
                              className="bg-es-green h-1.5 rounded-full"
                              style={{ width: `${Math.min(progressPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{progressPct}%</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {e.progress_count}/{TOTAL_LESSONS} leçons
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        {p && (
                          <CoachingCreditsCell
                            userId={p.id}
                            initialTotal={p.coaching_credits_total}
                            initialUsed={p.coaching_credits_used}
                          />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {p?.id && (
                          <Link
                            href={`/admin/eleves/${p.id}`}
                            prefetch
                            className="text-sm text-es-green hover:underline"
                          >
                            Voir →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-500 hover:text-es-green disabled:opacity-30 cursor-pointer"
            >
              ← Précédent
            </button>
            <span className="text-xs text-gray-400">
              Page {page} / {totalPages} · {data.total} élèves
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-sm text-gray-500 hover:text-es-green disabled:opacity-30 cursor-pointer"
            >
              Suivant →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
