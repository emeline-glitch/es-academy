"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import type { NotificationPreferences } from "@/lib/platform/profile";

interface Props {
  userId: string;
  initial: NotificationPreferences;
}

const OPTIONS: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: "email_weekly_digest",
    label: "Digest hebdomadaire",
    description: "Un mail le dimanche soir avec les recos de la semaine et ta progression.",
  },
  {
    key: "email_lives",
    label: "Lives et coachings de groupe",
    description: "Notifié 24h avant chaque live + replay disponible.",
  },
  {
    key: "email_new_content",
    label: "Nouveaux contenus",
    description: "Un mail quand une nouvelle leçon ou ressource est ajoutee.",
  },
];

export function NotificationPrefsForm({ userId, initial }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initial);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(key: keyof NotificationPreferences) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setMessage(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: next })
        .eq("id", userId);
      if (error) {
        setPrefs(prefs);
        setMessage({ type: "error", text: "Impossible d'enregistrer. Réessaie." });
      } else {
        setMessage({ type: "ok", text: "Préférences enregistrées." });
      }
    });
  }

  return (
    <Card>
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-1">Notifications email</h2>
      <p className="text-sm text-gray-500 mb-5">Choisis ce que tu veux recevoir dans ta boite.</p>

      <ul className="space-y-3">
        {OPTIONS.map((opt) => {
          const enabled = prefs[opt.key];
          return (
            <li
              key={opt.key}
              className="flex items-start justify-between gap-4 p-3 rounded-lg border border-gray-100"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${opt.label} : ${enabled ? "active" : "desactive"}`}
                onClick={() => toggle(opt.key)}
                disabled={pending}
                className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-es-green/30 cursor-pointer ${
                  enabled ? "bg-es-green" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      {message && (
        <div
          className={`mt-4 text-sm rounded-lg p-3 ${
            message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </Card>
  );
}
