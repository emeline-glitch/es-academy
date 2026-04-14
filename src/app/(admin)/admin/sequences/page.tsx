"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmailEditor } from "@/components/admin/EmailEditor";

interface Step {
  id: string;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  subject: string;
  html_content: string;
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

const TRIGGER_TYPES = [
  { value: "signup", label: "Inscription (formulaire / newsletter)" },
  { value: "purchase", label: "Après un achat" },
  { value: "tag_added", label: "Quand un tag est ajouté" },
  { value: "lead_magnet", label: "Téléchargement lead magnet" },
  { value: "formation_gratuite", label: "Inscription formation gratuite" },
  { value: "manual", label: "Inscription manuelle" },
];

export default function AdminSequences() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("signup");
  const [newTriggerValue, setNewTriggerValue] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepSubject, setEditStepSubject] = useState("");
  const [editStepContent, setEditStepContent] = useState("");
  const [editStepDelayDays, setEditStepDelayDays] = useState(0);
  const [editStepDelayHours, setEditStepDelayHours] = useState(0);
  const [saving, setSaving] = useState(false);

  // Enroll state
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollTag, setEnrollTag] = useState("");
  const [enrollResult, setEnrollResult] = useState("");

  useEffect(() => {
    fetchSequences();
  }, []);

  async function fetchSequences() {
    setLoading(true);
    const res = await fetch("/api/sequences");
    if (res.ok) {
      const data = await res.json();
      setSequences(data);
    }
    setLoading(false);
  }

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
    if (res.ok) {
      setNewName("");
      setNewTriggerValue("");
      setShowCreate(false);
      fetchSequences();
    }
    setCreating(false);
  }

  async function handleToggleStatus(seq: Sequence) {
    const newStatus = seq.status === "active" ? "draft" : "active";
    await fetch(`/api/sequences/${seq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchSequences();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette séquence et toutes ses étapes ?")) return;
    await fetch(`/api/sequences/${id}`, { method: "DELETE" });
    fetchSequences();
  }

  async function handleAddStep(sequenceId: string) {
    await fetch(`/api/sequences/${sequenceId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delay_days: 2,
        delay_hours: 0,
        subject: "Nouvel email",
        html_content: "<p>Contenu de l'email...</p>",
      }),
    });
    fetchSequences();
  }

  function startEditStep(step: Step) {
    setEditingStepId(step.id);
    setEditStepSubject(step.subject);
    setEditStepContent(step.html_content);
    setEditStepDelayDays(step.delay_days);
    setEditStepDelayHours(step.delay_hours);
  }

  async function handleSaveStep(sequenceId: string) {
    if (!editingStepId) return;
    setSaving(true);
    await fetch(`/api/sequences/${sequenceId}/steps/${editingStepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: editStepSubject,
        html_content: editStepContent,
        delay_days: editStepDelayDays,
        delay_hours: editStepDelayHours,
      }),
    });
    setEditingStepId(null);
    setSaving(false);
    fetchSequences();
  }

  async function handleDeleteStep(sequenceId: string, stepId: string) {
    if (!confirm("Supprimer cette étape ?")) return;
    await fetch(`/api/sequences/${sequenceId}/steps/${stepId}`, { method: "DELETE" });
    fetchSequences();
  }

  async function handleEnroll(sequenceId: string) {
    if (!enrollTag) return;
    setEnrollResult("");
    const res = await fetch(`/api/sequences/${sequenceId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: enrollTag }),
    });
    if (res.ok) {
      const data = await res.json();
      setEnrollResult(`${data.enrolled} contacts inscrits (${data.skipped} déjà inscrits)`);
      fetchSequences();
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Séquences automatiques</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crée des tunnels d'emails automatiques — comme sur Brevo, mais chez toi
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Annuler" : "Nouvelle séquence"}
        </Button>
      </div>

      {/* Create new */}
      {showCreate && (
        <Card className="mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Créer une séquence</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <Input
              label="Nom de la séquence"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: [MAGNET] Planneur immobilier"
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
                placeholder="Ex: ebook_planneur"
              />
            )}
          </div>
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? "Création..." : "Créer la séquence"}
          </Button>
        </Card>
      )}

      {/* Sequences list */}
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
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-serif text-lg font-bold text-gray-900">{seq.name}</h2>
                    <Badge variant={seq.status === "active" ? "success" : seq.status === "draft" ? "default" : "warning"}>
                      {seq.status === "active" ? "Active" : seq.status === "draft" ? "Brouillon" : "En pause"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Déclencheur : {TRIGGER_TYPES.find((t) => t.value === seq.trigger_type)?.label || seq.trigger_type}
                    {seq.trigger_value && <span className="ml-1 text-es-green font-medium">({seq.trigger_value})</span>}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>{seq.steps.length} étape(s)</span>
                    <span>{seq.enrolled_count || 0} inscrits au total</span>
                    <span>{seq.active_count || 0} en cours</span>
                  </div>
                </div>
                <div className="flex gap-2">
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
                          /* Step editor */
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
                            <Input
                              label="Objet de l'email"
                              value={editStepSubject}
                              onChange={(e) => setEditStepSubject(e.target.value)}
                            />
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">Contenu</label>
                              <EmailEditor value={editStepContent} onChange={setEditStepContent} />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="primary" size="sm" onClick={() => handleSaveStep(seq.id)} disabled={saving}>
                                {saving ? "..." : "Sauvegarder"}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingStepId(null)}>
                                Annuler
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteStep(seq.id, step.id)}>
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Step display */
                          <div
                            className={`pb-2 ${editingId === seq.id ? "cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2" : ""}`}
                            onClick={() => editingId === seq.id && startEditStep(step)}
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

              {/* Actions */}
              {editingId === seq.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleAddStep(seq.id)}>
                    + Ajouter une étape
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEnrollingId(enrollingId === seq.id ? null : seq.id)}
                  >
                    Inscrire des contacts
                  </Button>
                </div>
              )}

              {/* Enroll modal */}
              {enrollingId === seq.id && (
                <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Inscrire des contacts dans cette séquence</h4>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Tag des contacts à inscrire</label>
                      <select
                        value={enrollTag}
                        onChange={(e) => setEnrollTag(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-gray-200 bg-white text-sm"
                      >
                        <option value="">Choisir un tag...</option>
                        <option value="client">client</option>
                        <option value="prospect">prospect</option>
                        <option value="newsletter">newsletter</option>
                        <option value="ebook">ebook</option>
                        <option value="lead_magnet">lead_magnet</option>
                        <option value="formation_gratuite">formation_gratuite</option>
                        <option value="import">import</option>
                      </select>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => handleEnroll(seq.id)} disabled={!enrollTag}>
                      Inscrire
                    </Button>
                  </div>
                  {enrollResult && <p className="text-sm text-es-green mt-2">{enrollResult}</p>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
