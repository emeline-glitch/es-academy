"use client";

import { useState, useEffect } from "react";

export function SocialProof() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 8000);
    const hideTimer = setTimeout(() => setVisible(false), 18000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible || dismissed) return null;

  const messages = [
    { name: "Sophie L.", action: "a rejoint la formation", time: "il y a 2h" },
    { name: "Thomas R.", action: "a terminé le module 3", time: "il y a 4h" },
    { name: "Marie D.", action: "a rejoint ES Family", time: "il y a 6h" },
  ];

  const msg = messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40 bg-white rounded-xl shadow-lg border border-es-cream-dark p-4 max-w-xs animate-[fadeInUp_0.4s_ease-out]">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-es-text-muted/40 hover:text-es-text-muted cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-es-green/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-es-green">{msg.name[0]}</span>
        </div>
        <div>
          <p className="text-sm text-es-text">
            <span className="font-medium">{msg.name}</span>{" "}
            <span className="text-es-text-muted">{msg.action}</span>
          </p>
          <p className="text-[10px] text-es-text-muted/50">{msg.time}</p>
        </div>
      </div>
    </div>
  );
}
