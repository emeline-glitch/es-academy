"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";

interface Props {
  userId: string;
  initialAvatarUrl: string | null;
  initialName: string;
}

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload avatar dans Supabase Storage bucket "avatars".
 *
 * Le bucket doit etre public (read public) avec une policy upload pour
 * authenticated users uniquement, scopee sur leur user_id en prefixe.
 * Le path est `${userId}/${timestamp}.${ext}` pour eviter les collisions.
 * On garde l'ancien avatar plutot que de le supprimer (versionning gratuit).
 */
export function AvatarUpload({ userId, initialAvatarUrl, initialName }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = initialName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Format non supporte. Utilise JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image trop lourde (max 2 Mo).");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      setError("Échec upload. Le bucket avatars n'est peut-etre pas encore configure.");
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      setError("Avatar uploade mais profil non mis a jour. Réessaie.");
    } else {
      setAvatarUrl(publicUrl);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card>
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-es-green/10 flex items-center justify-center overflow-hidden shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={initialName} width={80} height={80} className="w-full h-full object-cover" />
          ) : (
            <span className="font-serif text-2xl font-bold text-es-green">{initials || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">Photo de profil</p>
          <p className="text-xs text-gray-500 mt-0.5">JPG, PNG ou WebP. 2 Mo max.</p>
          <label className="inline-block mt-3 cursor-pointer">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChange}
              className="hidden"
              disabled={uploading}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-es-green hover:text-es-green transition-colors">
              {uploading ? "Envoi en cours..." : avatarUrl ? "Changer la photo" : "Ajouter une photo"}
            </span>
          </label>
          {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
        </div>
      </div>
    </Card>
  );
}
