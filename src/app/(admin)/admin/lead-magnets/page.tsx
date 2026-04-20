"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatRelative } from "@/lib/utils/format";

interface Sequence {
  id: string;
  name: string;
  status: string;
}

interface LeadMagnet {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  format: "masterclass" | "quiz" | "simulator" | "pdf" | "email_series" | "game";
  is_active: boolean;
  available_from: string | null;
  available_until: string | null;
  welcome_sequence_id: string | null;
  welcome_sequence: Sequence | null;
  landing_page_url: string | null;
  asset_url: string | null;
  opt_in_tag: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  stats_30d: { opt_ins: number; conversions_to_academy: number; conversion_rate: number };
}

const FORMAT_LABELS: Record<LeadMagnet["format"], { label: string; icon: string; color: string }> = {
  masterclass: { label: "Masterclass vidéo", icon: "🎬", color: "bg-purple-100 text-purple-700" },
  quiz: { label: "Quiz interactif", icon: "❓", color: "bg-blue-100 text-blue-700" },
  simulator: { label: "Simulateur", icon: "🧮", color: "bg-amber-100 text-amber-700" },
  pdf: { label: "PDF téléchargeable", icon: "📄", color: "bg-gray-100 text-gray-700" },
  email_series: { label: "Série email", icon: "✉️", color: "bg-es-green/10 text-es-green" },
  game: { label: "Jeu / défi", icon: "🎯", color: "bg-red-100 text-red-700" },
};

export default function LeadMagnetsPage() {
  const toast = useToast();
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLm, setNewLm] = useState<{ name: string; format: LeadMagnet["format"]; description: string }>({
    name: "",
    format: "pdf",
    description: "",
  });
  const [editing, setEditing] = useState<LeadMagnet | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lmRes, seqRes] = await Promise.all([
        fetch("/api/admin/lead-magnets"),
        fetch("/api/sequences"),
      ]);
      if (lmRes.ok) {
        const data = await lmRes.json();
        setLeadMagnets(data.lead_magnets || []);
      }
      if (seqRes.ok) {
        const data = await seqRes.json();
        setSequences(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Impossible de charger les lead magnets");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function createLm() {
    if (!newLm.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/lead-magnets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLm),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Erreur");
      }
      const data = await res.json();
      toast.success(`Lead magnet « ${data.lead_magnet.name} » créé`);
      setNewLm({ name: "", format: "pdf", description: "" });
      setShowCreate(false);
      fetchAll();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(lm: LeadMagnet) {
    const res = await fetch(`/api/admin/lead-magnets/${lm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !lm.is_active }),
    });
    if (!res.ok) {
      toast.error("Impossible de modifier");
      return;
    }
    toast.success(lm.is_active ? "Désactivé" : "Activé");
    fetchAll();
  }

  async function deleteLm(lm: LeadMagnet) {
    if (!confirm(`Supprimer le lead magnet « ${lm.name} » ? Cette action est irréversible.`)) return;
    const res = await fetch(`/api/admin/lead-magnets/${lm.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Impossible de supprimer");
      return;
    }
    toast.success("Supprimé");
    fetchAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Lead Magnets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tes 6 portes d&apos;entrée vers ES Academy. Chaque lead magnet a une séquence welcome associée.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + Nouveau lead magnet
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
        </div>
      ) : leadMagnets.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <p className="text-4xl mb-2">📥</p>
            <p className="text-sm text-gray-600 mb-4">
              Aucun lead magnet configuré. Crée le premier pour démarrer ta capture de leads.
            </p>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              Créer mon premier lead magnet
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leadMagnets.map((lm) => {
            const fmt = FORMAT_LABELS[lm.format];
            return (
              <Card key={lm.id}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${fmt.color}`}>
                    {fmt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-serif text-lg font-bold text-gray-900">{lm.name}</h2>
                      <Badge variant={lm.is_active ? "success" : "default"}>
                        {lm.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      <code className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                        {lm.slug}
                      </code>
                    </div>
                    {lm.description && (
                      <p className="text-sm text-gray-500 mb-2">{lm.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                      <span className={`px-2 py-0.5 rounded ${fmt.color}`}>{fmt.label}</span>
                      <span>Tag : <code className="font-mono text-gray-700">{lm.opt_in_tag}</code></span>
                      {lm.welcome_sequence ? (
                        <span>
                          Séquence :{" "}
                          <Link
                            href={`/admin/sequences?open=${lm.welcome_sequence.id}`}
                            className="text-es-green hover:underline font-medium"
                          >
                            {lm.welcome_sequence.name}
                          </Link>
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">Pas de séquence welcome associée</span>
                      )}
                    </div>
                    {/* Stats 30j */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Opt-ins 30j</p>
                        <p className="text-lg font-bold text-gray-900">{lm.stats_30d.opt_ins}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Conversions Academy</p>
                        <p className="text-lg font-bold text-es-green">{lm.stats_30d.conversions_to_academy}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Taux conv.</p>
                        <p className="text-lg font-bold text-amber-600">{lm.stats_30d.conversion_rate}%</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Modifié {formatRelative(lm.updated_at)}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(lm)}>
                      Modifier
                    </Button>
                    <button
                      onClick={() => toggleActive(lm)}
                      className="text-xs text-gray-500 hover:text-es-green px-3 py-1"
                    >
                      {lm.is_active ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      onClick={() => deleteLm(lm)}
                      className="text-xs text-gray-400 hover:text-red-600 px-3 py-1"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de création */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">Nouveau lead magnet</h3>
            <p className="text-xs text-gray-500 mb-4">
              Tu pourras tout configurer après (visuel, séquence, URL, etc.).
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nom *</label>
                <Input
                  placeholder="Ex : Masterclass fondatrice"
                  value={newLm.name}
                  onChange={(e) => setNewLm({ ...newLm, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Format *</label>
                <select
                  value={newLm.format}
                  onChange={(e) => setNewLm({ ...newLm, format: e.target.value as LeadMagnet["format"] })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description (optionnel)</label>
                <textarea
                  placeholder="À quoi sert ce lead magnet ?"
                  value={newLm.description}
                  onChange={(e) => setNewLm({ ...newLm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={createLm} disabled={!newLm.name.trim() || creating}>
                {creating ? "Création…" : "Créer"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal d'édition */}
      {editing && (
        <EditLeadMagnetModal
          leadMagnet={editing}
          sequences={sequences}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
function EditLeadMagnetModal({
  leadMagnet,
  sequences,
  onClose,
  onSaved,
}: {
  leadMagnet: LeadMagnet;
  sequences: Sequence[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(leadMagnet.name);
  const [description, setDescription] = useState(leadMagnet.description || "");
  const [format, setFormat] = useState<LeadMagnet["format"]>(leadMagnet.format);
  const [landingUrl, setLandingUrl] = useState(leadMagnet.landing_page_url || "");
  const [assetUrl, setAssetUrl] = useState(leadMagnet.asset_url || "");
  const [welcomeSeqId, setWelcomeSeqId] = useState(leadMagnet.welcome_sequence_id || "");
  const [availableFrom, setAvailableFrom] = useState(leadMagnet.available_from || "");
  const [availableUntil, setAvailableUntil] = useState(leadMagnet.available_until || "");
  const [optInTag, setOptInTag] = useState(leadMagnet.opt_in_tag);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lead-magnets/${leadMagnet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          format,
          landing_page_url: landingUrl,
          asset_url: assetUrl,
          welcome_sequence_id: welcomeSeqId,
          available_from: availableFrom,
          available_until: availableUntil,
          opt_in_tag: optInTag,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Erreur");
      }
      toast.success("Lead magnet enregistré");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900">Modifier le lead magnet</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Slug : <code className="font-mono">{leadMagnet.slug}</code>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as LeadMagnet["format"])}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Séquence welcome associée
            </label>
            <select
              value={welcomeSeqId}
              onChange={(e) => setWelcomeSeqId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Aucune</option>
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Les contacts taggués <code className="font-mono">{optInTag}</code> seront automatiquement enrôlés dans cette séquence.
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tag d&apos;opt-in</label>
            <Input value={optInTag} onChange={(e) => setOptInTag(e.target.value)} />
            <p className="text-[11px] text-gray-400 mt-1">
              Tag ajouté automatiquement au contact quand il s&apos;inscrit via ce lead magnet.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">URL de la landing page</label>
              <Input
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="/masterclass ou https://…"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">URL de l&apos;asset (PDF, vidéo…)</label>
              <Input
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                placeholder="https://… (Bunny, Drive, etc.)"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Disponible à partir de (optionnel)</label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Disponible jusqu&apos;à (optionnel)</label>
              <input
                type="date"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Utile pour les lead magnets saisonniers (cahier de vacances, calendrier de l&apos;Avent, chasse aux œufs).
          </p>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50">
          <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
