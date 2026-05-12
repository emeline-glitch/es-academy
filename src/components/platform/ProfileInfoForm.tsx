"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  userId: string;
  email: string;
  initialFullName: string;
  initialCity: string;
  initialBio: string;
}

const BIO_MAX = 280;
const CITY_MAX = 80;

/**
 * Formulaire infos perso de la page /profil.
 *
 * Strategie : full_name est stocke a la fois dans auth.users.user_metadata
 * (utilise par le layout pour displayName) ET dans profiles.full_name (utilise
 * partout ailleurs en DB). On synchronise les deux pour eviter qu'un User
 * voie "Élève" dans le header apres avoir mis a jour son nom.
 */
export function ProfileInfoForm({ userId, email, initialFullName, initialCity, initialBio }: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [city, setCity] = useState(initialCity);
  const [bio, setBio] = useState(initialBio);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const supabase = createClient();
      const [metaRes, profileRes] = await Promise.all([
        supabase.auth.updateUser({ data: { full_name: fullName } }),
        supabase
          .from("profiles")
          .update({ full_name: fullName, city: city.trim() || null, bio: bio.trim() || null })
          .eq("id", userId),
      ]);

      if (metaRes.error || profileRes.error) {
        setMessage({ type: "error", text: "Erreur lors de l'enregistrement. Réessaie." });
        return;
      }
      setMessage({ type: "ok", text: "Profil enregistre." });
    });
  }

  return (
    <Card>
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-1">Informations personnelles</h2>
      <p className="text-sm text-gray-500 mb-5">Tes coordonnées affichées dans la communauté.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Prenom et nom"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ton nom"
        />
        <div>
          <label className="text-sm font-medium text-es-text mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">L&apos;email ne peut pas etre modifie ici. Contacte le support si besoin.</p>
        </div>
        <Input
          label="Ville"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value.slice(0, CITY_MAX))}
          placeholder="Ex. Paris, Lyon, Bordeaux..."
        />
        <div>
          <label className="text-sm font-medium text-es-text mb-1.5 block">Bio courte</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            placeholder="Une ligne sur toi : ton projet immo, ton job, ta ville cible..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-es-green focus:ring-2 focus:ring-es-green/20 transition-colors resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{bio.length} / {BIO_MAX} caracteres</p>
        </div>

        {message && (
          <div
            className={`text-sm rounded-lg p-3 ${
              message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Card>
  );
}
