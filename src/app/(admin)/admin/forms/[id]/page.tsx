"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface FormConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  slug: string;
  status: "draft" | "published" | "archived";
  list_id: string | null;
  success_message: string;
  redirect_url: string | null;
  background_image_url: string | null;
  require_phone: boolean;
  require_last_name: boolean;
  submit_count: number;
  list: { id: string; name: string; tag_key: string } | null;
}

interface ContactList {
  id: string;
  name: string;
  tag_key: string;
  folder_id: string | null;
}

export default function FormEditor() {
  const toast = useToast();
  const params = useParams();
  const id = params?.id as string;
  const [form, setForm] = useState<FormConfig | null>(null);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchForm = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/forms/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(data.form);
    } catch {
      toast.error("Impossible de charger le formulaire");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) fetchForm();
    fetch("/api/admin/lists")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setLists(d.lists || []);
          setFolders(d.folders || []);
        }
      })
      .catch(() => {});
  }, [id, fetchForm]);

  function patch(changes: Partial<FormConfig>) {
    if (!form) return;
    const next = { ...form, ...changes };
    setForm(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(next), 600);
  }

  async function save(next: FormConfig) {
    setSaving(true);
    const res = await fetch(`/api/admin/forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: next.name,
        title: next.title,
        description: next.description,
        slug: next.slug,
        list_id: next.list_id,
        success_message: next.success_message,
        redirect_url: next.redirect_url,
        background_image_url: next.background_image_url,
        require_phone: next.require_phone,
        require_last_name: next.require_last_name,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error || "Sauvegarde impossible");
    }
  }

  async function togglePublish() {
    if (!form) return;
    const newStatus = form.status === "published" ? "draft" : "published";
    const res = await fetch(`/api/admin/forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setForm(data.form);
      toast.success(newStatus === "published" ? "Formulaire publié 🚀" : "Formulaire dépublié");
    } else {
      toast.error("Impossible de changer le statut");
    }
  }

  if (loading || !form) {
    return (
      <div>
        <Link href="/admin/forms" className="text-sm text-gray-400 hover:text-es-green">← Retour aux formulaires</Link>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
        </div>
      </div>
    );
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/form/${form.slug}` : `/form/${form.slug}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="min-w-0">
          <Link href="/admin/forms" className="text-sm text-gray-400 hover:text-es-green">← Formulaires</Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-serif text-2xl font-bold text-gray-900 truncate">{form.name}</h1>
            <Badge variant={form.status === "published" ? "success" : form.status === "draft" ? "default" : "warning"}>
              {form.status === "published" ? "En ligne" : form.status === "draft" ? "Brouillon" : "Archivé"}
            </Badge>
            {saving && <span className="text-xs text-gray-400 italic">sauvegarde…</span>}
          </div>
          {form.status === "published" && (
            <p className="text-xs text-gray-500 mt-1">
              URL publique : <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-es-green hover:underline font-mono">{publicUrl}</a>
              <button
                onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Lien copié"); }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                📋
              </button>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {form.status === "published" && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
            >
              Voir en ligne
            </a>
          )}
          <Button variant={form.status === "published" ? "secondary" : "primary"} size="sm" onClick={togglePublish}>
            {form.status === "published" ? "Dépublier" : "Publier 🚀"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_440px] gap-6">
        {/* Édition */}
        <div className="space-y-5">
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Contenu public</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Titre affiché</label>
                <input
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Ex : Retrouve toutes les actualités immobilières ❤️"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Image de fond (URL)</label>
                <input
                  value={form.background_image_url || ""}
                  onChange={(e) => patch({ background_image_url: e.target.value })}
                  placeholder="https://…/image.jpg — laisser vide pour fond crème"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Champs demandés</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-600">✓</span> Prénom (obligatoire)
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-600">✓</span> Email (obligatoire)
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-600">✓</span> Consentement RGPD (obligatoire)
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.require_last_name}
                  onChange={(e) => patch({ require_last_name: e.target.checked })}
                  className="rounded accent-es-green"
                />
                <span>Demander le nom</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.require_phone}
                  onChange={(e) => patch({ require_phone: e.target.checked })}
                  className="rounded accent-es-green"
                />
                <span>Demander le téléphone</span>
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Liste de destination</h2>
            <select
              value={form.list_id || ""}
              onChange={(e) => patch({ list_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">— Aucune liste (tag form_signup par défaut) —</option>
              {folders.map((f) => {
                const fl = lists.filter((l) => l.folder_id === f.id);
                if (fl.length === 0) return null;
                return (
                  <optgroup key={f.id} label={f.name}>
                    {fl.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </optgroup>
                );
              })}
              {lists.filter((l) => !l.folder_id).length > 0 && (
                <optgroup label="Autres">
                  {lists.filter((l) => !l.folder_id).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </optgroup>
              )}
            </select>
            <p className="text-[11px] text-gray-400 mt-2">
              Les contacts inscrits recevront automatiquement le tag de cette liste. Tu peux créer/gérer les listes dans{" "}
              <Link href="/admin/lists" className="text-es-green hover:underline">/admin/lists</Link>.
            </p>
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Après inscription</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Message de succès</label>
                <textarea
                  value={form.success_message}
                  onChange={(e) => patch({ success_message: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Redirection (optionnel)</label>
                <input
                  value={form.redirect_url || ""}
                  onChange={(e) => patch({ redirect_url: e.target.value })}
                  placeholder="https://… (si vide, affiche le message de succès)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Avancé</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Slug (URL)</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono shrink-0">/form/</span>
                  <input
                    value={form.slug}
                    onChange={(e) => patch({ slug: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Nom interne</label>
                <input
                  value={form.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">Ne s&apos;affiche pas publiquement.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="sticky top-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Aperçu</p>
            <FormPreview form={form} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormPreview({ form }: { form: FormConfig }) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      style={{
        backgroundImage: form.background_image_url ? `url(${form.background_image_url})` : undefined,
        backgroundColor: !form.background_image_url ? "#F5F0E8" : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="p-6 bg-white/95 backdrop-blur-sm m-4 rounded-2xl">
        <h3 className="font-serif text-xl font-bold text-gray-900 text-center mb-1">{form.title}</h3>
        {form.description && <p className="text-xs text-gray-600 text-center mb-4">{form.description}</p>}

        <div className="space-y-2">
          <input placeholder="Prénom *" disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50" />
          {form.require_last_name && (
            <input placeholder="Nom" disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50" />
          )}
          <input placeholder="Email *" disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50" />
          {form.require_phone && (
            <input placeholder="Téléphone" disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50" />
          )}

          <label className="flex items-start gap-2 text-[11px] text-gray-600 pt-1">
            <input type="checkbox" disabled className="mt-0.5" />
            <span>J&apos;accepte de recevoir les emails et j&apos;ai pris connaissance de la politique de confidentialité. *</span>
          </label>

          <button
            type="button"
            disabled
            className="w-full mt-2 bg-es-green text-white py-2.5 rounded-lg text-sm font-semibold"
          >
            S&apos;inscrire
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-3 italic">Vous pouvez vous désinscrire à tout moment.</p>
      </div>
    </div>
  );
}
