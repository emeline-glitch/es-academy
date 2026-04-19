"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/utils/pipeline";

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tags: string[];
  source: string;
  pipeline_stage: PipelineStage;
  pipeline_updated_at: string | null;
  subscribed_at: string;
}

interface UndoState {
  contactId: string;
  previousStage: PipelineStage;
  contactName: string;
  newStage: PipelineStage;
  timer: ReturnType<typeof setTimeout>;
}

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<UndoState | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "500" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/contacts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts || []);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Cleanup undo timer at unmount
  useEffect(() => () => {
    if (undo) clearTimeout(undo.timer);
  }, [undo]);

  async function patchStage(contactId: string, stage: PipelineStage) {
    const res = await fetch(`/api/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline_stage: stage }),
    });
    return res.ok;
  }

  async function moveContact(contactId: string, newStage: PipelineStage, showUndo = true) {
    const current = contacts.find((c) => c.id === contactId);
    if (!current) return;
    const prevStage = current.pipeline_stage || "leads";
    if (prevStage === newStage) return;

    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, pipeline_stage: newStage, pipeline_updated_at: new Date().toISOString() } : c))
    );

    const ok = await patchStage(contactId, newStage);
    if (!ok) {
      fetchContacts();
      return;
    }

    if (showUndo) {
      if (undo) clearTimeout(undo.timer);
      const name = [current.first_name, current.last_name].filter(Boolean).join(" ") || current.email;
      const timer = setTimeout(() => setUndo(null), 5000);
      setUndo({ contactId, previousStage: prevStage, contactName: name, newStage, timer });
    }
  }

  async function doUndo() {
    if (!undo) return;
    clearTimeout(undo.timer);
    const { contactId, previousStage } = undo;
    setUndo(null);
    await moveContact(contactId, previousStage, false);
  }

  // Bulk move
  async function bulkMove(targetStage: PipelineStage) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    // Optimistic
    setContacts((prev) =>
      prev.map((c) => (selected.has(c.id) ? { ...c, pipeline_stage: targetStage, pipeline_updated_at: new Date().toISOString() } : c))
    );
    await Promise.all(ids.map((id) => patchStage(id, targetStage)));
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Drag-drop handlers (desktop)
  function onDragStart(e: React.DragEvent, contactId: string) {
    setDraggingId(contactId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", contactId);
  }
  function onDragEnd() {
    setDraggingId(null);
    setDragOver(null);
  }
  function onDragOver(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(stage);
  }
  function onDrop(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("text/plain") || draggingId;
    if (contactId) moveContact(contactId, stage);
    setDragOver(null);
    setDraggingId(null);
  }

  function byStage(stage: PipelineStage) {
    return contacts.filter((c) => (c.pipeline_stage || "leads") === stage);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Pipeline commercial</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contacts.length} contact{contacts.length > 1 ? "s" : ""}
            <span className="hidden sm:inline"> · Glisse-dépose pour changer d&apos;étape</span>
            <span className="sm:hidden"> · Utilise le menu sur chaque carte</span>
          </p>
        </div>
        <input
          type="search"
          placeholder="Rechercher un contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-3 mb-4 p-3 bg-es-green text-white rounded-lg shadow-md flex-wrap">
          <span className="text-sm font-semibold">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <span className="text-xs text-white/70">Déplacer vers :</span>
          <select
            onChange={(e) => { if (e.target.value) bulkMove(e.target.value as PipelineStage); }}
            className="text-sm text-gray-900 bg-white rounded px-2 py-1"
            defaultValue=""
          >
            <option value="">— Choisir une étape —</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-white/80 hover:text-white"
          >
            Désélectionner
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_STAGES.map((stage) => {
              const items = byStage(stage.key);
              const isDragOver = dragOver === stage.key;
              return (
                <div
                  key={stage.key}
                  onDragOver={(e) => onDragOver(e, stage.key)}
                  onDragLeave={() => setDragOver((current) => (current === stage.key ? null : current))}
                  onDrop={(e) => onDrop(e, stage.key)}
                  className={`w-72 shrink-0 rounded-xl border-2 ${stage.color} p-3 transition-all ${
                    isDragOver ? "border-es-green ring-2 ring-es-green/30 scale-[1.01]" : ""
                  }`}
                >
                  <div className={`flex items-center justify-between mb-3 px-1 ${stage.textColor}`}>
                    <h2 className="text-xs font-bold uppercase tracking-wider">{stage.label}</h2>
                    <span className="text-xs font-semibold bg-white/70 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>

                  <div className="space-y-2 min-h-[50px]">
                    {items.map((c) => {
                      const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
                      const isDragging = draggingId === c.id;
                      const isSelected = selected.has(c.id);
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, c.id)}
                          onDragEnd={onDragEnd}
                          className={`group bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-all ${
                            isDragging ? "opacity-40" : ""
                          } ${isSelected ? "border-es-green ring-2 ring-es-green/30" : "border-gray-200"}`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(c.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 rounded border-gray-300 accent-es-green cursor-pointer"
                            />
                            <Link
                              href={`/admin/contacts/${c.id}`}
                              onClick={(e) => { if (draggingId) e.preventDefault(); }}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                              {name !== c.email && (
                                <p className="text-xs text-gray-500 truncate">{c.email}</p>
                              )}
                              {c.tags && c.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {c.tags.slice(0, 3).map((t) => (
                                    <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                      {t}
                                    </span>
                                  ))}
                                  {c.tags.length > 3 && (
                                    <span className="text-[10px] text-gray-400">+{c.tags.length - 3}</span>
                                  )}
                                </div>
                              )}
                              <p className="text-[10px] text-gray-400 mt-2">
                                {new Date(c.pipeline_updated_at || c.subscribed_at).toLocaleDateString("fr-FR")}
                              </p>
                            </Link>
                          </div>
                          {/* Fallback mobile/tactile : select d'étape */}
                          <select
                            value={c.pipeline_stage || "leads"}
                            onChange={(e) => moveContact(c.id, e.target.value as PipelineStage)}
                            className="mt-2 w-full text-[11px] px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-600 md:hidden"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <p className="text-xs text-gray-400 italic text-center py-4">—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Undo toast */}
      {undo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-4 animate-[fadeInUp_0.3s_ease-out]">
          <span className="text-sm">
            <strong>{undo.contactName}</strong> → {PIPELINE_STAGES.find((s) => s.key === undo.newStage)?.label}
          </span>
          <button
            onClick={doUndo}
            className="text-sm font-semibold text-es-gold hover:text-white underline-offset-2 hover:underline"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
