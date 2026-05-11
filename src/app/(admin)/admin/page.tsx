import { redirect } from "next/navigation";

// /admin (sans slug) -> redirect vers le dashboard. Evite le 404 pour les
// users qui tapent l'URL racine du back-office. Le gating admin
// (email == ADMIN_EMAIL OU role == 'admin') est applique par
// (admin)/layout.tsx en amont, donc on ne le double pas ici.
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
