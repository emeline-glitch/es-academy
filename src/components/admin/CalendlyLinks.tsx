"use client";

import { useState } from "react";
import type { CalendlyLink } from "@/lib/calendly/links";

interface Props {
  owner: string;
  profileUrl: string;
  events: CalendlyLink[];
}

export function CalendlyLinks({ owner, profileUrl, events }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-es-text-muted">
          Profil {owner} :{" "}
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener"
            className="text-es-green hover:underline font-mono text-xs"
          >
            {profileUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <button
          type="button"
          onClick={() => copy(profileUrl)}
          className="text-xs px-2 py-1 rounded border border-es-cream-dark hover:bg-es-cream/50 transition-colors"
        >
          {copied === profileUrl ? "Copie" : "Copier le profil"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-es-cream-dark">
              <th className="py-2 px-2 font-medium text-es-text-muted">Source</th>
              <th className="py-2 px-2 font-medium text-es-text-muted">Lien</th>
              <th className="py-2 px-2 font-medium text-es-text-muted text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.url} className="border-b border-es-cream-dark/50 align-top">
                <td className="py-2 px-2">
                  <div className="font-medium text-es-text">{e.source}</div>
                  {e.description && (
                    <div className="text-xs text-es-text-muted mt-0.5">{e.description}</div>
                  )}
                </td>
                <td className="py-2 px-2">
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener"
                    className="text-es-green hover:underline font-mono text-xs break-all"
                  >
                    {e.url.replace(/^https?:\/\//, "")}
                  </a>
                </td>
                <td className="py-2 px-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => copy(e.url)}
                    className="text-xs px-2 py-1 rounded border border-es-cream-dark hover:bg-es-cream/50 transition-colors"
                  >
                    {copied === e.url ? "Copie" : "Copier"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
