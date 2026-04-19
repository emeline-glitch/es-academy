"use client";

import { useEffect, useState } from "react";

interface ContactList {
  id: string;
  name: string;
  tag_key: string;
  folder_id: string | null;
  contact_count?: number;
}
interface ListFolder {
  id: string;
  name: string;
}

interface AudienceTargeterProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  helpText?: string;
  singleSelect?: boolean; // pour les séquences (un seul tag par enroll)
}

export function AudienceTargeter({
  value,
  onChange,
  label = "Destinataires",
  helpText = "Vide = tous les contacts actifs",
  singleSelect = false,
}: AudienceTargeterProps) {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [folders, setFolders] = useState<ListFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/lists")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setLists(data.lists || []);
          setFolders(data.folders || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggle(tagKey: string) {
    if (singleSelect) {
      onChange([tagKey]);
      return;
    }
    if (value.includes(tagKey)) {
      onChange(value.filter((t) => t !== tagKey));
    } else {
      onChange([...value, tagKey]);
    }
  }

  const totalEstimate = lists
    .filter((l) => value.includes(l.tag_key))
    .reduce((s, l) => s + (l.contact_count || 0), 0);

  const foldersWithLists = folders
    .map((f) => ({
      folder: f,
      lists: lists.filter((l) => l.folder_id === f.id),
    }))
    .filter((g) => g.lists.length > 0);

  const unfiledLists = lists.filter((l) => !l.folder_id);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {value.length > 0 && !singleSelect && (
          <button
            onClick={() => onChange([])}
            className="text-[11px] text-gray-400 hover:text-gray-600"
          >
            Tout désélectionner
          </button>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        {loading ? (
          <div className="text-xs text-gray-400 p-4 text-center">Chargement…</div>
        ) : lists.length === 0 ? (
          <div className="text-xs text-gray-400 p-4 text-center italic">
            Aucune liste créée.{" "}
            <a href="/admin/lists" className="text-es-green hover:underline">Crée-en une →</a>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {foldersWithLists.map(({ folder, lists: folderLists }) => (
              <div key={folder.id}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1 bg-gray-50 sticky top-0">
                  📁 {folder.name}
                </p>
                {folderLists.map((l) => {
                  const checked = value.includes(l.tag_key);
                  return (
                    <label
                      key={l.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-t border-gray-50 ${
                        checked ? "bg-es-green/5" : ""
                      }`}
                    >
                      <input
                        type={singleSelect ? "radio" : "checkbox"}
                        name={singleSelect ? "audience-target" : undefined}
                        checked={checked}
                        onChange={() => toggle(l.tag_key)}
                        className="rounded border-gray-300 accent-es-green"
                      />
                      <span className="text-sm text-gray-900 flex-1">{l.name}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {l.contact_count || 0}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}

            {unfiledLists.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1 bg-gray-50">
                  Sans dossier
                </p>
                {unfiledLists.map((l) => {
                  const checked = value.includes(l.tag_key);
                  return (
                    <label
                      key={l.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-t border-gray-50 ${
                        checked ? "bg-es-green/5" : ""
                      }`}
                    >
                      <input
                        type={singleSelect ? "radio" : "checkbox"}
                        name={singleSelect ? "audience-target" : undefined}
                        checked={checked}
                        onChange={() => toggle(l.tag_key)}
                        className="rounded border-gray-300 accent-es-green"
                      />
                      <span className="text-sm text-gray-900 flex-1">{l.name}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {l.contact_count || 0}
                      </span>
                    </label>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-gray-400">{helpText}</p>
        {value.length > 0 && !singleSelect && (
          <p className="text-xs font-semibold text-es-green">
            ≈ {totalEstimate} contact{totalEstimate > 1 ? "s" : ""} ciblé{totalEstimate > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
