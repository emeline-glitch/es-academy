"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchContact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
}

interface Action {
  label: string;
  hint: string;
  icon: string;
  href: string;
}

const QUICK_ACTIONS: Action[] = [
  { label: "Pipeline", hint: "Voir le pipeline commercial", icon: "🎯", href: "/admin/pipeline" },
  { label: "Ajouter un contact", hint: "Nouveau contact dans le CRM", icon: "➕", href: "/admin/contacts?add=1" },
  { label: "Listes", hint: "Gérer les listes et dossiers", icon: "📋", href: "/admin/lists" },
  { label: "Élèves", hint: "Voir la liste des élèves", icon: "🎓", href: "/admin/eleves" },
  { label: "Nouvelle campagne email", hint: "Rédiger une campagne", icon: "✉️", href: "/admin/emails/new" },
  { label: "Dashboard", hint: "KPIs et activité", icon: "📊", href: "/admin/dashboard" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);
  const [contacts, setContacts] = useState<SearchContact[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Raccourci Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!debouncedQuery) {
      setContacts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/contacts?limit=10&search=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setContacts(data.contacts || []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const actions = useMemo(() => {
    if (!query) return QUICK_ACTIONS;
    const q = query.toLowerCase();
    return QUICK_ACTIONS.filter(
      (a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q)
    );
  }, [query]);

  const allItems: Array<
    | { kind: "action"; item: Action }
    | { kind: "contact"; item: SearchContact }
  > = useMemo(() => {
    return [
      ...actions.map((a) => ({ kind: "action" as const, item: a })),
      ...contacts.map((c) => ({ kind: "contact" as const, item: c })),
    ];
  }, [actions, contacts]);

  function selectItem(idx: number) {
    const entry = allItems[idx];
    if (!entry) return;
    if (entry.kind === "action") {
      router.push(entry.item.href);
    } else {
      router.push(`/admin/contacts/${entry.item.id}`);
    }
    setOpen(false);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectItem(activeIndex);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 md:hidden z-40 bg-es-green text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
        aria-label="Recherche rapide"
      >
        🔍
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 z-[90] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <span className="text-gray-400">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Rechercher un contact, une action…"
            className="flex-1 outline-none text-sm"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {actions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">Actions</p>
              {actions.map((a) => {
                const idx = allItems.findIndex((it) => it.kind === "action" && it.item.href === a.href);
                const active = idx === activeIndex;
                return (
                  <button
                    key={a.href}
                    onClick={() => selectItem(idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                      active ? "bg-es-green/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{a.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900">{a.label}</p>
                      <p className="text-xs text-gray-500 truncate">{a.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {debouncedQuery && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                Contacts {loading && "…"}
              </p>
              {contacts.length === 0 && !loading ? (
                <p className="text-xs text-gray-400 italic px-4 py-3">Aucun contact pour « {debouncedQuery} »</p>
              ) : (
                contacts.map((c) => {
                  const idx = allItems.findIndex((it) => it.kind === "contact" && it.item.id === c.id);
                  const active = idx === activeIndex;
                  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectItem(idx)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                        active ? "bg-es-green/10" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-8 h-8 rounded-full bg-es-green/10 text-es-green text-xs font-bold flex items-center justify-center shrink-0">
                        {(name[0] || "?").toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.email}</p>
                      </div>
                      {c.phone && <span className="text-xs text-gray-400 shrink-0">📞</span>}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-[10px] text-gray-500">
          <span><kbd className="bg-white px-1 rounded border border-gray-200">↑↓</kbd> naviguer</span>
          <span><kbd className="bg-white px-1 rounded border border-gray-200">↵</kbd> ouvrir</span>
          <span className="ml-auto"><kbd className="bg-white px-1 rounded border border-gray-200">⌘K</kbd> / <kbd className="bg-white px-1 rounded border border-gray-200">Ctrl+K</kbd></span>
        </div>
      </div>
    </div>
  );
}
