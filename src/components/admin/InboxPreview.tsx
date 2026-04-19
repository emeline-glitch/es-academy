"use client";

interface InboxPreviewProps {
  fromName: string;
  subject: string;
  previewText: string;
}

/**
 * Mock d'un inbox iPhone avec l'email en tête, 3 autres greyed out
 */
export function InboxPreview({ fromName, subject, previewText }: InboxPreviewProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[280px] border-[3px] border-gray-200 rounded-[40px] p-2 bg-white shadow-lg">
        {/* Dynamic island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-200 rounded-full" />

        <div className="border border-gray-100 rounded-[30px] overflow-hidden pt-10 pb-6 bg-white">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-3 text-[11px] text-gray-400">
            <span>9:47</span>
            <div className="flex items-center gap-1">
              <span>􀙇</span>
              <span>􀛨</span>
            </div>
          </div>

          {/* Inbox header */}
          <p className="text-center font-bold text-gray-900 text-sm mb-3">Inbox</p>

          {/* First email (active) */}
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[13px] font-bold text-gray-900 truncate">
                {fromName || "Expéditeur"}
              </p>
              <span className="text-[10px] text-gray-400 shrink-0">17:45</span>
            </div>
            <p className="text-[12px] font-semibold text-gray-900 truncate">
              {subject || "Objet du message…"}
            </p>
            <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
              {previewText || "Votre texte d'aperçu"}
            </p>
          </div>

          {/* Fake siblings (greyed out placeholders) */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-gray-100 px-4 py-3 opacity-40">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[13px] font-bold text-gray-400 truncate">{fromName || "Expéditeur"}</p>
                <span className="text-[10px] text-gray-300 shrink-0">17:45</span>
              </div>
              <div className="h-2 bg-gray-100 rounded w-3/4 mb-1" />
              <div className="h-1.5 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mt-4 text-center max-w-[240px]">
        L&apos;aperçu de l&apos;email réel peut varier selon le client de messagerie.
      </p>
    </div>
  );
}
