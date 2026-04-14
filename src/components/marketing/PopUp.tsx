"use client";

import { useState, useEffect } from "react";
import { CaptureForm } from "./CaptureForm";

interface PopUpProps {
  delay?: number;
  exitIntent?: boolean;
}

export function PopUp({ delay = 30000, exitIntent = true }: PopUpProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("popup_dismissed");
    if (dismissed) return;

    // Timer trigger
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    // Exit intent trigger
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0 && exitIntent) {
        setIsOpen(true);
      }
    }

    if (exitIntent) {
      document.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [delay, exitIntent]);

  function handleClose() {
    setIsOpen(false);
    sessionStorage.setItem("popup_dismissed", "true");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-es-cream rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-es-cream-dark transition-colors cursor-pointer z-10"
        >
          <svg className="w-5 h-5 text-es-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Green header */}
        <div className="bg-es-green px-8 py-6 text-white text-center">
          <h3 className="font-serif text-xl font-bold mb-1">Attends !</h3>
          <p className="text-white/80 text-sm">
            3 outils gratuits pour ton premier investissement
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <CaptureForm
            title=""
            description="Simulateur de rentabilite + checklist visite + guide du financement sans apport. Gratuit, dans ta boite mail."
            buttonText="Recevoir mes outils gratuits"
            variant="inline"
          />
        </div>
      </div>
    </div>
  );
}
