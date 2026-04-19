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

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null);

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

  async function moveContact(contactId: string, newStage: PipelineStage) {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, pipeline_stage: newStage, pipeline_updated_at: new Date().toISOString() } : c))
    );

    const res = await fetch(`/api/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline_stage: newStage }),
    });

    if (!res.ok) {
      // Rollback on error
      fetchContacts();
    }
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

  function onDragOver(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(stage);
  }

  function onDrop(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("text/plain") || draggingId;
    if (contactId) {
      const current = contacts.find((c) => c.id === contactId);
      if (current && current.pipeline_stage !== stage) {
        moveContact(contactId, stage);
      }
    }
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
            {contacts.length} contact{contacts.length > 1 ? "s" : ""} · Glisse-dépose pour changer d&apos;étape
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
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, c.id)}
                          onDragEnd={onDragEnd}
                          className={`group bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all cursor-move ${
                            isDragging ? "opacity-40" : ""
                          }`}
                        >
                          <Link
                            href={`/admin/contacts/${c.id}`}
                            onClick={(e) => {
                              // Empêche la navigation pendant le drag
                              if (draggingId) e.preventDefault();
                            }}
                            className="block"
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
    </div>
  );
}
