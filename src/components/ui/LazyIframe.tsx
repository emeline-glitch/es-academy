"use client";

import { useState, useRef, useEffect } from "react";

interface LazyIframeProps {
  src: string;
  height?: number;
  title?: string;
  placeholder?: string;
}

export function LazyIframe({
  src,
  height = 420,
  title = "Contenu embarqué",
  placeholder = "Cliquez pour charger le contenu",
}: LazyIframeProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {loaded ? (
        <iframe
          src={src}
          title={title}
          frameBorder="0"
          loading="lazy"
          style={{ border: "none", width: "100%", height: `${height}px` }}
        />
      ) : (
        <div
          className="bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
          style={{ height: `${height}px` }}
          onClick={() => setLoaded(true)}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">🎧</div>
            <p className="text-sm text-gray-500">{placeholder}</p>
          </div>
        </div>
      )}
    </div>
  );
}
