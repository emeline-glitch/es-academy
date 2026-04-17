"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/ui/Lightbox";

const CAPITAL_IMG = "/images/site/07-presse-medias/presse-01-capital-article-2022.jpg";

export function PressGrid() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Capital — card principale en grand */}
      <div className="max-w-3xl mx-auto mb-10">
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-2xl overflow-hidden shadow-lg group cursor-pointer block"
          aria-label="Ouvrir l'article Capital en plein écran"
        >
          <Image
            src={CAPITAL_IMG}
            alt="Article Capital sur Emeline Siron, 2022"
            width={1600}
            height={900}
            className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
            quality={85}
          />
          {/* Overlay gradient discret */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent" />
          {/* Badge "Vu dans" */}
          <span className="absolute top-4 left-4 bg-white/95 text-es-text text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow">
            Vu dans
          </span>
          {/* Mention Capital */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-white font-serif text-2xl sm:text-3xl font-bold drop-shadow">Capital</p>
              <p className="text-white/80 text-sm drop-shadow">Article 2022</p>
            </div>
            <span className="opacity-0 group-hover:opacity-100 bg-white/95 rounded-full px-3 py-1.5 text-xs font-medium text-es-text shadow-lg transition-opacity">
              Lire l&apos;article →
            </span>
          </div>
        </button>
      </div>

      {/* Logos autres médias */}
      <div className="border-t border-es-cream-dark pt-8">
        <p className="text-center text-xs text-es-text-muted/70 uppercase tracking-widest mb-6">Également présente dans</p>
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto items-center">
          {/* TODO: remplacer par les vrais logos */}
          <div className="h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium px-3">
            BFM Business
          </div>
          <div className="h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium px-3">
            Les Échos
          </div>
          <div className="h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium px-3">
            Marie Claire
          </div>
        </div>
        <p className="text-center text-[10px] text-gray-400 italic mt-4">
          Placeholders — les vrais logos seront intégrés une fois fournis
        </p>
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
