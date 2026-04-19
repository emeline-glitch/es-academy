"use client";

import { useState } from "react";

interface MergeTagsToolbarProps {
  /** Appelé avec le tag à insérer (ex: "{{prenom}}") */
  onInsert: (tag: string) => void;
}

const MERGE_TAGS = [
  { key: "{{prenom}}", label: "Prénom", example: "Marie" },
  { key: "{{nom}}", label: "Nom", example: "Dupont" },
  { key: "{{email}}", label: "Email", example: "marie@exemple.com" },
  { key: "{{date}}", label: "Date du jour", example: new Date().toLocaleDateString("fr-FR") },
];

export function MergeTagsToolbar({ onInsert }: MergeTagsToolbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs font-medium text-es-green hover:bg-es-green/10 px-2 py-1 rounded border border-es-green/30"
        title="Variables de personnalisation"
      >
        {"{{…}}"} Variables
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[260px] overflow-hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2 bg-gray-50 border-b border-gray-100">
              Insérer une variable
            </p>
            {MERGE_TAGS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  onInsert(t.key);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-t border-gray-50 first:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-es-green">{t.key}</span>
                  <span className="text-[10px] text-gray-400">→ {t.example}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{t.label}</div>
              </button>
            ))}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500">
              Les variables seront remplacées par les données du contact au moment de l&apos;envoi.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Rendu côté client d'un template avec merge tags pour la preview */
export function renderMergeTagsPreview(
  template: string,
  contact: { first_name?: string; last_name?: string; email?: string } | null
): string {
  const first = contact?.first_name || "[Prénom]";
  const last = contact?.last_name || "[Nom]";
  const email = contact?.email || "[email]";
  const date = new Date().toLocaleDateString("fr-FR");
  return template
    .replace(/\{\{\s*prenom\s*\}\}/gi, first)
    .replace(/\{\{\s*nom\s*\}\}/gi, last)
    .replace(/\{\{\s*email\s*\}\}/gi, email)
    .replace(/\{\{\s*date\s*\}\}/gi, date);
}
