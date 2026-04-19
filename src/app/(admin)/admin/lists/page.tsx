"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ContactList {
  id: string;
  name: string;
  tag_key: string;
  folder_id: string | null;
  description: string | null;
  color: string;
  contact_count: number;
  sort_order: number;
}

interface Folder {
  id: string;
  name: string;
  sort_order: number;
}

export default function ListsPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newListData, setNewListData] = useState<{ folderId: string | null; name: string; description: string }>({
    folderId: null,
    name: "",
    description: "",
  });
  const [showNewListFor, setShowNewListFor] = useState<string | null | "unfiled">(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/lists");
    if (res.ok) {
      const data = await res.json();
      setFolders(data.folders || []);
      setLists(data.lists || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function createFolder() {
    if (!newFolderName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "folder", name: newFolderName }),
    });
    if (res.ok) {
      setNewFolderName("");
      setShowNewFolder(false);
      fetchAll();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Erreur");
    }
    setSaving(false);
  }

  async function createList() {
    if (!newListData.name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "list",
        name: newListData.name,
        description: newListData.description || null,
        folder_id: newListData.folderId,
      }),
    });
    if (res.ok) {
      setNewListData({ folderId: null, name: "", description: "" });
      setShowNewListFor(null);
      fetchAll();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Erreur");
    }
    setSaving(false);
  }

  async function deleteItem(kind: "folder" | "list", id: string) {
    if (!confirm(`Supprimer ${kind === "folder" ? "ce dossier" : "cette liste"} ?`)) return;
    const res = await fetch(`/api/admin/lists?kind=${kind}&id=${id}`, { method: "DELETE" });
    if (res.ok) fetchAll();
  }

  async function renameItem(kind: "folder" | "list", id: string, name: string) {
    const res = await fetch(`/api/admin/lists`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, name }),
    });
    if (res.ok) fetchAll();
  }

  const totalContacts = lists.reduce((sum, l) => sum + l.contact_count, 0);
  const unfiledLists = lists.filter((l) => !l.folder_id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Listes de contacts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lists.length} liste{lists.length > 1 ? "s" : ""} · {folders.length} dossier{folders.length > 1 ? "s" : ""} · {totalContacts} total contacts
          </p>
        </div>
        <button
          onClick={() => setShowNewFolder(true)}
          className="bg-es-green text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-es-green-light"
        >
          + Nouveau dossier
        </button>
      </div>

      {/* Création dossier */}
      {showNewFolder && (
        <div className="bg-white rounded-xl border-2 border-es-green/30 p-4 mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">Nouveau dossier</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex : Lead magnets, Prospection, Clients…"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              autoFocus
            />
            <button onClick={createFolder} disabled={saving} className="bg-es-green text-white text-sm px-4 py-2 rounded-lg hover:bg-es-green-light disabled:opacity-50">Créer</button>
            <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="text-sm px-4 py-2 text-gray-500">Annuler</button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Dossiers */}
          {folders.map((folder) => {
            const folderLists = lists.filter((l) => l.folder_id === folder.id);
            const folderTotal = folderLists.reduce((s, l) => s + l.contact_count, 0);
            return (
              <div key={folder.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl">📁</span>
                    <EditableName
                      value={folder.name}
                      onSave={(name) => renameItem("folder", folder.id, name)}
                      className="font-serif text-base font-bold text-gray-900"
                    />
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 shrink-0">
                      {folderLists.length} liste{folderLists.length > 1 ? "s" : ""} · {folderTotal} contacts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setShowNewListFor(folder.id); setNewListData({ folderId: folder.id, name: "", description: "" }); }}
                      className="text-xs font-semibold text-es-green hover:underline"
                    >
                      + Liste
                    </button>
                    <button
                      onClick={() => deleteItem("folder", folder.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                      title="Supprimer le dossier (les listes seront détachées)"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {showNewListFor === folder.id && (
                  <div className="bg-es-green/5 p-4 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Nouvelle liste dans &quot;{folder.name}&quot;</p>
                    <div className="space-y-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Nom de la liste (ex : Formation gratuite)"
                        value={newListData.name}
                        onChange={(e) => setNewListData({ ...newListData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Description (optionnel)"
                        value={newListData.description}
                        onChange={(e) => setNewListData({ ...newListData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <button onClick={createList} disabled={saving} className="bg-es-green text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">Créer</button>
                        <button onClick={() => { setShowNewListFor(null); setNewListData({ folderId: null, name: "", description: "" }); }} className="text-sm px-4 py-2 text-gray-500">Annuler</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-gray-100">
                  {folderLists.length === 0 ? (
                    <div className="px-5 py-6 text-center text-xs text-gray-400 italic">Aucune liste dans ce dossier</div>
                  ) : (
                    folderLists.map((l) => (
                      <ListRow key={l.id} list={l} onDelete={() => deleteItem("list", l.id)} onRename={(name) => renameItem("list", l.id, name)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Listes sans dossier */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-xl">📋</span>
                <h2 className="font-serif text-base font-bold text-gray-900">Sans dossier</h2>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  {unfiledLists.length} liste{unfiledLists.length > 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={() => { setShowNewListFor("unfiled"); setNewListData({ folderId: null, name: "", description: "" }); }}
                className="text-xs font-semibold text-es-green hover:underline"
              >
                + Liste
              </button>
            </div>

            {showNewListFor === "unfiled" && (
              <div className="bg-es-green/5 p-4 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Nouvelle liste (sans dossier)</p>
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nom de la liste"
                    value={newListData.name}
                    onChange={(e) => setNewListData({ ...newListData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Description (optionnel)"
                    value={newListData.description}
                    onChange={(e) => setNewListData({ ...newListData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={createList} disabled={saving} className="bg-es-green text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">Créer</button>
                    <button onClick={() => setShowNewListFor(null)} className="text-sm px-4 py-2 text-gray-500">Annuler</button>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {unfiledLists.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-gray-400 italic">Aucune liste hors dossier</div>
              ) : (
                unfiledLists.map((l) => (
                  <ListRow key={l.id} list={l} onDelete={() => deleteItem("list", l.id)} onRename={(name) => renameItem("list", l.id, name)} />
                ))
              )}
            </div>
          </div>

          {folders.length === 0 && unfiledLists.length === 0 && (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-500 mb-4">Aucune liste créée pour l&apos;instant.</p>
              <p className="text-sm text-gray-400 mb-6">
                Commence par créer un dossier (ex : &quot;Lead magnets&quot;), puis ajoute des listes à l&apos;intérieur (ex : &quot;Formation gratuite&quot;, &quot;Cahier de vacances&quot;).
              </p>
              <button onClick={() => setShowNewFolder(true)} className="bg-es-green text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-es-green-light">
                + Créer mon premier dossier
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListRow({ list, onDelete, onRename }: { list: ContactList; onDelete: () => void; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);

  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg">📋</span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onRename(name); setEditing(false); }
                  if (e.key === "Escape") { setName(list.name); setEditing(false); }
                }}
                className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full max-w-xs"
              />
              <button onClick={() => { onRename(name); setEditing(false); }} className="text-xs px-2 py-1 bg-es-green text-white rounded">OK</button>
              <button onClick={() => { setName(list.name); setEditing(false); }} className="text-xs text-gray-500">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/contacts?tag=${encodeURIComponent(list.tag_key)}`}
                className="text-sm font-medium text-gray-900 hover:text-es-green truncate"
              >
                {list.name}
              </Link>
              <button onClick={() => setEditing(true)} className="text-[11px] text-gray-400 hover:text-es-green" title="Renommer">✎</button>
            </div>
          )}
          {list.description && <p className="text-xs text-gray-500 truncate">{list.description}</p>}
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">tag : {list.tag_key}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`inline-flex items-center justify-center min-w-[2.5rem] h-7 px-2.5 rounded-full text-xs font-bold ${
          list.contact_count > 0 ? "bg-es-green/10 text-es-green" : "bg-gray-100 text-gray-400"
        }`}>
          {list.contact_count}
        </span>
        <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700">Suppr.</button>
      </div>
    </div>
  );
}

function EditableName({ value, onSave, className = "" }: { value: string; onSave: (name: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(draft); setEditing(false); }
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className={`${className} border border-gray-300 rounded px-2 py-1 flex-1 min-w-0`}
        />
        <button onClick={() => { onSave(draft); setEditing(false); }} className="text-xs px-2 py-1 bg-es-green text-white rounded">OK</button>
        <button onClick={() => { setDraft(value); setEditing(false); }} className="text-xs text-gray-500">✕</button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <h2 className={`${className} truncate`}>{value}</h2>
      <button onClick={() => { setDraft(value); setEditing(true); }} className="text-[11px] text-gray-400 hover:text-es-green shrink-0" title="Renommer">✎</button>
    </div>
  );
}
