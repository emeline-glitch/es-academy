"use client";

import { useState, useEffect } from "react";

type ProofMessage =
  | { type: "person"; name: string; action: string; time: string }
  | { type: "active"; count: number; action: string };

const names = [
  "Sophie L.", "Marie D.", "Camille B.", "Julie F.", "Léa M.", "Alice V.",
  "Emma G.", "Chloé P.", "Clara T.", "Inès H.", "Manon R.", "Lisa K.",
  "Élodie S.", "Sarah B.", "Yasmine A.", "Aicha S.", "Fatou K.", "Amina L.",
  "Thomas R.", "Lucas B.", "Hugo M.", "Antoine D.", "Nicolas F.", "Pierre L.",
  "Maxime V.", "Romain C.", "Julien T.", "Mathieu P.", "Benjamin G.", "Florian D.",
  "Karim M.", "Mehdi A.", "Youssef B.", "Samir K.", "Amine T.", "Rachid H.",
  "Ana R.", "Carlos G.", "Sofia P.", "Diego S.",
];

const times = ["il y a 12 min", "il y a 23 min", "il y a 45 min", "il y a 1h", "il y a 2h", "il y a 3h", "il y a 5h", "il y a 8h"];

const simulatorsEnCours = [
  "frais de notaire",
  "capacité d'emprunt",
  "acheter ou louer",
  "mensualité de crédit",
  "taux d'endettement",
];

function pickMessage(): ProofMessage {
  const r = Math.random();
  if (r < 0.45) {
    return {
      type: "person",
      name: names[Math.floor(Math.random() * names.length)],
      action: "vient de rejoindre le programme de formation",
      time: times[Math.floor(Math.random() * times.length)],
    };
  }
  if (r < 0.8) {
    return {
      type: "person",
      name: names[Math.floor(Math.random() * names.length)],
      action: "vient de rejoindre la communauté ES Family",
      time: times[Math.floor(Math.random() * times.length)],
    };
  }
  return {
    type: "active",
    count: 2 + Math.floor(Math.random() * 7), // 2 à 8
    action: `utilisent le simulateur ${simulatorsEnCours[Math.floor(Math.random() * simulatorsEnCours.length)]}`,
  };
}

export function SocialProof() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [msg, setMsg] = useState<ProofMessage | null>(null);

  useEffect(() => {
    setMsg(pickMessage());
    const timer = setTimeout(() => setVisible(true), 8000);
    const hideTimer = setTimeout(() => setVisible(false), 18000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible || dismissed || !msg) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40 bg-white rounded-xl shadow-lg border border-es-cream-dark p-4 max-w-xs animate-[fadeInUp_0.4s_ease-out]">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-es-text-muted/40 hover:text-es-text-muted cursor-pointer"
        aria-label="Fermer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-es-green/10 flex items-center justify-center shrink-0">
          {msg.type === "person" ? (
            <span className="text-xs font-bold text-es-green">{msg.name[0]}</span>
          ) : (
            <span className="text-sm font-bold text-es-green">{msg.count}</span>
          )}
        </div>
        <div>
          {msg.type === "person" ? (
            <>
              <p className="text-sm text-es-text">
                <span className="font-medium">{msg.name}</span>{" "}
                <span className="text-es-text-muted">{msg.action}</span>
              </p>
              <p className="text-[10px] text-es-text-muted/50">{msg.time}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-es-text">
                <span className="font-medium">{msg.count} personnes</span>{" "}
                <span className="text-es-text-muted">{msg.action}</span>
              </p>
              <p className="text-[10px] text-es-text-muted/50">en ce moment</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
