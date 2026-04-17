"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/ui/Lightbox";

interface ImageTestimonial {
  type: "image";
  src: string;
  alt: string;
  label: string;
}

interface VideoPlaceholder {
  type: "video-placeholder";
  label: string;
  token: string;
}

type Item = ImageTestimonial | VideoPlaceholder;

const items: Item[] = [
  {
    type: "image",
    src: "/images/site/04-avis-clients/avis-04-maeva-premier-achat-sans-cdi.jpg",
    alt: "Témoignage de Maeva, premier achat immobilier sans CDI",
    label: "Maeva, premier achat sans CDI",
  },
  {
    type: "image",
    src: "/images/site/04-avis-clients/avis-05-mosaique-clients-clefs.jpg",
    alt: "Mosaïque d'élèves d'Emeline tenant les clés de leur premier bien",
    label: "Des élèves qui signent leur premier bien",
  },
  {
    type: "video-placeholder",
    label: "[TODO_VIDEO_TEMOIGNAGE_1]",
    token: "[TODO_VIDEO_TEMOIGNAGE_1]",
  },
];

export function FamilyTestimonials() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const imageItems = items.filter((i): i is ImageTestimonial => i.type === "image");

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {items.map((t, i) => {
        if (t.type === "video-placeholder") {
          return (
            <div key={i} className="bg-es-cream rounded-2xl overflow-hidden border border-es-cream-dark flex flex-col">
              {/* Ratio 3:4 pour matcher les deux autres cards */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-es-terracotta via-es-terracotta-dark to-es-terracotta/70 cursor-pointer group flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mx-auto mb-4">
                    <svg className="w-6 h-6 text-es-terracotta ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <p className="text-white/80 text-xs italic">Vidéo témoignage à venir</p>
                </div>
              </div>
              <div className="p-5 border-t border-es-cream-dark">
                <p className="font-serif font-bold text-es-text">{t.label}</p>
              </div>
            </div>
          );
        }

        const lightboxPos = imageItems.findIndex((img) => img.src === t.src);
        return (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(lightboxPos)}
            className="bg-es-cream rounded-2xl overflow-hidden border border-es-cream-dark text-left cursor-pointer group shadow-md hover:shadow-lg transition-shadow flex flex-col"
            aria-label={`Voir le témoignage ${t.label} en plein écran`}
          >
            {/* Ratio fixe 3:4 pour harmoniser les 3 cards */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-es-cream-dark">
              <Image
                src={t.src}
                alt={t.alt}
                width={900}
                height={1200}
                className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                quality={85}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white/95 rounded-full px-3 py-1.5 text-xs font-medium text-es-text shadow-lg transition-opacity">
                  Voir en grand
                </span>
              </div>
            </div>
            <div className="p-5 border-t border-es-cream-dark">
              <p className="font-serif font-bold text-es-text">{t.label}</p>
            </div>
          </button>
        );
      })}

      <Lightbox
        images={imageItems.map((t) => ({
          src: t.src,
          alt: t.alt,
          caption: t.label,
        }))}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
