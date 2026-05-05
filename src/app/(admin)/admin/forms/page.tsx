"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatRelative } from "@/lib/utils/format";

interface FormItem {
  id: string;
  name: string;
  title: string;
  slug: string | null;
  status: "draft" | "published" | "archived";
  submit_count: number;
  created_at: string;
  list: { id: string; name: string; tag_key: string } | null;
}

export default function AdminForms() {
  const toast = useToast();
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newListId, setNewListId] = useState("");
  const [lists, setLists] = useState<Array<{ id: string; name: string; tag_key: string; folder_id: string | null }>>([]);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forms");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForms(data.forms || []);
    } catch {
      toast.error("Impossible de charger les formulaires");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchForms();
    fetch("/api/admin/lists")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setLists(d.lists || []);
          setFolders(d.folders || []);
        }
      })
      .catch(() => {});
  }, [fetchForms]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        title: newName,
        list_id: newListId || null,
      }),
    });
    setCreating(false);
    if (res.ok) {
      const data = await res.json();
      setShowCreate(false);
      setNewName("");
      setNewListId("");
      toast.success("Formulaire créé");
      window.location.href = `/admin/forms/${data.form.id}`;
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error || "Erreur");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce formulaire ?")) return;
    const res = await fetch(`/api/admin/forms/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchForms();
      toast.success("Formulaire supprimé");
    } else {
      toast.error("Suppression impossible");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Formulaires</h1>
          <p className="text-sm text-gray-500 mt-1">
            Des pages publiques pour capturer des leads dans une liste CRM. {forms.length} formulaire{forms.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Annuler" : "+ Nouveau formulaire"}
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">Créer un formulaire</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-1.5 block">Nom (interne)</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex : Inscription newsletter"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">Sert aussi de titre public par défaut (modifiable ensuite).</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 mb-1.5 block">
                Liste de destination {lists.length === 0 && <span className="italic text-gray-400 font-normal">- crée-en une d&apos;abord dans /admin/lists</span>}
              </label>
              <select
                value={newListId}
                onChange={(e) => setNewListId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">- Aucune -</option>
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
              <p className="text-[11px] text-gray-400 mt-1">Les contacts inscrits auront le tag de cette liste.</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? "Création…" : "Créer et éditer"}
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
        </div>
      ) : forms.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-2xl mb-3">📝</p>
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">Aucun formulaire encore</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
            Crée ton premier formulaire pour capturer des inscriptions newsletter ou des leads d&apos;outils gratuits. Chaque soumission ira dans la liste CRM choisie.
          </p>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ Créer mon premier formulaire</Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {forms.map((f) => (
            <Card key={f.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-base font-bold text-gray-900 truncate">{f.name}</h2>
                  <p className="text-xs text-gray-500 truncate">{f.title}</p>
                </div>
                <Badge variant={f.status === "published" ? "success" : f.status === "draft" ? "default" : "warning"}>
                  {f.status === "published" ? "En ligne" : f.status === "draft" ? "Brouillon" : "Archivé"}
                </Badge>
              </div>

              <div className="text-xs text-gray-500 space-y-1 mb-4">
                {f.list ? (
                  <p>📋 Liste : <span className="font-medium text-gray-700">{f.list.name}</span></p>
                ) : (
                  <p className="italic text-gray-400">📋 Aucune liste associée</p>
                )}
                {f.slug && (
                  <p className="font-mono truncate">🔗 /form/{f.slug}</p>
                )}
                <p>👥 {f.submit_count} inscrit{f.submit_count > 1 ? "s" : ""} · créé {formatRelative(f.created_at)}</p>
              </div>

              <div className="mt-auto flex items-center gap-2 flex-wrap">
                <Link
                  href={`/admin/forms/${f.id}`}
                  className="text-sm font-semibold text-es-green hover:underline"
                >
                  Éditer →
                </Link>
                {f.status === "published" && f.slug && (
                  <a
                    href={`/form/${f.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Voir en ligne
                  </a>
                )}
                <button
                  onClick={() => handleDelete(f.id)}
                  className="ml-auto text-xs text-red-500 hover:text-red-700"
                >
                  Suppr.
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
