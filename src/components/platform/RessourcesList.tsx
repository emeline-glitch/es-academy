"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import type { ResourceEntry } from "@/lib/ressources-manifest";

const typeIcons: Record<string, string> = {
  Excel: "📊",
  PDF: "📄",
  Template: "📝",
  Checklist: "✅",
  Video: "🎬",
  Autre: "📁",
};

const typeColors: Record<string, string> = {
  Excel: "bg-green-50 text-green-700",
  PDF: "bg-red-50 text-red-700",
  Template: "bg-blue-50 text-blue-700",
  Checklist: "bg-amber-50 text-amber-700",
  Video: "bg-purple-50 text-purple-700",
  Autre: "bg-gray-50 text-gray-700",
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function ResourceCardLink({ entry }: { entry: ResourceEntry }) {
  const icon = typeIcons[entry.type] || typeIcons.Autre;
  const color = typeColors[entry.type] || typeColors.Autre;
  return (
    <a
      href={entry.path}
      download
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-es-green/5 transition-colors group"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-700 group-hover:text-es-green transition-colors block truncate">
            {entry.name}
          </span>
          <span className="text-[10px] text-gray-400">
            {entry.sm} &middot; {entry.format.toUpperCase()}
          </span>
        </div>
      </div>
      <span
        className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full shrink-0 ml-2 ${color}`}
      >
        {entry.type}
      </span>
    </a>
  );
}

export function RessourcesList({ resources }: { resources: ResourceEntry[] }) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;

  const filtered = useMemo(() => {
    if (!isSearching) return resources;
    const q = normalize(trimmed);
    return resources.filter(
      (r) =>
        normalize(r.name).includes(q) ||
        normalize(r.type).includes(q) ||
        normalize(r.moduleLabel).includes(q),
    );
  }, [resources, trimmed, isSearching]);

  const grouped = useMemo(() => {
    const map = new Map<number, { label: string; entries: ResourceEntry[] }>();
    for (const r of resources) {
      if (!map.has(r.moduleNum)) map.set(r.moduleNum, { label: r.moduleLabel, entries: [] });
      map.get(r.moduleNum)!.entries.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [resources]);

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une ressource (ex. cashflow, bail, DPE, holding...)"
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-es-green focus:ring-2 focus:ring-es-green/20 transition-colors"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
            🔍
          </span>
          {isSearching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              aria-label="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>
        {isSearching && (
          <p className="text-xs text-gray-500 mt-2">
            {filtered.length} resultat{filtered.length > 1 ? "s" : ""} pour &laquo; {trimmed} &raquo;
          </p>
        )}
      </div>

      {isSearching ? (
        <Card>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Aucune ressource ne correspond. Essaie un autre mot-cle.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {filtered.map((entry, i) => (
                <ResourceCardLink key={`${entry.path}-${i}`} entry={entry} />
              ))}
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([moduleNum, { label, entries }]) => (
            <section key={moduleNum}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium uppercase tracking-widest text-es-green">
                  Module {moduleNum}
                </span>
                <h2 className="font-serif text-xl font-bold text-gray-900">{label}</h2>
                <span className="text-xs text-gray-400">{entries.length} ressources</span>
              </div>
              <Card>
                <div className="grid sm:grid-cols-2 gap-2">
                  {entries.map((entry, j) => (
                    <ResourceCardLink key={`${entry.path}-${j}`} entry={entry} />
                  ))}
                </div>
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
