"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/utils/pipeline";
import { useToast } from "@/components/ui/Toast";

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  tags: string[];
  source: string;
  status: string;
  pipeline_stage: PipelineStage;
  pipeline_updated_at: string | null;
  subscribed_at: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface LinkedProfile {
  id: string;
  full_name: string | null;
  role: string;
  coaching_credits_total: number;
  coaching_credits_used: number;
}

interface Enrollment {
  id: string;
  product_name: string;
  amount_paid: number;
  purchased_at: string;
  status: string;
}

interface Note {
  id: string;
  content: string;
  kind: "note" | "rdv" | "appel" | "email";
  created_at: string;
  author_id: string;
}

const KIND_LABELS: Record<Note["kind"], { label: string; color: string; icon: string }> = {
  note: { label: "Note", color: "bg-gray-100 text-gray-700", icon: "📝" },
  rdv: { label: "RDV", color: "bg-es-green/10 text-es-green", icon: "📅" },
  appel: { label: "Appel", color: "bg-blue-100 text-blue-700", icon: "📞" },
  email: { label: "Email", color: "bg-purple-100 text-purple-700", icon: "✉️" },
};

// Tags qui indiquent un lead magnet téléchargé
const LEAD_MAGNET_TAGS = [
  "ebook",
  "lead_magnet",
  "outils_gratuits",
  "formation_gratuite",
  "checklist",
  "simulateur_capture",
];

export default function ContactDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [profile, setProfile] = useState<LinkedProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteKind, setNoteKind] = useState<Note["kind"]>("rdv");
  const [postingNote, setPostingNote] = useState(false);
  const [editName, setEditName] = useState({ first: "", last: "", phone: "" });
  const [editingName, setEditingName] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState("");
  const [promoteData, setPromoteData] = useState({ product_name: "academy", amount_paid: 998, coaching_credits: 0, send_invite: true });
  const [editingCredits, setEditingCredits] = useState(false);
  const [creditEdits, setCreditEdits] = useState({ total: 0, used: 0 });
  const toast = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setContact(data.contact);
      setProfile(data.profile || null);
      setEnrollments(data.enrollments || []);
      setNotes(data.notes || []);
      setEditName({
        first: data.contact?.first_name || "",
        last: data.contact?.last_name || "",
        phone: data.contact?.phone || "",
      });
      if (data.profile) {
        setCreditEdits({
          total: data.profile.coaching_credits_total ?? 0,
          used: data.profile.coaching_credits_used ?? 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchAll();
  }, [id, fetchAll]);

  async function updateStage(stage: PipelineStage) {
    if (!contact) return;
    const prevStage = contact.pipeline_stage;
    setSaving(true);
    setContact({ ...contact, pipeline_stage: stage, pipeline_updated_at: new Date().toISOString() });
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline_stage: stage }),
    });
    setSaving(false);
    if (!res.ok) {
      setContact((c) => (c ? { ...c, pipeline_stage: prevStage } : c));
      toast.error("Impossible de changer l'étape");
    } else {
      toast.success(`Étape : ${PIPELINE_STAGES.find((s) => s.key === stage)?.label}`);
    }
  }

  async function saveName() {
    setSaving(true);
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: editName.first,
        last_name: editName.last,
        phone: editName.phone || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Impossible d'enregistrer");
      return;
    }
    setContact((c) =>
      c
        ? {
            ...c,
            first_name: editName.first,
            last_name: editName.last,
            phone: editName.phone || null,
          }
        : c
    );
    setEditingName(false);
    toast.success("Fiche mise à jour");
  }

  async function saveCredits() {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/admin/coaching-credits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: profile.id,
        credits_total: creditEdits.total,
        credits_used: creditEdits.used,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Impossible de mettre à jour les crédits");
      return;
    }
    setProfile({ ...profile, coaching_credits_total: creditEdits.total, coaching_credits_used: creditEdits.used });
    setEditingCredits(false);
    toast.success("Crédits coaching mis à jour");
  }

  async function promoteToStudent() {
    setPromoting(true);
    setPromoteError("");
    const res = await fetch(`/api/contacts/${id}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promoteData),
    });
    setPromoting(false);
    if (res.ok) {
      setShowPromote(false);
      fetchAll();
      toast.success("Contact basculé en élève — invitation envoyée par email");
    } else {
      const body = await res.json().catch(() => ({}));
      setPromoteError(body.error || "Erreur serveur");
    }
  }

  async function postNote() {
    if (!noteContent.trim()) return;
    setPostingNote(true);
    const res = await fetch(`/api/contacts/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteContent, kind: noteKind }),
    });
    setPostingNote(false);
    if (res.ok) {
      const data = await res.json();
      setNotes([data.note, ...notes]);
      setNoteContent("");
      toast.success("Note enregistrée");
    } else {
      toast.error("Impossible d'enregistrer la note");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div>
        <Link href="/admin/pipeline" className="text-sm text-gray-400 hover:text-es-green">← Retour au pipeline</Link>
        <p className="mt-8 text-gray-500">Contact introuvable.</p>
      </div>
    );
  }

  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email;
  const leadMagnetTags = (contact.tags || []).filter((t) =>
    LEAD_MAGNET_TAGS.some((lm) => t.toLowerCase().includes(lm))
  );
  const otherTags = (contact.tags || []).filter((t) => !leadMagnetTags.includes(t));

  return (
    <div>
      {/* Modal basculer en élève */}
      {showPromote && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">Basculer {name} en élève</h3>
            <p className="text-sm text-gray-500 mb-4">
              Crée le compte Supabase (invitation envoyée par email), ajoute l&apos;achat et les crédits de coaching.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Produit</label>
                <select
                  value={promoteData.product_name}
                  onChange={(e) => setPromoteData({ ...promoteData, product_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="academy">Academy (998€)</option>
                  <option value="coaching">Coaching seul</option>
                  <option value="family">ES Family</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Montant payé (€)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={promoteData.amount_paid}
                  onChange={(e) => setPromoteData({ ...promoteData, amount_paid: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nombre de coachings inclus</label>
                <input
                  type="number"
                  min={0}
                  value={promoteData.coaching_credits}
                  onChange={(e) => setPromoteData({ ...promoteData, coaching_credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={promoteData.send_invite}
                  onChange={(e) => setPromoteData({ ...promoteData, send_invite: e.target.checked })}
                  className="mt-0.5 rounded accent-es-green"
                />
                <span className="flex-1">
                  Envoyer l&apos;email d&apos;invitation
                  <span className="block text-[11px] text-gray-400 mt-0.5">
                    Décoche pour créer le compte silencieusement (tests, ou si tu as hit la limite d&apos;envoi Supabase).
                  </span>
                </span>
              </label>
              {promoteError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-medium">{promoteError}</p>
                  {/email rate limit/i.test(promoteError) && (
                    <p className="text-xs mt-1 text-red-500">
                      💡 Décoche « Envoyer l&apos;email d&apos;invitation » ci-dessus pour contourner (création silencieuse). Tu pourras relancer l&apos;invitation plus tard depuis la fiche élève.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={() => setShowPromote(false)}
                className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={promoteToStudent}
                disabled={promoting}
                className="text-sm px-5 py-2 bg-es-green text-white rounded-lg hover:bg-es-green-light disabled:opacity-50 font-semibold"
              >
                {promoting ? "Création…" : "Confirmer la bascule"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <Link href="/admin/pipeline" className="text-xs text-gray-400 hover:text-es-green">← Pipeline</Link>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mt-1">{name}</h1>
          <p className="text-sm text-gray-500">{contact.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale : notes + ajout */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ajouter une note */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">Ajouter une note</h2>
            <div className="flex gap-2 mb-3 flex-wrap">
              {(Object.keys(KIND_LABELS) as Note["kind"][]).map((k) => {
                const active = noteKind === k;
                return (
                  <button
                    key={k}
                    onClick={() => setNoteKind(k)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                      active ? "bg-es-green text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {KIND_LABELS[k].icon} {KIND_LABELS[k].label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Compte-rendu, point abordé, next step…"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={postNote}
                disabled={postingNote || !noteContent.trim()}
                className="bg-es-green text-white font-semibold text-sm px-5 py-2 rounded-lg hover:bg-es-green-light disabled:opacity-50"
              >
                {postingNote ? "Enregistrement…" : "Enregistrer la note"}
              </button>
            </div>
          </div>

          {/* Historique des notes */}
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              Historique ({notes.length})
            </h2>
            {notes.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center text-sm text-gray-400">
                Aucune note pour l&apos;instant.
              </div>
            ) : (
              notes.map((n) => {
                const k = KIND_LABELS[n.kind];
                return (
                  <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${k.color}`}>
                        <span>{k.icon}</span>
                        <span>{k.label}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne latérale : infos + stage + tags */}
        <div className="space-y-6">
          {/* Statut élève / Promote */}
          {profile ? (
            <div className="bg-white rounded-xl border-2 border-es-green/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-es-green uppercase tracking-wider">🎓 Élève actif</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Compte créé · <Link href={`/admin/eleves/${profile.id}`} className="text-es-green hover:underline">voir fiche élève →</Link>
              </p>
              {enrollments.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {enrollments.map((e) => (
                    <div key={e.id} className="text-xs bg-es-green/5 rounded px-2 py-1.5 flex items-center justify-between">
                      <span className="font-medium text-es-green">{e.product_name}</span>
                      <span className="text-gray-500">{(e.amount_paid / 100).toLocaleString("fr-FR")}€</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coaching credits éditable */}
              <div className="pt-3 border-t border-es-green/20">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Coaching</p>
                {editingCredits ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <label className="text-gray-500 w-20">Total</label>
                      <input
                        type="number"
                        min={0}
                        value={creditEdits.total}
                        onChange={(e) => setCreditEdits({ ...creditEdits, total: Math.max(0, Number(e.target.value)) })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <label className="text-gray-500 w-20">Utilisés</label>
                      <input
                        type="number"
                        min={0}
                        value={creditEdits.used}
                        onChange={(e) => setCreditEdits({ ...creditEdits, used: Math.max(0, Number(e.target.value)) })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveCredits}
                        disabled={saving}
                        className="text-xs px-3 py-1 bg-es-green text-white rounded hover:bg-es-green-light disabled:opacity-50"
                      >
                        Sauver
                      </button>
                      <button
                        onClick={() => {
                          setCreditEdits({ total: profile.coaching_credits_total, used: profile.coaching_credits_used });
                          setEditingCredits(false);
                        }}
                        className="text-xs px-3 py-1 text-gray-500"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingCredits(true)}
                    className="flex items-center gap-2 text-sm hover:bg-gray-50 rounded px-2 py-1 -mx-2 w-full text-left"
                  >
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-full text-xs font-semibold bg-es-green/10 text-es-green">
                      {Math.max(profile.coaching_credits_total - profile.coaching_credits_used, 0)}
                    </span>
                    <span className="text-xs text-gray-500">
                      restants / {profile.coaching_credits_total} total
                    </span>
                    <span className="ml-auto text-[10px] text-gray-400">modifier</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Statut élève</h2>
              <p className="text-sm text-gray-500 mb-3">Pas encore élève.</p>
              <button
                onClick={() => { setShowPromote(true); setPromoteError(""); }}
                className="w-full bg-es-green text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-es-green-light transition-colors"
              >
                🎓 Basculer en élève
              </button>
              <p className="text-[11px] text-gray-400 mt-2">Création du compte + envoi d&apos;une invitation.</p>
            </div>
          )}

          {/* Pipeline stage */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Étape du pipeline</h2>
            <select
              value={contact.pipeline_stage}
              onChange={(e) => updateStage(e.target.value as PipelineStage)}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            {contact.pipeline_updated_at && (
              <p className="text-[11px] text-gray-400 mt-2">
                Mise à jour le{" "}
                {new Date(contact.pipeline_updated_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Identité */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Identité</h2>
              {!editingName && (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-es-green hover:underline"
                >
                  Modifier
                </button>
              )}
            </div>
            {editingName ? (
              <div className="space-y-2">
                <input
                  value={editName.first}
                  onChange={(e) => setEditName({ ...editName, first: e.target.value })}
                  placeholder="Prénom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  value={editName.last}
                  onChange={(e) => setEditName({ ...editName, last: e.target.value })}
                  placeholder="Nom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="tel"
                  value={editName.phone}
                  onChange={(e) => setEditName({ ...editName, phone: e.target.value })}
                  placeholder="Téléphone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingName(false)}
                    className="text-xs px-3 py-1.5 text-gray-500"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveName}
                    disabled={saving}
                    className="text-xs px-3 py-1.5 bg-es-green text-white rounded hover:bg-es-green-light disabled:opacity-50"
                  >
                    Sauver
                  </button>
                </div>
              </div>
            ) : (
              <dl className="text-sm space-y-2">
                <div>
                  <dt className="text-xs text-gray-400">Prénom</dt>
                  <dd className="text-gray-900">{contact.first_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Nom</dt>
                  <dd className="text-gray-900">{contact.last_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Email</dt>
                  <dd className="text-gray-900">
                    <a href={`mailto:${contact.email}`} className="hover:text-es-green">
                      {contact.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Téléphone</dt>
                  <dd className="text-gray-900">
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="hover:text-es-green">{contact.phone}</a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Source</dt>
                  <dd className="text-gray-900">{contact.source || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Inscrit le</dt>
                  <dd className="text-gray-900">
                    {new Date(contact.subscribed_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* Lead magnets téléchargés */}
          {leadMagnetTags.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-es-terracotta/30 p-5">
              <h2 className="text-xs font-bold text-es-terracotta uppercase tracking-wider mb-3">
                Lead magnets téléchargés
              </h2>
              <div className="flex flex-wrap gap-2">
                {leadMagnetTags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-es-terracotta/10 text-es-terracotta-dark px-2.5 py-1 rounded-full font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Autres tags */}
          {otherTags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {otherTags.map((t) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
