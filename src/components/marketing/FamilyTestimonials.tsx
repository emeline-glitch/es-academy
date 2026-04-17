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
            <div key={i} className="bg-es-cream rounded-2xl overflow-hidden border border-es-cream-dark">
              <div className="relative aspect-video bg-gradient-to-br from-es-terracotta via-es-terracotta-dark to-es-terracotta/70 cursor-pointer group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-es-terracotta ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="font-serif font-bold text-es-text mb-2">{t.label}</p>
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
            className="bg-es-cream rounded-2xl overflow-hidden border border-es-cream-dark text-left cursor-pointer group shadow-md hover:shadow-lg transition-shadow"
            aria-label={`Voir le témoignage ${t.label} en plein écran`}
          >
            <div className="relative w-full">
              <Image
                src={t.src}
                alt={t.alt}
                width={900}
                height={1200}
                className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform"
                quality={85}
              />
            </div>
            <div className="p-5 border-t border-es-cream-dark">
              <p className="font-serif font-bold text-es-text mb-2">{t.label}</p>
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
