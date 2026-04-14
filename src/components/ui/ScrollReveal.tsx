"use client";

import { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const directionClass = {
    up: "translate-y-8",
    left: "-translate-x-8",
    right: "translate-x-8",
    scale: "scale-95",
  }[direction];

  return (
    <div
      ref={ref}
      className={`opacity-0 ${directionClass} transition-all duration-700 ease-out [&.is-revealed]:opacity-100 [&.is-revealed]:translate-x-0 [&.is-revealed]:translate-y-0 [&.is-revealed]:scale-100 ${className}`}
    >
      {children}
    </div>
  );
}
