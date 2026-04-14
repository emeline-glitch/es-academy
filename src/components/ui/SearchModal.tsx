"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  title: string;
  url: string;
  type: string;
}

const staticPages: SearchResult[] = [
  { title: "ES Academy — Formation immobilier", url: "/academy", type: "Page" },
  { title: "ES Family — Communauté", url: "/family", type: "Page" },
  { title: "Blog", url: "/blog", type: "Page" },
  { title: "À propos — Emeline Siron", url: "/a-propos", type: "Page" },
  { title: "Outils gratuits", url: "/outils-gratuits", type: "Page" },
  { title: "Connexion", url: "/connexion", type: "Page" },
  { title: "Contact", url: "/#contact", type: "Page" },
  { title: "Podcast Out of the Box", url: "/podcast", type: "Page" },
  { title: "Glossaire immobilier", url: "/glossaire", type: "Page" },
  { title: "Investissement locatif", url: "/blog/construire-patrimoine-immobilier-locatif", type: "Article" },
  { title: "Créer une SCI", url: "/blog/comment-creer-societe-civile-immobiliere-sci", type: "Article" },
  { title: "LMNP déductions", url: "/blog/maximiser-depenses-deductibles-lmnp", type: "Article" },
  { title: "Investir sans apport", url: "/blog/reussir-investissement-locatif-sans-apport", type: "Article" },
  { title: "Scoring bancaire", url: "/blog/4-astuces-pour-booster-son-scoring-bancaire-rapidement", type: "Article" },
  { title: "Plus-value immobilière", url: "/blog/tout-savoir-plus-value-immobiliere", type: "Article" },
  { title: "Location saisonnière", url: "/blog/location-saisonniere-conseils-reglementations", type: "Article" },
  { title: "Défiscalisation", url: "/blog/defiscalisation-immobiliere-guide-complet", type: "Article" },
];

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  const results = query.length > 1
    ? staticPages.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  function handleSelect(url: string) {
    setOpen(false);
    router.push(url);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page, un article..."
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className="py-2 max-h-80 overflow-y-auto">
            {results.map((result, i) => (
              <button
                key={i}
                onClick={() => handleSelect(result.url)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-es-green/5 transition-colors text-left cursor-pointer"
              >
                <span className="text-xs text-gray-400 w-12">{result.type}</span>
                <span className="text-sm text-gray-900">{result.title}</span>
              </button>
            ))}
          </div>
        )}

        {query.length > 1 && results.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            Aucun résultat pour &quot;{query}&quot;
          </div>
        )}

        {query.length <= 1 && (
          <div className="py-4 px-5 text-xs text-gray-400">
            Tapez pour rechercher... Pages, articles, outils.
          </div>
        )}
      </div>
    </div>
  );
}
