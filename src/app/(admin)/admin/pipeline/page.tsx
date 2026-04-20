"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { PIPELINES, type PipelineType } from "@/lib/utils/pipeline";
import { useToast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useDebounce";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/utils/format";

// Contact avec TOUS les stages des 3 pipelines (le pipeline actif filtre l'affichage)
interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  tags: string[];
  source: string;
  pipeline_stage: string | null;
  pipeline_updated_at: string | null;
  pipeline_family_stage: string | null;
  pipeline_family_updated_at: string | null;
  pipeline_custom_stage: string | null;
  pipeline_custom_updated_at: string | null;
  subscribed_at: string;
}

interface UndoState {
  contactId: string;
  previousStage: string | null;
  contactName: string;
  newStage: string;
  pipelineType: PipelineType;
  timer: ReturnType<typeof setTimeout>;
}

export default function PipelinePage() {
  const [pipelineType, setPipelineType] = useState<PipelineType>("academy");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<UndoState | null>(null);
  const toast = useToast();
  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;

  const pipelineConfig = PIPELINES[pipelineType];
  const stageColumn = pipelineConfig.columnDb as "pipeline_stage" | "pipeline_family_stage" | "pipeline_custom_stage";
  const updatedAtColumn = pipelineConfig.columnUpdatedAt as "pipeline_updated_at" | "pipeline_family_updated_at" | "pipeline_custom_updated_at";

  // Helper pour lire le stage d'un contact selon le pipeline courant
  function getStage(c: Contact): string | null {
    return c[stageColumn] ?? null;
  }

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "500" });
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Cleanup undo timer at unmount
  useEffect(() => () => {
    if (undo) clearTimeout(undo.timer);
  }, [undo]);

  // Realtime : écoute les changements de pipeline_stage depuis d'autres sessions
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("pipeline-contacts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contacts" },
        (payload) => {
          const updated = payload.new as Contact;
          setContacts((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contacts" },
        (payload) => {
          const inserted = payload.new as Contact;
          setContacts((prev) => [inserted, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // patchStage utilise le pipeline courant pour savoir quelle colonne updater
  async function patchStage(contactId: string, stage: string): Promise<boolean> {
    try {
      const body: Record<string, string> = {};
      body[stageColumn] = stage;
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function moveContact(contactId: string, newStage: string, showUndo = true) {
    const current = contactsRef.current.find((c) => c.id === contactId);
    if (!current) return;
    const prevStage = getStage(current);
    if (prevStage === newStage) return;

    // Optimistic update sur la bonne colonne
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, [stageColumn]: newStage, [updatedAtColumn]: new Date().toISOString() }
          : c
      )
    );

    const ok = await patchStage(contactId, newStage);
    if (!ok) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, [stageColumn]: prevStage } : c))
      );
      toast.error("Impossible de déplacer le contact");
      return;
    }

    if (showUndo) {
      if (undo) clearTimeout(undo.timer);
      const name = [current.first_name, current.last_name].filter(Boolean).join(" ") || current.email;
      const timer = setTimeout(() => setUndo(null), 5000);
      setUndo({ contactId, previousStage: prevStage, contactName: name, newStage, pipelineType, timer });
    }
  }

  async function doUndo() {
    if (!undo) return;
    clearTimeout(undo.timer);
    const { contactId, previousStage } = undo;
    setUndo(null);
    if (previousStage !== null) await moveContact(contactId, previousStage, false);
    toast.success("Action annulée");
  }

  async function bulkMove(targetStage: string) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setContacts((prev) =>
      prev.map((c) =>
        selected.has(c.id)
          ? { ...c, [stageColumn]: targetStage, [updatedAtColumn]: new Date().toISOString() }
          : c
      )
    );
    const results = await Promise.all(ids.map((id) => patchStage(id, targetStage)));
    const fails = results.filter((r) => !r).length;
    setSelected(new Set());
    if (fails > 0) {
      toast.error(`${fails} échec${fails > 1 ? "s" : ""} sur ${ids.length} déplacements`);
      fetchContacts();
    } else {
      toast.success(`${ids.length} contact${ids.length > 1 ? "s" : ""} déplacé${ids.length > 1 ? "s" : ""}`);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportStageCSV(stage: string) {
    const items = contacts.filter((c) => getStage(c) === stage);
    if (items.length === 0) {
      toast.info("Aucun contact dans cette étape");
      return;
    }
    const stageLabel = pipelineConfig.stages.find((s) => s.key === stage)?.label || stage;
    const rows = ["prenom,nom,email,telephone,tags,date_entree"];
    for (const c of items) {
      rows.push(
        `"${c.first_name}","${c.last_name}","${c.email}","${c.phone || ""}","${(c.tags || []).join(";")}","${
          c[updatedAtColumn] || c.subscribed_at
        }"`
      );
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pipeline_${pipelineType}_${stage}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Export "${stageLabel}" : ${items.length} contact${items.length > 1 ? "s" : ""}`);
  }

  function onDragStart(e: React.DragEvent, contactId: string) {
    setDraggingId(contactId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", contactId);
  }
  function onDragEnd() {
    setDraggingId(null);
    setDragOver(null);
  }
  function onDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(stage);
  }
  function onDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("text/plain") || draggingId;
    if (contactId) moveContact(contactId, stage);
    setDragOver(null);
    setDraggingId(null);
  }

  function byStage(stage: string) {
    return contacts
      .filter((c) => getStage(c) === stage)
      .sort((a, b) => {
        const da = new Date(a[updatedAtColumn] || a.subscribed_at).getTime();
        const db = new Date(b[updatedAtColumn] || b.subscribed_at).getTime();
        return db - da;
      });
  }

  // Un contact est "en retard" s'il est dans un stage d'action et n'a pas bougé depuis 7 jours
  function isOverdue(c: Contact): boolean {
    const overdueByType: Record<PipelineType, string[]> = {
      academy: ["rdv_pris", "offre_envoyee"],
      family: ["trial_actif"],
      custom: ["devis_envoye", "accepte"],
    };
    const stage = getStage(c);
    if (!stage || !overdueByType[pipelineType].includes(stage)) return false;
    const last = new Date(c[updatedAtColumn] || c.subscribed_at).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - last > sevenDays;
  }

  // Compteur de contacts dans chaque pipeline (pour les badges des tabs)
  const countsByPipeline = {
    academy: contacts.filter((c) => c.pipeline_stage).length,
    family: contacts.filter((c) => c.pipeline_family_stage).length,
    custom: contacts.filter((c) => c.pipeline_custom_stage).length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Pipeline commercial</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pipelineConfig.description}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="search"
            placeholder="Rechercher…"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className="flex-1 sm:flex-none sm:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <Link
            href="/admin/contacts?add=1"
            prefetch
            className="bg-es-green text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-es-green-light shrink-0"
          >
            + Contact
          </Link>
        </div>
      </div>

      {/* Tabs pour switcher entre les 3 pipelines */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
        {(Object.keys(PIPELINES) as PipelineType[]).map((t) => {
          const cfg = PIPELINES[t];
          const count = countsByPipeline[t];
          const active = pipelineType === t;
          return (
            <button
              key={t}
              onClick={() => { setPipelineType(t); setSelected(new Set()); }}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? "border-es-green text-es-green"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="mr-1.5">{cfg.icon}</span>
              {cfg.label}
              {count > 0 && (
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-es-green/10 text-es-green" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-3 mb-4 p-3 bg-es-green text-white rounded-lg shadow-md flex-wrap">
          <span className="text-sm font-semibold">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <span className="text-xs text-white/70">Déplacer vers :</span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                bulkMove(e.target.value);
                e.target.value = "";
              }
            }}
            className="text-sm text-gray-900 bg-white rounded px-2 py-1"
            defaultValue=""
          >
            <option value="">— Choisir une étape —</option>
            {pipelineConfig.stages.map((s) => (
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

      {loading && contacts.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {pipelineConfig.stages.map((stage) => {
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
                    <div className="flex items-center gap-1">
                      {items.length > 0 && (
                        <button
                          onClick={() => exportStageCSV(stage.key)}
                          title="Exporter en CSV"
                          className="text-[10px] text-gray-500 hover:text-gray-900 px-1.5 py-0.5 rounded hover:bg-white/50"
                        >
                          ⬇︎
                        </button>
                      )}
                      <span className="text-xs font-semibold bg-white/70 px-2 py-0.5 rounded-full">{items.length}</span>
                    </div>
                  </div>

                  <div className="space-y-2 min-h-[50px]">
                    {items.map((c) => (
                      <PipelineCard
                        key={c.id}
                        contact={c}
                        overdue={isOverdue(c)}
                        selected={selected.has(c.id)}
                        dragging={draggingId === c.id}
                        currentStage={getStage(c)}
                        updatedAt={c[updatedAtColumn]}
                        pipelineStages={pipelineConfig.stages}
                        onToggleSelect={() => toggleSelect(c.id)}
                        onDragStart={(e) => onDragStart(e, c.id)}
                        onDragEnd={onDragEnd}
                        onChangeStage={(s) => moveContact(c.id, s)}
                      />
                    ))}
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

      {/* Undo toast (inline, séparé du ToastProvider pour l'action dédiée) */}
      {undo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[101] bg-gray-900 text-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-4">
          <span className="text-sm">
            <strong>{undo.contactName}</strong> → {PIPELINES[undo.pipelineType].stages.find((s) => s.key === undo.newStage)?.label || undo.newStage}
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

function PipelineCard({
  contact: c,
  overdue,
  selected,
  dragging,
  currentStage,
  pipelineStages,
  updatedAt,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onChangeStage,
}: {
  contact: Contact;
  overdue: boolean;
  selected: boolean;
  dragging: boolean;
  currentStage: string | null;
  pipelineStages: { key: string; label: string }[];
  updatedAt: string | null;
  onToggleSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onChangeStage: (s: string) => void;
}) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
  const daysSince = Math.floor(
    (Date.now() - new Date(updatedAt || c.subscribed_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-all cursor-move relative ${
        dragging ? "opacity-40" : ""
      } ${
        selected
          ? "border-es-green ring-2 ring-es-green/30"
          : overdue
          ? "border-red-300 ring-1 ring-red-200"
          : "border-gray-200"
      }`}
    >
      {overdue && (
        <span
          className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow"
          title={`Sans activité depuis ${daysSince} jours`}
        >
          ⏰ {daysSince}j
        </span>
      )}
      <div className="flex items-start gap-2">
        {/* Checkbox indépendant du Link (bug fix click-through) */}
        <label className="shrink-0 mt-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="rounded border-gray-300 accent-es-green cursor-pointer"
          />
        </label>
        <Link
          href={`/admin/contacts/${c.id}`}
          prefetch
          className="flex-1 min-w-0"
          onDragStart={(e) => e.preventDefault()}
        >
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          {name !== c.email && (
            <p className="text-xs text-gray-500 truncate">{c.email}</p>
          )}
          {c.phone && (
            <a
              href={`tel:${c.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-es-green hover:underline truncate block mt-0.5"
            >
              📞 {c.phone}
            </a>
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
            {formatRelative(updatedAt || c.subscribed_at)}
          </p>
        </Link>
      </div>
      {/* Fallback mobile/tactile */}
      <select
        value={currentStage || pipelineStages[0]?.key || ""}
        onChange={(e) => onChangeStage(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 w-full text-[11px] px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-600 md:hidden"
      >
        {pipelineStages.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
