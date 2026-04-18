"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/ui/Lightbox";

export interface TestimonialItem {
  src: string;
  alt: string;
  label?: string;
  width?: number;
  height?: number;
}

interface TestimonialsGridProps {
  items: TestimonialItem[];
  variant?: "grid" | "masonry";
}

export function TestimonialsGrid({ items, variant = "grid" }: TestimonialsGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (variant === "masonry") {
    return (
      <>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {items.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="block w-full mb-6 break-inside-avoid bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
              aria-label={t.label ? `Voir le témoignage de ${t.label} en plein écran` : "Voir le message en plein écran"}
            >
              <Image
                src={t.src}
                alt={t.alt}
                width={t.width ?? 1200}
                height={t.height ?? 1600}
                className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-500"
                quality={85}
              />
            </button>
          ))}
        </div>

        <Lightbox
          images={items.map((t) => ({
            src: t.src,
            alt: t.alt,
            caption: t.label,
          }))}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      </>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {items.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setLightboxIndex(i)}
          className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow text-left cursor-pointer group flex flex-col"
          aria-label={t.label ? `Voir le témoignage de ${t.label} en plein écran` : "Voir le message en plein écran"}
        >
          {/* Image entière visible (pas de crop) */}
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-es-cream">
            <Image
              src={t.src}
              alt={t.alt}
              width={900}
              height={1200}
              className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
              quality={85}
            />
            {/* Icône zoom au hover pour indiquer que c'est cliquable */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-white/95 rounded-full px-3 py-1.5 text-xs font-medium text-es-text shadow-lg transition-opacity">
                Voir le message entier
              </span>
            </div>
          </div>
          {t.label && (
            <div className="p-4 border-t border-es-cream-dark">
              <p className="text-sm font-medium text-es-text">{t.label}</p>
            </div>
          )}
        </button>
      ))}

      <Lightbox
        images={items.map((t) => ({
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
