"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmailEditor } from "@/components/admin/EmailEditor";
import { AudienceTargeter } from "@/components/admin/AudienceTargeter";
import { MergeTagsToolbar } from "@/components/admin/MergeTagsToolbar";
import { useToast } from "@/components/ui/Toast";
import { formatRelative } from "@/lib/utils/format";

interface Step {
  id: string;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  subject: string;
  html_content?: string; // Lazy-loaded : absent dans la liste, fetché au clic "Modifier" pour la perf
  status: string;
}

interface Sequence {
  id: string;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  status: string;
  created_at: string;
  steps: Step[];
  enrolled_count?: number;
  active_count?: number;
}

// IMPORTANT : ces valeurs doivent matcher VALID_TRIGGERS côté API sequences (/api/sequences/route.ts)
// et le CHECK constraint email_sequences_trigger_type_check en DB (migration 014).
const TRIGGER_TYPES = [
  { value: "form_submit", label: "Inscription via formulaire" },
  { value: "tag_added", label: "Quand un tag est ajouté au contact" },
  { value: "product_purchase", label: "Après un achat" },
  { value: "manual", label: "Inscription manuelle" },
];

export default function AdminSequences() {
  const toast = useToast();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("form_submit");
  const [newTriggerValue, setNewTriggerValue] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepSubject, setEditStepSubject] = useState("");
  const [editStepContent, setEditStepContent] = useState("");
  const [editStepDelayDays, setEditStepDelayDays] = useState(0);
  const [editStepDelayHours, setEditStepDelayHours] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentEditSeqIdRef = useRef<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testingStepId, setTestingStepId] = useState<string | null>(null);

  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollTags, setEnrollTags] = useState<string[]>([]);

  const fetchSequences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sequences");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSequences(data);
    } catch {
      toast.error("Impossible de charger les séquences");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        trigger_type: newTrigger,
        trigger_value: newTriggerValue || null,
      }),
    });
    setCreating(false);
    if (res.ok) {
      setNewName("");
      setNewTriggerValue("");
      setShowCreate(false);
      fetchSequences();
      toast.success(`Séquence "${newName}" créée`);
    } else {
      toast.error("Impossible de créer la séquence");
    }
  }

  async function handleToggleStatus(seq: Sequence) {
    const newStatus = seq.status === "active" ? "draft" : "active";
    const res = await fetch(`/api/sequences/${seq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchSequences();
      toast.success(newStatus === "active" ? "Séquence activée" : "Séquence mise en pause");
    } else {
      toast.error("Impossible de changer le statut");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette séquence et toutes ses étapes ?")) return;
    const res = await fetch(`/api/sequences/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchSequences();
      toast.success("Séquence supprimée");
    } else {
      toast.error("Suppression impossible");
    }
  }

  async function handleDuplicate(seq: Sequence) {
    const res = await fetch(`/api/sequences/${seq.id}/duplicate`, { method: "POST" });
    if (res.ok) {
      fetchSequences();
      toast.success(`"${seq.name}" dupliquée (${seq.steps.length} étapes copiées)`);
    } else {
      toast.error("Duplication impossible");
    }
  }

  async function handleAddStep(sequenceId: string) {
    await fetch(`/api/sequences/${sequenceId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delay_days: 2,
        delay_hours: 0,
        subject: "Nouvel email",
        html_content: "<p>Bonjour {{prenom}},</p><p>Contenu de l&apos;email…</p>",
      }),
    });
    fetchSequences();
    toast.success("Étape ajoutée");
  }

  async function startEditStep(step: Step) {
    setEditingStepId(step.id);
    // Affiche immédiatement sujet + délais (déjà chargés dans la liste)
    setEditStepSubject(step.subject);
    setEditStepDelayDays(step.delay_days);
    setEditStepDelayHours(step.delay_hours);
    setLastSavedAt(null);
    setIsDirty(false);
    // Le html_content n'est pas dans le payload de la liste (perf : évite de charger 64 mails × 1-2 Ko).
    // On le fetch à la demande au clic. Placeholder "…" pendant le fetch.
    if (step.html_content) {
      // Déjà chargé (fallback pour anciennes versions / futurs contextes)
      setEditStepContent(step.html_content);
    } else {
      setEditStepContent("");
      // On a besoin du sequenceId — on le récupère depuis le step via la séquence parente
      const seq = sequences.find((s) => s.steps.some((st) => st.id === step.id));
      if (!seq) return;
      try {
        const res = await fetch(`/api/sequences/${seq.id}/steps/${step.id}`);
        if (res.ok) {
          const data = await res.json();
          setEditStepContent(data.html_content || "");
        }
      } catch {
        // silencieux, l'utilisatrice peut refresh
      }
    }
  }

  // Auto-save : persiste les changements en arrière-plan toutes les 30s si dirty.
  // Tiffany peut rédiger sans stress, la sauvegarde se fait toute seule.
  const autoSaveStep = useCallback(async (sequenceId: string, stepId: string) => {
    const res = await fetch(`/api/sequences/${sequenceId}/steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: editStepSubject,
        html_content: editStepContent,
        delay_days: editStepDelayDays,
        delay_hours: editStepDelayHours,
      }),
    });
    if (res.ok) {
      setLastSavedAt(Date.now());
      setIsDirty(false);
    }
  }, [editStepSubject, editStepContent, editStepDelayDays, editStepDelayHours]);

  // Quand un des champs change pendant l'édition → marque dirty + schedule auto-save
  useEffect(() => {
    if (!editingStepId) return;
    setIsDirty(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const seqId = currentEditSeqIdRef.current;
    if (!seqId) return;
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveStep(seqId, editingStepId);
    }, 30_000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editStepSubject, editStepContent, editStepDelayDays, editStepDelayHours, editingStepId, autoSaveStep]);

  async function handleSaveStep(sequenceId: string) {
    if (!editingStepId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaving(true);
    const res = await fetch(`/api/sequences/${sequenceId}/steps/${editingStepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: editStepSubject,
        html_content: editStepContent,
        delay_days: editStepDelayDays,
        delay_hours: editStepDelayHours,
      }),
    });
    setSaving(false);
    setEditingStepId(null);
    setIsDirty(false);
    setLastSavedAt(null);
    if (res.ok) {
      fetchSequences();
      toast.success("Étape mise à jour");
    } else {
      toast.error("Impossible d'enregistrer l'étape");
    }
  }

  async function handleDeleteStep(sequenceId: string, stepId: string) {
    if (!confirm("Supprimer cette étape ?")) return;
    const res = await fetch(`/api/sequences/${sequenceId}/steps/${stepId}`, { method: "DELETE" });
    if (res.ok) {
      fetchSequences();
      toast.success("Étape supprimée");
    } else {
      toast.error("Suppression impossible");
    }
  }

  async function handleTestStep(step: Step) {
    if (!testEmail) {
      toast.error("Saisis une adresse email de test");
      return;
    }
    setTestingStepId(step.id);
    // Si appelé depuis le bouton test inline (en mode édition), on a déjà le contenu
    // dans editStepContent. Sinon on fetch on-demand.
    let htmlContent = step.html_content;
    if (!htmlContent) {
      const seq = sequences.find((s) => s.steps.some((st) => st.id === step.id));
      if (seq) {
        const r = await fetch(`/api/sequences/${seq.id}/steps/${step.id}`);
        if (r.ok) htmlContent = (await r.json()).html_content;
      }
    }
    const res = await fetch("/api/emails/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: testEmail,
        subject: step.subject,
        html_content: htmlContent || "",
      }),
    });
    setTestingStepId(null);
    if (res.ok) toast.success(`Test envoyé à ${testEmail}`);
    else toast.error("Échec de l'envoi test");
  }

  async function handleEnroll(sequenceId: string) {
    const tag = enrollTags[0];
    if (!tag) {
      toast.error("Choisis une liste");
      return;
    }
    const res = await fetch(`/api/sequences/${sequenceId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.enrolled} inscrits · ${data.skipped} déjà dans la séquence`);
      fetchSequences();
    } else {
      toast.error("Inscription impossible");
    }
  }

  function insertIntoStepContent(tag: string) {
    setEditStepContent((c) => c + tag);
  }

  function insertIntoStepSubject(tag: string) {
    setEditStepSubject((s) => s + tag);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Séquences automatiques</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crée des tunnels d&apos;emails automatiques — comme sur Brevo, mais chez toi.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Annuler" : "+ Nouvelle séquence"}
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Créer une séquence</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <Input
              label="Nom de la séquence"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex : Onboarding Academy"
            />
            <div>
              <label className="text-sm font-medium text-gray-900 mb-1.5 block">Déclencheur</label>
              <select
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {(newTrigger === "tag_added" || newTrigger === "lead_magnet") && (
              <Input
                label="Tag / valeur du déclencheur"
                value={newTriggerValue}
                onChange={(e) => setNewTriggerValue(e.target.value)}
                placeholder="Ex : ebook_planneur"
              />
            )}
          </div>
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? "Création…" : "Créer la séquence"}
          </Button>
        </Card>
      )}

      {sequences.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-400 text-center py-8">
            Aucune séquence. Crée ta première séquence automatique !
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sequences.map((seq) => (
            <Card key={seq.id}>
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="font-serif text-lg font-bold text-gray-900">{seq.name}</h2>
                    <Badge variant={seq.status === "active" ? "success" : seq.status === "draft" ? "default" : "warning"}>
                      {seq.status === "active" ? "Active" : seq.status === "draft" ? "Brouillon" : "En pause"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Déclencheur : {TRIGGER_TYPES.find((t) => t.value === seq.trigger_type)?.label || seq.trigger_type}
                    {seq.trigger_value && <span className="ml-1 text-es-green font-medium">({seq.trigger_value})</span>}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                    <span>{seq.steps.length} étape{seq.steps.length > 1 ? "s" : ""}</span>
                    <span>{seq.enrolled_count || 0} inscrits au total</span>
                    <span className="text-es-green font-medium">{seq.active_count || 0} en cours</span>
                    <span>créée {formatRelative(seq.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={seq.status === "active" ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleToggleStatus(seq)}
                  >
                    {seq.status === "active" ? "Pause" : "Activer"}
                  </Button>
                  <button
                    onClick={() => setEditingId(editingId === seq.id ? null : seq.id)}
                    className="text-sm text-es-green hover:underline cursor-pointer px-2"
                  >
                    {editingId === seq.id ? "Fermer" : "Modifier"}
                  </button>
                  <button
                    onClick={() => handleDuplicate(seq)}
                    className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer px-2"
                  >
                    Dupliquer
                  </button>
                  <button
                    onClick={() => handleDelete(seq.id)}
                    className="text-sm text-red-400 hover:text-red-600 cursor-pointer px-2"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative ml-4">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-4">
                  {seq.steps.map((step, j) => (
                    <div key={step.id} className="relative flex gap-4 pl-2">
                      <div className="w-7 h-7 rounded-full bg-es-green flex items-center justify-center shrink-0 z-10 border-2 border-white">
                        <span className="text-[9px] font-bold text-white">{j + 1}</span>
                      </div>
                      <div className="flex-1">
                        {editingStepId === step.id ? (
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Délai (jours)</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={editStepDelayDays}
                                  onChange={(e) => setEditStepDelayDays(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Délai (heures)</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={23}
                                  value={editStepDelayHours}
                                  onChange={(e) => setEditStepDelayHours(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-medium text-gray-900">Objet de l&apos;email</label>
                                <MergeTagsToolbar onInsert={insertIntoStepSubject} />
                              </div>
                              <input
                                value={editStepSubject}
                                onChange={(e) => setEditStepSubject(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium text-gray-600">Contenu</label>
                                <MergeTagsToolbar onInsert={insertIntoStepContent} />
                              </div>
                              <EmailEditor value={editStepContent} onChange={setEditStepContent} />
                            </div>

                            {/* Test send inline */}
                            <div className="pt-3 border-t border-gray-200 flex items-center gap-2 flex-wrap">
                              <input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="ton@email.com pour tester"
                                className="flex-1 min-w-[200px] px-3 py-2 rounded border border-gray-200 text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleTestStep({
                                    ...step,
                                    subject: editStepSubject,
                                    html_content: editStepContent,
                                  })
                                }
                                disabled={testingStepId === step.id || !testEmail}
                              >
                                {testingStepId === step.id ? "Envoi…" : "Test"}
                              </Button>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-200 items-center">
                              <Button variant="primary" size="sm" onClick={() => handleSaveStep(seq.id)} disabled={saving}>
                                {saving ? "…" : "Sauvegarder"}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingStepId(null)}>
                                Annuler
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteStep(seq.id, step.id)}>
                                Supprimer
                              </Button>
                              {/* Indicateur auto-save : Tiffany voit que ses modifs sont protégées */}
                              <span className="text-[11px] text-gray-400 italic ml-auto">
                                {isDirty
                                  ? "Modifié (sauvegarde auto dans 30s)"
                                  : lastSavedAt
                                    ? `Sauvegardé auto ${Math.round((Date.now() - lastSavedAt) / 1000)}s`
                                    : "Sauvegarde auto activée"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`pb-2 ${editingId === seq.id ? "cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2" : ""}`}
                            onClick={() => {
                              if (editingId === seq.id) {
                                currentEditSeqIdRef.current = seq.id;
                                startEditStep(step);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium text-amber-600">
                                {step.delay_days === 0 && step.delay_hours === 0
                                  ? "Immédiat"
                                  : step.delay_hours > 0
                                  ? `J+${step.delay_days} ${step.delay_hours}h`
                                  : `J+${step.delay_days}`}
                              </span>
                              {editingId === seq.id && (
                                <span className="text-[10px] text-gray-300">cliquer pour modifier</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 font-medium">{step.subject}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editingId === seq.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleAddStep(seq.id)}>
                    + Ajouter une étape
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEnrollingId(enrollingId === seq.id ? null : seq.id);
                      setEnrollTags([]);
                    }}
                  >
                    Inscrire des contacts
                  </Button>
                </div>
              )}

              {enrollingId === seq.id && (
                <div className="mt-3 p-4 bg-blue-50 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Inscrire tous les contacts d&apos;une liste</h4>
                  <AudienceTargeter
                    value={enrollTags}
                    onChange={setEnrollTags}
                    label=""
                    singleSelect
                    helpText="Sélectionne une seule liste — les contacts y appartenant seront inscrits"
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={() => handleEnroll(seq.id)} disabled={enrollTags.length === 0}>
                      Inscrire
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEnrollingId(null)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
