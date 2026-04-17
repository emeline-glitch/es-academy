"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/ui/Lightbox";

export interface TestimonialItem {
  src: string;
  alt: string;
  label: string;
}

interface TestimonialsGridProps {
  items: TestimonialItem[];
}

export function TestimonialsGrid({ items }: TestimonialsGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {items.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setLightboxIndex(i)}
          className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow text-left cursor-pointer group flex flex-col"
          aria-label={`Voir le témoignage de ${t.label} en plein écran`}
        >
          {/* Ratio fixe 3:4, object-cover object-top pour montrer le début du message */}
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-es-cream">
            <Image
              src={t.src}
              alt={t.alt}
              width={900}
              height={1200}
              className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
              quality={85}
            />
            {/* Icône zoom au hover pour indiquer que c'est cliquable */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-white/95 rounded-full px-3 py-1.5 text-xs font-medium text-es-text shadow-lg transition-opacity">
                Voir le message entier
              </span>
            </div>
          </div>
          <div className="p-4 border-t border-es-cream-dark">
            <p className="text-sm font-medium text-es-text">{t.label}</p>
          </div>
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
