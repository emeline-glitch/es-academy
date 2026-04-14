"use client";

import { useState, useEffect } from "react";

interface MobileCtaProps {
  text?: string;
  href?: string;
  variant?: "green" | "terracotta";
}

export function MobileCta({
  text = "Rejoindre la formation",
  href = "/academy",
  variant = "green",
}: MobileCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  const bgClass = variant === "terracotta"
    ? "bg-es-terracotta hover:bg-es-terracotta-dark"
    : "bg-es-green hover:bg-es-green-light";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
      <a
        href={href}
        className={`pointer-events-auto block w-full text-center text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all ${bgClass}`}
      >
        {text}
      </a>
    </div>
  );
}
