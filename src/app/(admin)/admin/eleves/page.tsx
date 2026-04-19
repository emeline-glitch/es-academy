import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { CoachingCreditsCell } from "@/components/admin/CoachingCreditsCell";

export default async function AdminEleves() {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      profiles:user_id (full_name, coaching_credits_total, coaching_credits_used)
    `)
    .order("purchased_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Élèves</h1>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Formule</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date achat</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Coaching</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments && enrollments.length > 0 ? (
                enrollments.map((enrollment) => {
                  const profile = enrollment.profiles as {
                    full_name: string;
                    coaching_credits_total?: number;
                    coaching_credits_used?: number;
                  } | null;
                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {profile?.full_name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          enrollment.product_name === "expert"
                            ? "bg-es-gold/10 text-es-gold"
                            : "bg-es-green/10 text-es-green"
                        }`}>
                          {enrollment.product_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(enrollment.purchased_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {(enrollment.amount_paid / 100).toLocaleString("fr-FR")}€
                      </td>
                      <td className="px-6 py-4">
                        <CoachingCreditsCell
                          userId={enrollment.user_id}
                          initialTotal={profile?.coaching_credits_total ?? 0}
                          initialUsed={profile?.coaching_credits_used ?? 0}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/admin/eleves/${enrollment.user_id}`}
                          className="text-sm text-es-green hover:underline"
                        >
                          Voir
                        </a>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    Aucun élève pour le moment. Les inscriptions apparaîtront ici après configuration de Stripe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
