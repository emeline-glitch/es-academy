"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/ui/Lightbox";

const CAPITAL_IMG = "/images/site/07-presse-medias/presse-01-capital-article-2022.jpg";

export function PressGrid() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
      {/* BFM Business placeholder */}
      <div className="aspect-[3/2] rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
        [TODO_LOGO_BFM]
      </div>

      {/* Les Échos placeholder */}
      <div className="aspect-[3/2] rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
        [TODO_LOGO_ECHOS]
      </div>

      {/* Capital — image cliquable avec lightbox */}
      <button
        type="button"
        onClick={() => setLightboxIndex(0)}
        className="relative aspect-[3/2] rounded-xl overflow-hidden shadow-md group cursor-pointer"
        aria-label="Ouvrir l'article Capital en plein écran"
      >
        <Image
          src={CAPITAL_IMG}
          alt="Article Capital sur Emeline Siron, 2022"
          width={800}
          height={533}
          className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform"
          quality={85}
        />
        {/* Overlay gris semi-transparent sur la moitié basse pour masquer le corps de l'article */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-800/90 via-gray-700/70 to-transparent" />
        <span className="absolute bottom-2 right-3 text-white text-xs font-medium drop-shadow">
          Capital, 2022
        </span>
      </button>

      {/* Marie Claire placeholder */}
      <div className="aspect-[3/2] rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
        [TODO_LOGO_MARIE_CLAIRE]
      </div>

      <Lightbox
        images={[
          {
            src: CAPITAL_IMG,
            alt: "Article Capital sur Emeline Siron, 2022",
            caption: "Capital, 2022",
          },
        ]}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
