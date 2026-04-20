"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Abonnement realtime avec DEBOUNCE LONG.
 *
 * Avant : refetch (router.refresh()) 800ms après chaque mutation sur contacts/enrollments.
 * Sur une page avec 200 contacts et 5 admins qui bougent des fiches, c'était 50+ refreshes
 * par minute → dashboard toujours en train de recharger, UX horrible.
 *
 * Maintenant : 5 secondes de debounce. Les mutations cumulées déclenchent 1 seul refresh
 * quand l'activité se calme. Pour un vrai "temps réel" immédiat, l'utilisatrice peut toujours
 * cliquer sur le logo dashboard.
 */
export function DashboardRealtime() {
  const router = useRouter();
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const scheduleRefresh = () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        router.refresh();
      }, 5000);
    };

    // On écoute seulement les UPDATE sur contacts (changement stage) et INSERT sur enrollments (nouvelle vente).
    // Retiré : INSERT/DELETE contacts (bruit) + on ne refresh plus sur DELETE.
    const channel = supabase
      .channel("dashboard-realtime-v2")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contacts" }, scheduleRefresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "enrollments" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
