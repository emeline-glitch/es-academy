"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ProfilPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (error) {
      setMessage("Erreur lors de la mise à jour.");
    } else {
      setMessage("Profil mis à jour !");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles.</p>
      </div>

      <div className="max-w-xl">
        <Card>
          <form onSubmit={handleSave} className="space-y-5">
            <Input
              label="Nom complet"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom"
            />
            <div>
              <label className="text-sm font-medium text-es-text mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">L&apos;email ne peut pas être modifié.</p>
            </div>

            {message && (
              <div className={`text-sm rounded-lg p-3 ${message.includes("Erreur") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
                {message}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </Card>

        {/* Danger zone */}
        <Card className="mt-6 border-red-200">
          <h3 className="font-medium text-gray-900 mb-2">Zone de danger</h3>
          <p className="text-sm text-gray-500 mb-4">
            Pour supprimer votre compte et vos données, contactez-nous à contact@emelinesiron.com
          </p>
        </Card>
      </div>
    </div>
  );
}
