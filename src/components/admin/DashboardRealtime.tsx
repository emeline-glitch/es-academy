"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Mini-composant qui s'abonne aux mutations realtime sur `contacts` et `enrollments`
 * et déclenche un router.refresh() pour que le dashboard (server component) re-fetch
 * ses RPC dashboard_stats à jour. Sans ça, tu dois changer d'onglet pour voir le
 * funnel se mettre à jour après un move pipeline.
 *
 * Debounced à 800ms pour éviter un refresh par tick quand tu fais du bulk.
 */
export function DashboardRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        router.refresh();
      }, 800);
    };

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contacts" }, scheduleRefresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contacts" }, scheduleRefresh)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "contacts" }, scheduleRefresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "enrollments" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
