import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function AdminEleves() {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      profiles:user_id (full_name)
    `)
    .order("purchased_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Eleves</h1>
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
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments && enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(enrollment.profiles as { full_name: string })?.full_name || "—"}
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
                      <a
                        href={`/admin/eleves/${enrollment.user_id}`}
                        className="text-sm text-es-green hover:underline"
                      >
                        Voir
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                    Aucun eleve pour le moment. Les inscriptions apparaitront ici apres configuration de Stripe.
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
