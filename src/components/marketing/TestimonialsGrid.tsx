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
          className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow text-left cursor-pointer group"
          aria-label={`Voir le témoignage de ${t.label} en plein écran`}
        >
          <div className="relative w-full bg-es-cream">
            <Image
              src={t.src}
              alt={t.alt}
              width={900}
              height={1600}
              className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform"
              quality={85}
            />
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
