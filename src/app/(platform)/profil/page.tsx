import { getCachedUser, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/platform/Breadcrumb";
import { AvatarUpload } from "@/components/platform/AvatarUpload";
import { ProfileInfoForm } from "@/components/platform/ProfileInfoForm";
import { NotificationPrefsForm } from "@/components/platform/NotificationPrefsForm";
import { SecuritySection } from "@/components/platform/SecuritySection";
import { PaymentsList } from "@/components/platform/PaymentsList";
import { RgpdActions } from "@/components/platform/RgpdActions";
import { getLearnerProfile, getPaymentSummaries, DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/platform/profile";

export default async function ProfilPage() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  const supabase = await createServiceClient();
  const [profile, payments] = await Promise.all([
    getLearnerProfile(supabase, user.id),
    getPaymentSummaries(supabase, user.id),
  ]);

  const email = user.email || "";
  // Fallback : si la row profiles n'existe pas (cas extreme : trigger pas
  // execute), on degrade gracieusement avec des defaults pour ne pas casser
  // toute la page.
  const fullName = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || "";
  const city = profile?.city || "";
  const bio = profile?.bio || "";
  const prefs = profile?.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mon profil" }]} />

      <header>
        <h1 className="font-serif text-3xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">Tes informations, tes préférences, tes paiements et tes droits RGPD.</p>
      </header>

      <AvatarUpload
        userId={user.id}
        initialAvatarUrl={profile?.avatar_url || null}
        initialName={fullName || email}
      />

      <ProfileInfoForm
        userId={user.id}
        email={email}
        initialFullName={fullName}
        initialCity={city}
        initialBio={bio}
      />

      <NotificationPrefsForm userId={user.id} initial={prefs} />

      <SecuritySection email={email} />

      <PaymentsList payments={payments} />

      <RgpdActions />
    </div>
  );
}
