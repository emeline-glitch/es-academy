"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  /** Index de l'image active, null = lightbox fermée */
  activeIndex: number | null;
  onClose: () => void;
}

export function Lightbox({ images, activeIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(activeIndex ?? 0);

  useEffect(() => {
    if (activeIndex !== null) setCurrentIndex(activeIndex);
  }, [activeIndex]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, onClose, goPrev, goNext]);

  if (activeIndex === null) return null;

  const image = images[currentIndex];
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visionneuse d'image"
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
        aria-label="Fermer"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Image précédente"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Image suivante"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={image.src}
            alt={image.alt}
            width={1600}
            height={1600}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
            quality={90}
          />
        </div>
        {image.caption && (
          <p className="text-white/80 text-sm mt-4 text-center max-w-2xl px-4">{image.caption}</p>
        )}
        {images.length > 1 && (
          <p className="text-white/40 text-xs mt-2">{currentIndex + 1} / {images.length}</p>
        )}
      </div>
    </div>
  );
}
