"use client";

import { useState } from "react";

type Screen = "landing" | "etat-lieux" | "dashboard" | "etape" | "coffre" | "emails";

type Profile = {
  niveau: string;
  ambition: string;
  tempsSemaine: string;
  epargne: string;
  blocage: string;
  situation: string;
};

const C = {
  sand: "#FFF6E5",
  sandDark: "#F5E6C8",
  paper: "#FFFCF3",
  lagon: "#1FBED6",
  lagonDark: "#0F8FA6",
  lagonLight: "#7FE3F0",
  coral: "#FF6B5B",
  coralDark: "#E54A3A",
  sun: "#FFC93C",
  sunLight: "#FFE08A",
  flamingo: "#FF8FAB",
  palm: "#2D9D8F",
  ink: "#0E3A4D",
  inkSoft: "#365A6C",
};

const STEPS = [
  {
    slug: "port-objectifs",
    number: 1,
    emoji: "⚓",
    title: "Le Port des objectifs",
    teaser: "Pose ton cap avant de larguer les amarres",
    duration: "20 min",
    color: C.lagon,
    rotate: "-2deg",
    status: "done" as const,
  },
  {
    slug: "plage-finances",
    number: 2,
    emoji: "🏖️",
    title: "La Plage des finances",
    teaser: "Ton banquier va dire oui en sirotant son cocktail",
    duration: "30 min",
    color: C.sun,
    rotate: "1.5deg",
    status: "current" as const,
  },
  {
    slug: "chasse-pepites",
    number: 3,
    emoji: "🗺️",
    title: "La Chasse aux pépites",
    teaser: "Repère le bien qui s'autofinance, X marque le spot",
    duration: "40 min",
    color: C.coral,
    rotate: "-1deg",
    status: "locked" as const,
  },
  {
    slug: "jungle-travaux",
    number: 4,
    emoji: "🌴",
    title: "La Jungle des travaux",
    teaser: "Décrypte un devis comme une exploratrice aguerrie",
    duration: "30 min",
    color: C.palm,
    rotate: "2deg",
    status: "locked" as const,
  },
  {
    slug: "peche-locataires",
    number: 5,
    emoji: "🎣",
    title: "La Pêche aux locataires",
    teaser: "Loue vite, loue bien, loue cher",
    duration: "25 min",
    color: C.flamingo,
    rotate: "-1.5deg",
    status: "locked" as const,
  },
];

export default function CahierPreviewPage() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [profile, setProfile] = useState<Profile | null>(null);

  return (
    <>
      <FontsAndStyles />
      <div className="min-h-screen relative overflow-x-hidden" style={{ background: C.sand }}>
        <PaperPattern />
        <PreviewToolbar
          screen={screen}
          onChange={setScreen}
          currentStep={currentStep}
          onChangeStep={setCurrentStep}
        />
        <div className="pt-24 relative">
          {screen === "landing" && <LandingScreen onStart={() => setScreen("etat-lieux")} />}
          {screen === "etat-lieux" && (
            <EtatLieuxScreen
              onComplete={(p) => {
                setProfile(p);
                setScreen("dashboard");
              }}
            />
          )}
          {screen === "dashboard" && <DashboardScreen profile={profile} />}
          {screen === "etape" && <EtapeScreen stepNum={currentStep} />}
          {screen === "coffre" && <CoffreScreen />}
          {screen === "emails" && <EmailsScreen />}
        </div>
      </div>
    </>
  );
}

function FontsAndStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Fraunces:ital,wght@0,400;0,600;0,700;1,500&family=Nunito:wght@400;600;700;800&display=swap");

      .font-hand { font-family: "Caveat", cursive; }
      .font-display { font-family: "Fraunces", serif; }
      .font-body { font-family: "Nunito", sans-serif; }

      @keyframes float-slow {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-12px) rotate(3deg); }
      }
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes wave {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(-20px); }
      }
      @keyframes wiggle {
        0%, 100% { transform: rotate(-2deg); }
        50% { transform: rotate(2deg); }
      }

      .animate-float { animation: float-slow 6s ease-in-out infinite; }
      .animate-spin-slow { animation: spin-slow 30s linear infinite; }
      .animate-wave { animation: wave 4s ease-in-out infinite; }
      .animate-wiggle { animation: wiggle 3s ease-in-out infinite; }

      .highlight-yellow {
        background: linear-gradient(180deg, transparent 55%, ${C.sun}88 55%, ${C.sun}88 90%, transparent 90%);
        padding: 0 4px;
      }
      .highlight-coral {
        background: linear-gradient(180deg, transparent 55%, ${C.flamingo}88 55%, ${C.flamingo}88 90%, transparent 90%);
        padding: 0 4px;
      }

      .shadow-doodle {
        box-shadow: 4px 4px 0 ${C.ink};
      }
      .shadow-doodle-lg {
        box-shadow: 6px 6px 0 ${C.ink};
      }

      .tape::before {
        content: "";
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%) rotate(-3deg);
        width: 80px;
        height: 22px;
        background: ${C.sun}cc;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .stamp {
        font-family: "Caveat", cursive;
        font-weight: 700;
        color: ${C.coral};
        border: 3px solid ${C.coral};
        padding: 4px 14px;
        display: inline-block;
        transform: rotate(-12deg);
        opacity: 0.85;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 1.1rem;
      }
    `}</style>
  );
}

function PaperPattern() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-30"
      style={{
        backgroundImage: `radial-gradient(${C.sandDark} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    />
  );
}

function PreviewToolbar({
  screen,
  onChange,
  currentStep,
  onChangeStep,
}: {
  screen: Screen;
  onChange: (s: Screen) => void;
  currentStep: number;
  onChangeStep: (n: number) => void;
}) {
  const tabs: { key: Screen; label: string }[] = [
    { key: "landing", label: "1. Landing" },
    { key: "etat-lieux", label: "2. État des lieux" },
    { key: "dashboard", label: "3. Dashboard" },
    { key: "etape", label: "4. Escale" },
    { key: "coffre", label: "5. Coffre" },
    { key: "emails", label: "6. Emails" },
  ];
  return (
    <div
      className="fixed top-0 inset-x-0 z-50 px-3 py-2 shadow-lg font-body"
      style={{ background: C.ink, color: "white" }}
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span
          className="font-hand text-lg mr-2 hidden sm:block"
          style={{ color: C.sun }}
        >
          Cahier 2026
        </span>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold transition-all"
            style={
              screen === t.key
                ? { background: C.sun, color: C.ink }
                : { background: "rgba(255,255,255,0.1)", color: "white" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {screen === "etape" && (
        <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-xs opacity-70">Escale :</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChangeStep(n)}
              className="w-7 h-7 rounded-full text-xs font-bold transition-all"
              style={
                currentStep === n
                  ? { background: C.coral, color: "white" }
                  : { background: "rgba(255,255,255,0.15)", color: "white" }
              }
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sun({ size = 100, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <g>
        <circle cx="50" cy="50" r="22" fill={C.sun} />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2="50"
              y2="14"
              stroke={C.sun}
              strokeWidth="4"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}
      </g>
    </svg>
  );
}

function Wave({ color = C.lagon, className = "" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 1200 80" className={className} preserveAspectRatio="none">
      <path
        d="M0,40 Q150,0 300,40 T600,40 T900,40 T1200,40 L1200,80 L0,80 Z"
        fill={color}
        opacity="0.3"
      />
      <path
        d="M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Squiggle({ color = C.coral, className = "" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 12" className={className}>
      <path
        d="M2,6 Q15,1 30,6 T60,6 T90,6 T120,6 T150,6 T180,6 T198,6"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Maison({ size = 80, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 100 105" className={className} style={style}>
      <polygon points="14,52 50,18 86,52" fill={C.coral} stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
      <rect x="22" y="52" width="56" height="42" fill={C.paper} stroke={C.ink} strokeWidth="3" />
      <rect x="42" y="68" width="16" height="26" fill={C.lagon} stroke={C.ink} strokeWidth="2.5" />
      <circle cx="55" cy="81" r="1.5" fill={C.ink} />
      <rect x="29" y="58" width="9" height="9" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <line x1="33.5" y1="58" x2="33.5" y2="67" stroke={C.ink} strokeWidth="1.2" />
      <line x1="29" y1="62.5" x2="38" y2="62.5" stroke={C.ink} strokeWidth="1.2" />
      <rect x="62" y="58" width="9" height="9" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <line x1="66.5" y1="58" x2="66.5" y2="67" stroke={C.ink} strokeWidth="1.2" />
      <line x1="62" y1="62.5" x2="71" y2="62.5" stroke={C.ink} strokeWidth="1.2" />
      <rect x="60" y="22" width="6" height="14" fill={C.coralDark} stroke={C.ink} strokeWidth="2" />
      <path d="M14,52 L86,52" stroke={C.ink} strokeWidth="3" />
    </svg>
  );
}

function Coffre({ size = 140, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 140 120" className={className} style={style}>
      <ellipse cx="70" cy="115" rx="60" ry="4" fill={C.ink} opacity="0.15" />
      <circle cx="32" cy="62" r="7" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <circle cx="46" cy="58" r="7" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <circle cx="100" cy="58" r="7" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <circle cx="112" cy="62" r="7" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <rect x="20" y="62" width="100" height="48" fill={C.coral} stroke={C.ink} strokeWidth="3" rx="4" />
      <path d="M20,62 Q70,30 120,62 L120,75 L20,75 Z" fill={C.coralDark} stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
      <rect x="60" y="68" width="20" height="20" fill={C.sun} stroke={C.ink} strokeWidth="2.5" rx="2" />
      <circle cx="70" cy="76" r="3" fill={C.ink} />
      <rect x="68" y="78" width="4" height="6" fill={C.ink} />
      <line x1="20" y1="90" x2="120" y2="90" stroke={C.ink} strokeWidth="2" />
      <line x1="20" y1="100" x2="120" y2="100" stroke={C.ink} strokeWidth="2" />
      <circle cx="62" cy="100" r="4" fill={C.sun} stroke={C.ink} strokeWidth="1.5" />
      <text x="62" y="103" fontSize="6" fontWeight="bold" textAnchor="middle" fill={C.ink}>€</text>
      <circle cx="78" cy="103" r="4" fill={C.sun} stroke={C.ink} strokeWidth="1.5" />
      <text x="78" y="106" fontSize="6" fontWeight="bold" textAnchor="middle" fill={C.ink}>€</text>
    </svg>
  );
}

function Cle({ size = 70, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size * 0.4} viewBox="0 0 100 40" className={className} style={style}>
      <circle cx="18" cy="20" r="13" fill="none" stroke={C.ink} strokeWidth="3" />
      <circle cx="18" cy="20" r="5" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <line x1="31" y1="20" x2="92" y2="20" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="20" x2="80" y2="30" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="20" x2="70" y2="27" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Marteau({ size = 60, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 60 75" className={className} style={style}>
      <rect x="24" y="32" width="12" height="40" fill={C.coral} stroke={C.ink} strokeWidth="2.5" rx="2" />
      <rect x="6" y="14" width="48" height="22" fill={C.inkSoft} stroke={C.ink} strokeWidth="3" rx="3" />
      <rect x="40" y="18" width="14" height="14" fill={C.ink} opacity="0.3" />
      <line x1="28" y1="40" x2="32" y2="40" stroke={C.ink} strokeWidth="1" />
      <line x1="28" y1="50" x2="32" y2="50" stroke={C.ink} strokeWidth="1" />
      <line x1="28" y1="60" x2="32" y2="60" stroke={C.ink} strokeWidth="1" />
    </svg>
  );
}

function Pinceau({ size = 50, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size * 0.4} height={size * 1.5} viewBox="0 0 30 110" className={className} style={style}>
      <rect x="11" y="55" width="8" height="50" fill={C.coral} stroke={C.ink} strokeWidth="2" rx="1" />
      <rect x="8" y="40" width="14" height="18" fill="#C0C0C0" stroke={C.ink} strokeWidth="2" />
      <path d="M5,18 L25,18 L21,40 L9,40 Z" fill={C.lagon} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9,18 L9,8 M14,18 L14,5 M19,18 L19,8" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="15" cy="105" rx="2" ry="0.6" fill={C.lagon} opacity="0.5" />
    </svg>
  );
}

function Calculette({ size = 60, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 60 75" className={className} style={style}>
      <rect x="4" y="4" width="52" height="67" fill={C.lagon} stroke={C.ink} strokeWidth="3" rx="5" />
      <rect x="10" y="10" width="40" height="14" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <text x="46" y="21" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="end" fill={C.ink}>1290€</text>
      <circle cx="16" cy="34" r="3" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <circle cx="30" cy="34" r="3" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <circle cx="44" cy="34" r="3" fill={C.coral} stroke={C.ink} strokeWidth="1.5" />
      <circle cx="16" cy="46" r="3" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <circle cx="30" cy="46" r="3" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <circle cx="44" cy="46" r="3" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <circle cx="16" cy="58" r="3" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <circle cx="30" cy="58" r="3" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <circle cx="44" cy="58" r="3" fill={C.sun} stroke={C.ink} strokeWidth="1.5" />
    </svg>
  );
}

function PanneauALouer({ size = 80, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" className={className} style={style}>
      <line x1="48" y1="55" x2="48" y2="105" stroke="#8B5A2B" strokeWidth="4" />
      <line x1="40" y1="105" x2="56" y2="105" stroke={C.ink} strokeWidth="2" />
      <g transform="rotate(-4 50 35)">
        <rect x="10" y="15" width="80" height="40" fill={C.sun} stroke={C.ink} strokeWidth="3" rx="3" />
        <text x="50" y="32" fontSize="11" fontFamily="Caveat, cursive" fontWeight="700" textAnchor="middle" fill={C.coral}>À LOUER</text>
        <text x="50" y="46" fontSize="6" fontFamily="Nunito, sans-serif" textAnchor="middle" fill={C.ink}>06 12 34 56 78</text>
      </g>
    </svg>
  );
}

function Tirelire({ size = 80, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 100 85" className={className} style={style}>
      <ellipse cx="50" cy="74" rx="38" ry="3" fill={C.ink} opacity="0.15" />
      <ellipse cx="50" cy="42" rx="36" ry="26" fill={C.flamingo} stroke={C.ink} strokeWidth="3" />
      <circle cx="78" cy="36" r="11" fill={C.flamingo} stroke={C.ink} strokeWidth="3" />
      <circle cx="80" cy="33" r="2" fill={C.ink} />
      <ellipse cx="84" cy="41" rx="2" ry="1.2" fill={C.coralDark} />
      <ellipse cx="88" cy="41" rx="2" ry="1.2" fill={C.coralDark} />
      <line x1="44" y1="18" x2="56" y2="18" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="64" x2="32" y2="74" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="44" y1="66" x2="44" y2="74" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="66" x2="58" y2="74" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="68" y1="64" x2="68" y2="74" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M14,38 q-4,-3 -2,-7" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="35" cy="14" r="4" fill={C.sun} stroke={C.ink} strokeWidth="1.5" />
      <text x="35" y="17" fontSize="5" fontWeight="bold" textAnchor="middle" fill={C.ink}>€</text>
    </svg>
  );
}

function PieceOr({ size = 28, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className={className} style={style}>
      <circle cx="14" cy="14" r="12" fill={C.sun} stroke={C.ink} strokeWidth="2" />
      <circle cx="14" cy="14" r="9" fill="none" stroke={C.ink} strokeWidth="1" opacity="0.4" />
      <text x="14" y="18" fontSize="11" fontWeight="bold" textAnchor="middle" fill={C.ink}>€</text>
    </svg>
  );
}

function MetreRuban({ size = 60, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" className={className} style={style}>
      <circle cx="30" cy="30" r="24" fill={C.sun} stroke={C.ink} strokeWidth="3" />
      <circle cx="30" cy="30" r="9" fill={C.coral} stroke={C.ink} strokeWidth="2" />
      <line x1="30" y1="30" x2="30" y2="6" stroke={C.ink} strokeWidth="1" />
      <line x1="30" y1="30" x2="48" y2="42" stroke={C.ink} strokeWidth="1" />
      <rect x="50" y="34" width="14" height="6" fill={C.lagon} stroke={C.ink} strokeWidth="2" />
      <line x1="55" y1="34" x2="55" y2="40" stroke={C.ink} strokeWidth="0.6" />
      <line x1="58" y1="34" x2="58" y2="38" stroke={C.ink} strokeWidth="0.6" />
      <line x1="61" y1="34" x2="61" y2="40" stroke={C.ink} strokeWidth="0.6" />
    </svg>
  );
}

function LandingScreen({ onStart }: { onStart?: () => void }) {
  function scrollToForm() {
    if (typeof document !== "undefined") {
      document.getElementById("form-cahier")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <main className="font-body" style={{ color: C.ink }}>

      {/* ============ HERO ============ */}
      <section className="relative pt-12 pb-32 px-4 overflow-hidden">
        <div className="absolute top-8 right-8 sm:right-16 animate-spin-slow">
          <Sun size={120} />
        </div>
        <div className="absolute top-32 left-4 sm:left-12 animate-float text-5xl sm:text-7xl">
          🌴
        </div>
        <div className="absolute bottom-20 right-12 animate-float text-4xl sm:text-6xl" style={{ animationDelay: "1s" }}>
          ⛵
        </div>
        <Maison size={70} className="absolute top-44 right-6 sm:right-32 animate-float opacity-90 hidden md:block" style={{ transform: "rotate(8deg)", animationDelay: "0.5s" }} />
        <Cle size={80} className="absolute bottom-44 left-2 sm:left-24 opacity-70 animate-wiggle hidden sm:block" style={{ transform: "rotate(-15deg)" }} />

        <div className="relative max-w-4xl mx-auto text-center pt-12">
          <p
            className="font-hand text-2xl sm:text-3xl mb-3"
            style={{ color: C.coral, transform: "rotate(-2deg)", display: "inline-block" }}
          >
            ☀️ Édition été 2026, ouverture mi-juin
          </p>

          <h1 className="font-display font-bold leading-[0.95] mb-6">
            <span className="block text-5xl sm:text-7xl lg:text-8xl" style={{ color: C.ink }}>
              Le Cahier
            </span>
            <span
              className="block font-hand text-6xl sm:text-8xl lg:text-9xl mt-2"
              style={{ color: C.coral, transform: "rotate(-3deg)" }}
            >
              de vacances
            </span>
            <span
              className="block text-3xl sm:text-5xl lg:text-6xl mt-3 italic"
              style={{ color: C.lagonDark }}
            >
              de l&apos;investisseur
            </span>
          </h1>

          <p className="text-lg sm:text-2xl max-w-2xl mx-auto mb-4 mt-8 font-body">
            En 5 semaines tu sors avec ton{" "}
            <span className="highlight-yellow font-bold">plan d&apos;achat immo prêt à signer à la rentrée</span>.
          </p>
          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10" style={{ color: C.inkSoft }}>
            5 escales courtes, 5 missions concrètes, 5 livrables que tu gardes. Pas de cours magistral, pas de blabla.
          </p>

          <FormulaireOptIn onStart={onStart} />

          <p className="text-sm mt-8 font-hand text-xl" style={{ color: C.inkSoft }}>
            ⬇ ⬇ Découvre ce qu&apos;il y a dedans
          </p>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none">
          <Wave color={C.lagon} className="w-full h-full" />
        </div>
      </section>

      {/* ============ BARRE DE PREUVE SOCIALE ============ */}
      <section className="py-12 px-6" style={{ background: C.ink, color: "white" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm uppercase tracking-widest mb-8" style={{ color: C.sun }}>
            Édition 2025 en chiffres
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-display text-5xl sm:text-6xl font-bold" style={{ color: C.sun }}>7 500</p>
              <p className="text-base mt-1">investisseurs ont suivi la 1ʳᵉ édition</p>
            </div>
            <div>
              <p className="font-display text-5xl sm:text-6xl font-bold" style={{ color: C.sun }}>92%</p>
              <p className="text-base mt-1">l&apos;ont terminée jusqu&apos;à la dernière escale</p>
            </div>
            <div>
              <p className="font-display text-5xl sm:text-6xl font-bold" style={{ color: C.sun }}>4,9/5</p>
              <p className="text-base mt-1">de satisfaction sur leur retour de rentrée</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ C'EST POUR TOI SI ============ */}
      <section className="py-20 px-6" style={{ background: C.sand }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-hand text-3xl mb-2" style={{ color: C.lagonDark }}>
              C&apos;est pour qui ⤵
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold">
              Ce cahier est fait pour toi{" "}
              <span className="font-hand" style={{ color: C.coral }}>si</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🌱",
                titre: "Tu n'as jamais investi",
                desc: "Tu veux te lancer mais tu sais pas par où commencer. Tu as peur de la banque, des travaux, de te planter. Le cahier te pose les bases dans le bon ordre.",
                color: C.lagon,
              },
              {
                emoji: "🏠",
                titre: "Tu as déjà 1 ou 2 biens",
                desc: "Tu sais que c'est possible mais tu sens que tu y vas au feeling. Tu veux passer du « j'ai eu de la chance » au « j'ai une méthode ». Le cahier structure ce que tu fais déjà.",
                color: C.coral,
              },
              {
                emoji: "🏘️",
                titre: "Tu as déjà 3 biens ou plus",
                desc: "Tu as un vrai parc. Le cahier va te servir d'audit estival : repérer tes angles morts, retravailler ce qui ronronne, préparer la suite (revente, optimisation, montée en gamme).",
                color: C.sun,
              },
            ].map((c) => (
              <div
                key={c.titre}
                className="p-6 transition-transform hover:-translate-y-2"
                style={{
                  background: C.paper,
                  border: `3px solid ${C.ink}`,
                  borderRadius: "16px",
                  boxShadow: `5px 5px 0 ${c.color}`,
                }}
              >
                <div className="text-5xl mb-3">{c.emoji}</div>
                <h3 className="font-display text-xl font-bold mb-2">{c.titre}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CE QU'IL Y A DEDANS (5 escales) ============ */}
      <section className="py-20 px-6" style={{ background: C.lagonLight + "20" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-hand text-3xl mb-2" style={{ color: C.coral }}>
              Au programme cet été
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold">
              5 escales pour signer ton bien{" "}
              <span className="highlight-yellow">à la rentrée</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto" style={{ color: C.inkSoft }}>
              Chaque escale dure 20 à 40 minutes. Tu peux la faire le matin sur la plage, le soir sur la terrasse, ou le dimanche à la maison.
            </p>
          </div>

          <div className="space-y-5">
            {STEPS.map((s, i) => {
              const promesses: Record<number, { promesse: string; livrable: string }> = {
                1: { promesse: "Tu repars avec ton objectif chiffré, ta deadline et ton plan d'effort hebdo.", livrable: "Post-it cap + carnet de bord PDF" },
                2: { promesse: "Tu repars avec un kit banque qui se présente tout seul devant 6 conseillers.", livrable: "Business plan 1 page + checklist 8 pièces + jeu Valise du banquier" },
                3: { promesse: "Tu sais lire une annonce en 30 secondes et repérer une pépite avant les autres.", livrable: "Grille 7 critères + jeu Coup de cœur piégé" },
                4: { promesse: "Tu décryptes un devis travaux comme un contrat, ligne par ligne, piège par piège.", livrable: "Checklist devis + jeu des 5 erreurs" },
                5: { promesse: "Tu écris une annonce qui attire les bons profils, et tu tries les dossiers sans te tromper.", livrable: "Template annonce + grille de tri + jeu Dossier mystère" },
              };
              const p = promesses[s.number];
              return (
                <div
                  key={s.slug}
                  className="flex items-stretch gap-4"
                  style={{ transform: `rotate(${i % 2 === 0 ? "-0.5" : "0.5"}deg)` }}
                >
                  <div
                    className="flex-shrink-0 w-20 sm:w-28 flex flex-col items-center justify-center"
                    style={{
                      background: s.color,
                      border: `3px solid ${C.ink}`,
                      borderRadius: "16px",
                      boxShadow: `4px 4px 0 ${C.ink}`,
                    }}
                  >
                    <div className="text-4xl sm:text-5xl">{s.emoji}</div>
                    <div className="font-hand text-2xl mt-1" style={{ color: C.ink }}>{s.number}</div>
                  </div>
                  <div
                    className="flex-1 p-5"
                    style={{
                      background: C.paper,
                      border: `3px solid ${C.ink}`,
                      borderRadius: "16px",
                      boxShadow: `4px 4px 0 ${s.color}`,
                    }}
                  >
                    <h3 className="font-display text-xl sm:text-2xl font-bold mb-1">
                      {s.title}
                    </h3>
                    <p className="text-sm sm:text-base mb-2 font-bold" style={{ color: C.ink }}>
                      → {p.promesse}
                    </p>
                    <p className="text-xs sm:text-sm" style={{ color: C.inkSoft }}>
                      📦 {p.livrable}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: "💌", titre: "10 emails", desc: "Suivi sur 5 semaines, écrit par moi" },
              { emoji: "🎮", titre: "4 jeux", desc: "Pour vérifier que tu as compris" },
              { emoji: "📔", titre: "Passeport", desc: "PDF imprimable de ton parcours" },
              { emoji: "🎁", titre: "Bonus", desc: "Vidéos, audios, templates Excel" },
            ].map((b) => (
              <div
                key={b.titre}
                className="p-4 text-center"
                style={{
                  background: C.paper,
                  border: `2px solid ${C.ink}`,
                  borderRadius: "14px",
                }}
              >
                <div className="text-3xl mb-1">{b.emoji}</div>
                <p className="font-bold text-sm">{b.titre}</p>
                <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={scrollToForm}
              className="font-bold px-8 py-3 transition-transform hover:-translate-y-1 inline-block"
              style={{
                background: C.coral,
                color: "white",
                border: `3px solid ${C.ink}`,
                borderRadius: "999px",
                boxShadow: `4px 4px 0 ${C.ink}`,
              }}
            >
              Je veux mon cahier 🏖️
            </button>
          </div>
        </div>
      </section>

      {/* ============ QUI EST EMELINE ============ */}
      <section className="py-20 px-6" style={{ background: C.flamingo + "15" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-2 text-center">
              <div
                className="relative inline-block"
                style={{
                  border: `4px solid ${C.ink}`,
                  borderRadius: "20px",
                  boxShadow: `8px 8px 0 ${C.coral}`,
                  overflow: "hidden",
                  transform: "rotate(-2deg)",
                  background: C.paper,
                  padding: "10px 10px 50px 10px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cahier/emeline-chantier.jpeg"
                  alt="Emeline Siron sur un chantier, perceuse à la main"
                  style={{
                    width: "100%",
                    maxWidth: "280px",
                    height: "auto",
                    display: "block",
                    borderRadius: "8px",
                  }}
                />
                <div
                  className="absolute bottom-3 left-0 right-0 font-hand text-2xl text-center"
                  style={{ color: C.ink }}
                >
                  Emeline, en chantier
                </div>
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 font-hand text-base"
                  style={{
                    background: C.sun,
                    color: C.ink,
                    border: `2px solid ${C.ink}`,
                    borderRadius: "999px",
                    transform: "rotate(-3deg)",
                  }}
                >
                  Été 2024
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <p className="font-hand text-3xl mb-2" style={{ color: C.coral }}>
                Coucou, c&apos;est moi 👋
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5">
                Qui a écrit ce cahier
              </h2>

              <p className="mb-3 leading-relaxed">
                Je m&apos;appelle <strong>Emeline Siron</strong>. J&apos;ai grandi dans un garage auto. Pas de patrimoine familial, pas de réseau, pas de capital de départ.
              </p>
              <p className="mb-3 leading-relaxed">
                Je suis diplômée en immobilier, j&apos;ai été Real Estate Asset Manager dans un fonds d&apos;investissement immobilier en Europe. En parallèle de ce job, j&apos;ai investi pour moi.
              </p>
              <p className="mb-5 leading-relaxed">
                9 ans plus tard, j&apos;ai{" "}
                <span className="highlight-yellow font-bold">55 locataires</span>, j&apos;accompagne des centaines d&apos;investisseurs, et j&apos;ai construit ma méthode brique par brique.
              </p>
              <p className="font-hand text-2xl" style={{ color: C.coral }}>
                Si j&apos;ai pu le faire, toi aussi.
              </p>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="p-3 text-center" style={{ background: C.paper, border: `2px solid ${C.ink}`, borderRadius: "12px" }}>
                  <p className="font-display text-3xl font-bold" style={{ color: C.coral }}>55</p>
                  <p className="text-xs">locataires</p>
                </div>
                <div className="p-3 text-center" style={{ background: C.paper, border: `2px solid ${C.ink}`, borderRadius: "12px" }}>
                  <p className="font-display text-3xl font-bold" style={{ color: C.lagonDark }}>9 ans</p>
                  <p className="text-xs">de terrain</p>
                </div>
                <div className="p-3 text-center" style={{ background: C.paper, border: `2px solid ${C.ink}`, borderRadius: "12px" }}>
                  <p className="font-display text-3xl font-bold" style={{ color: C.palm }}>26K</p>
                  <p className="text-xs">à la newsletter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MES ENGAGEMENTS (positionnement positif) ============ */}
      <section className="py-20 px-6" style={{ background: C.sun + "20" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-hand text-3xl mb-2" style={{ color: C.lagonDark }}>
              Mes engagements pour cet été
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold">
              Ce que tu vas <span className="highlight-coral italic">vraiment</span> avoir
            </h2>
            <p className="mt-4 max-w-2xl mx-auto" style={{ color: C.inkSoft }}>
              Le cahier est un cadeau. Pas un teaser, pas un appât. Voici ce que je m&apos;engage à te donner, en clair.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                emoji: "🎯",
                titre: "Du concret, pas de la théorie",
                desc: "Chaque escale produit un livrable que tu gardes : un post-it, un kit banque, une grille d'analyse, une annonce. Tu ressors avec des outils, pas avec des notes de cours.",
                color: C.coral,
              },
              {
                emoji: "🌍",
                titre: "Une méthode terrain, pas magique",
                desc: "9 ans de pratique, 55 biens à mon nom, zéro Lambo louée à la journée. Je te montre ce qui marche pour moi et pour les 7 500 personnes qui ont suivi l'an dernier.",
                color: C.lagon,
              },
              {
                emoji: "💌",
                titre: "Un suivi par mail, sans harcèlement",
                desc: "Je t'écris tous les 2 à 3 jours pendant 5 semaines. Si tu décroches, je te tends une corde. Si c'est pas le bon moment, tu me le dis et je te libère du suivi, zéro jugement.",
                color: C.flamingo,
              },
              {
                emoji: "🤝",
                titre: "Ton choix à la rentrée",
                desc: "À la fin du cahier, je te propose 2 options pour continuer si tu veux : la communauté ES Family (29 €/mois) ou l'accompagnement complet ES Academy. Mais le cahier reste utile en lui-même, sans rien acheter.",
                color: C.sun,
              },
            ].map((b, i) => (
              <div
                key={b.titre}
                className="p-6"
                style={{
                  background: C.paper,
                  border: `3px solid ${C.ink}`,
                  borderRadius: "16px",
                  boxShadow: `5px 5px 0 ${b.color}`,
                  transform: `rotate(${i % 2 === 0 ? "-0.5" : "0.5"}deg)`,
                }}
              >
                <div className="text-4xl mb-3">{b.emoji}</div>
                <h3 className="font-display text-xl font-bold mb-2">{b.titre}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TÉMOIGNAGES ============ */}
      <section className="py-20 px-6" style={{ background: C.sand }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-hand text-3xl mb-2" style={{ color: C.lagonDark }}>
              Ce qu&apos;ils disent
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold">
              Les retours de la <span className="highlight-yellow">1ʳᵉ édition</span>
            </h2>
            <p className="text-xs italic mt-3" style={{ color: C.inkSoft }}>
              3 témoignages placeholders à remplacer par 3 vrais alumnis 2025
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { nom: "Marine, 32 ans", lieu: "Lyon", profil: "1ᵉʳ achat à la rentrée 2025", quote: "J'ai signé mon T2 à Villeurbanne en septembre. Sans le cahier, j'aurais encore hésité 6 mois. Le truc qui a tout changé : la grille des 7 critères. Je ne visite plus rien sans elle.", emoji: "🏠" },
              { nom: "Karim, 38 ans", lieu: "Lille", profil: "2ᵉ bien après l'été", quote: "Je suivais déjà Emeline depuis 2 ans. Le cahier a été un déclic : j'ai monté un kit banque comme elle le dit, j'ai eu 4 oui sur 6 dossiers. Avant je galérais à en avoir un.", emoji: "🏦" },
              { nom: "Sophie, 41 ans", lieu: "Bordeaux", profil: "Pas encore acheté, mais cap clair", quote: "Je n'ai pas encore signé, mais je sais EXACTEMENT ce que je vais faire à la rentrée. Le post-it sur mon frigo me regarde tous les matins. C'est déjà énorme.", emoji: "📍" },
            ].map((t, i) => (
              <div
                key={t.nom}
                className="p-6"
                style={{
                  background: C.paper,
                  border: `3px solid ${C.ink}`,
                  borderRadius: "16px",
                  boxShadow: `5px 5px 0 ${[C.coral, C.lagon, C.flamingo][i]}`,
                  transform: `rotate(${[-1, 0.5, -0.5][i]}deg)`,
                }}
              >
                <div className="text-3xl mb-3">{t.emoji}</div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: C.ink }}>
                  « {t.quote} »
                </p>
                <div className="pt-3" style={{ borderTop: `1px solid ${C.sandDark}` }}>
                  <p className="font-bold text-sm">{t.nom}</p>
                  <p className="text-xs" style={{ color: C.inkSoft }}>{t.lieu} · {t.profil}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-20 px-6" style={{ background: C.lagonLight + "20" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-hand text-3xl mb-2" style={{ color: C.coral }}>
              Tu hésites ?
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold">
              Tes questions, mes réponses
            </h2>
          </div>

          <FAQList />
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-20 px-6 relative overflow-hidden" style={{ background: C.ink }}>
        <div className="absolute top-4 right-4 animate-spin-slow opacity-30">
          <Sun size={140} />
        </div>
        <div className="absolute bottom-4 left-8 text-6xl opacity-30 animate-float">🌴</div>

        <div className="max-w-3xl mx-auto text-center relative">
          <p className="font-hand text-3xl mb-2" style={{ color: C.sun }}>
            Allez, on largue les amarres
          </p>
          <h2 className="font-display text-4xl sm:text-6xl font-bold text-white mb-4 leading-tight">
            Cet été tu{" "}
            <span style={{ color: C.sun }}>avances</span>,{" "}
            ou tu attends encore ?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Le cahier ouvre mi-juin. Inscris-toi maintenant pour recevoir l&apos;accès dès le jour 1.
          </p>
          <button
            onClick={scrollToForm}
            className="font-bold px-10 py-5 text-lg sm:text-xl transition-transform hover:-translate-y-1 inline-block"
            style={{
              background: C.coral,
              color: "white",
              border: `3px solid white`,
              borderRadius: "999px",
              boxShadow: `5px 5px 0 ${C.sun}`,
            }}
          >
            Je récupère mon cahier 🏖️
          </button>
          <p className="text-sm text-white/60 mt-6">
            Gratuit · Sans engagement · 7 500 inscrits l&apos;an dernier
          </p>
        </div>
      </section>
    </main>
  );
}

function FormulaireOptIn({ onStart }: { onStart?: () => void }) {
  return (
    <div
      id="form-cahier"
      className="max-w-md mx-auto p-7 relative"
      style={{
        background: C.paper,
        border: `3px solid ${C.ink}`,
        borderRadius: "20px",
        transform: "rotate(-1deg)",
      }}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 font-hand text-xl whitespace-nowrap" style={{ background: C.sun, color: C.ink, transform: "rotate(2deg)" }}>
        Embarquement gratuit ↓
      </div>
      <form className="flex flex-col gap-3 mt-4">
        <input
          type="text"
          placeholder="Ton prénom"
          required
          className="px-4 py-3 rounded-xl outline-none font-body text-lg"
          style={{ background: C.sand, border: `2px solid ${C.ink}30` }}
        />
        <input
          type="email"
          placeholder="Ton email"
          required
          className="px-4 py-3 rounded-xl outline-none font-body text-lg"
          style={{ background: C.sand, border: `2px solid ${C.ink}30` }}
        />
        <input
          type="tel"
          placeholder="Ton numéro de téléphone"
          required
          className="px-4 py-3 rounded-xl outline-none font-body text-lg"
          style={{ background: C.sand, border: `2px solid ${C.ink}30` }}
        />
        <p className="text-xs text-left -mt-1 px-1" style={{ color: C.inkSoft }}>
          Ton numéro sert à ce qu&apos;Antony, de mon équipe, puisse te rappeler en septembre si tu veux qu&apos;on en parle. Zéro spam, zéro relance commerciale agressive, promesse.
        </p>
        <button
          type="button"
          onClick={() => onStart?.()}
          className="font-bold py-4 rounded-xl text-lg transition-transform hover:-translate-y-1 shadow-doodle mt-1"
          style={{ background: C.coral, color: "white", border: `3px solid ${C.ink}` }}
        >
          Je récupère mon cahier 🏖️
        </button>
        <p className="text-xs text-center mt-1" style={{ color: C.inkSoft }}>
          Gratuit · Sans engagement · Accès en 30 secondes
        </p>
      </form>
    </div>
  );
}

const FAQ_DATA = [
  {
    q: "Combien de temps ça me prend par semaine ?",
    a: "20 à 40 minutes par escale, soit 1 à 2h par semaine pendant 5 semaines. Pensé pour être fait sur la terrasse, à la plage, ou le dimanche matin. Si tu décroches une semaine, tu reprends sans rattrapage.",
  },
  {
    q: "Je n'ai jamais investi, c'est trop tôt pour moi ?",
    a: "Au contraire. C'est exactement le moment idéal. Le cahier te pose les bases dans le bon ordre, sans présupposer que tu connais quoi que ce soit. À la fin de l'été tu sauras si l'immo est pour toi, et si oui par où démarrer.",
  },
  {
    q: "C'est gratuit, où est le piège ?",
    a: "Pas de piège. Mon objectif : te donner une vraie ressource utile. À la fin du cahier, je te propose 2 voies pour continuer (communauté à 29 €/mois ou accompagnement complet). Tu choisis ce qui te va, ou rien du tout, et on garde le contact.",
  },
  {
    q: "Et si je décroche en cours de route ?",
    a: "Je te relance par mail. Pas en mode harcèlement, en mode capitaine qui te tend une corde. Et si vraiment c'est pas le bon moment, tu me le dis, je te libère du suivi sans souci.",
  },
  {
    q: "Quelle différence avec une formation payante ?",
    a: "Le cahier, c'est gratuit, court, ludique, fait pour ton été. 92% des inscrits 2025 l'ont terminé. Si tu veux ensuite aller plus loin avec un suivi rapproché, je propose ES Academy à la rentrée, mais c'est ton choix. Le cahier reste utile en lui-même.",
  },
  {
    q: "Est-ce que je peux le faire en couple, avec un ami, mon frère ?",
    a: "Oui, c'est même mieux. Une inscription par email pour suivre l'avancée individuelle, mais vous pouvez faire les missions et les jeux à plusieurs. Souvent ça crée des conversations qui débloquent.",
  },
];

function FAQList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {FAQ_DATA.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              background: C.paper,
              border: `2px solid ${C.ink}`,
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 p-4 text-left"
            >
              <span className="font-bold text-base sm:text-lg">{item.q}</span>
              <span className="text-2xl flex-shrink-0" style={{ color: C.coral }}>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm sm:text-base leading-relaxed" style={{ color: C.inkSoft }}>
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DashboardScreen({ profile }: { profile: Profile | null }) {
  const progress = 1;
  const total = STEPS.length;
  const pct = Math.round((progress / total) * 100);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 font-body relative" style={{ color: C.ink }}>
      <div className="absolute top-0 right-4 animate-spin-slow opacity-60">
        <Sun size={70} />
      </div>
      <Tirelire size={70} className="absolute top-20 right-20 opacity-80 animate-float hidden md:block" style={{ transform: "rotate(-6deg)" }} />
      <Marteau size={45} className="absolute top-2 right-32 opacity-30 hidden md:block" style={{ transform: "rotate(20deg)" }} />

      <header className="mb-10 max-w-2xl">
        <p className="font-hand text-3xl mb-1" style={{ color: C.coral }}>
          Salut {profile ? "l'exploratrice" : "toi"} 🌺
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight" style={{ color: C.ink }}>
          Voici{" "}
          <span className="highlight-yellow">ta carte</span>{" "}
          <span className="font-hand" style={{ color: C.lagonDark }}>
            d&apos;expédition
          </span>
        </h1>

        <div
          className="mt-7 p-5 relative"
          style={{
            background: C.paper,
            border: `3px solid ${C.ink}`,
            borderRadius: "16px",
            boxShadow: `5px 5px 0 ${C.lagon}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-base">
              {progress} escale validée sur {total}
            </span>
            <span className="font-hand text-3xl" style={{ color: C.coral }}>
              {pct}%
            </span>
          </div>
          <div
            className="h-4 rounded-full overflow-hidden"
            style={{ background: C.sandDark }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${C.coral}, ${C.sun})` }}
            />
          </div>
          <p className="text-sm mt-3 font-hand text-xl" style={{ color: C.inkSoft }}>
            ⛵ Cap sur la Plage des finances · 30 min
          </p>
        </div>
      </header>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-2xl font-bold" style={{ color: C.ink }}>
            Tes 5 escales
          </h2>
          <Squiggle className="w-24 h-3" />
        </div>

        <div className="space-y-5">
          {STEPS.map((s, i) => (
            <PolaroidStep key={s.slug} step={s} index={i} />
          ))}
        </div>
      </section>

      <section
        className="mt-14 p-8 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${C.coral} 0%, ${C.flamingo} 100%)`,
          borderRadius: "24px",
          border: `3px solid ${C.ink}`,
          boxShadow: `6px 6px 0 ${C.ink}`,
        }}
      >
        <div className="absolute top-2 right-4 text-5xl animate-wiggle">🏆</div>
        <div className="absolute bottom-2 left-4 text-4xl">🌺</div>
        <Coffre size={90} className="absolute -bottom-4 right-10 opacity-80 hidden sm:block" style={{ transform: "rotate(-4deg)" }} />
        <p className="font-hand text-2xl mb-1 text-white">
          Au bout des 5 escales
        </p>
        <h3 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
          Tu débloques le Coffre au trésor
        </h3>
        <p className="text-white/90 max-w-md mx-auto">
          Une offre rentrée + ton passeport d&apos;investisseur 2026 prêt à imprimer.
        </p>
      </section>
    </main>
  );
}

function PolaroidStep({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const isDone = step.status === "done";
  const isCurrent = step.status === "current";
  const isLocked = step.status === "locked";

  return (
    <div
      className="flex items-stretch gap-4 transition-transform hover:-translate-y-1"
      style={{ transform: `rotate(${step.rotate})` }}
    >
      <div
        className="relative flex-shrink-0 p-3 pb-12 hidden sm:block"
        style={{
          background: C.paper,
          border: `2px solid ${C.ink}`,
          boxShadow: `4px 4px 0 ${C.ink}`,
          width: "120px",
        }}
      >
        <div
          className="w-full aspect-square flex items-center justify-center text-6xl"
          style={{ background: step.color + "40" }}
        >
          {step.emoji}
        </div>
        <div
          className="absolute bottom-2 left-0 right-0 text-center font-hand text-xl"
          style={{ color: C.ink }}
        >
          étape {step.number}
        </div>
        {isDone && (
          <div className="absolute -top-3 -right-3">
            <span className="stamp" style={{ background: C.paper }}>✓ Validé</span>
          </div>
        )}
      </div>

      <div
        className={`flex-1 p-5 ${isLocked ? "opacity-60" : ""}`}
        style={{
          background: isCurrent ? C.sunLight : C.paper,
          border: `3px solid ${C.ink}`,
          borderRadius: "16px",
          boxShadow: `4px 4px 0 ${step.color}`,
        }}
      >
        <div className="flex items-center gap-2 mb-2 sm:hidden">
          <span className="text-3xl">{step.emoji}</span>
          <span className="font-hand text-xl" style={{ color: C.coral }}>
            étape {step.number}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-display text-xl sm:text-2xl font-bold" style={{ color: C.ink }}>
            {step.title}
          </h3>
          {isCurrent && (
            <span
              className="font-hand text-base px-3 py-0.5 flex-shrink-0"
              style={{ background: C.coral, color: "white", borderRadius: "999px" }}
            >
              en cours →
            </span>
          )}
          {isLocked && (
            <span className="text-2xl flex-shrink-0">🔒</span>
          )}
        </div>
        <p className="text-base mb-3" style={{ color: C.inkSoft }}>
          {step.teaser}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-hand text-lg" style={{ color: C.inkSoft }}>
            ⏱ {step.duration}
          </span>
          <button
            disabled={isLocked}
            className="font-bold px-5 py-2 transition-transform hover:-translate-y-0.5"
            style={{
              background: isDone ? C.lagon : isCurrent ? C.coral : C.sandDark,
              color: isLocked ? C.inkSoft : "white",
              border: `2px solid ${C.ink}`,
              borderRadius: "999px",
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            {isDone ? "Revoir" : isCurrent ? "Embarquer →" : "Bientôt"}
          </button>
        </div>
      </div>
    </div>
  );
}

type QuizQ = {
  id: number;
  q: string;
  options: { v: string; text: string; emoji: string }[];
  correct: string;
  explain: string;
};

type LettreData = {
  emoji: string;
  titleMain: string;
  titleAccent: string;
  subtitle: string;
  intro: string[];
  missionTitle: string;
  missionIntro: string;
  missionSteps: { title: string; body: string }[];
  quiz: QuizQ[];
  game: "valise" | "coup-de-coeur" | "cinq-erreurs" | "dossier-mystere" | null;
  bonus: { icon: string; title: string; desc: string }[];
  ps: string;
};

const LETTRES: Record<number, LettreData> = {
  1: {
    emoji: "⚓",
    titleMain: "Le",
    titleAccent: "Port",
    subtitle: "des objectifs",
    intro: [
      "J'écris ça à 6h12. Mon mari dort, mon fils aussi. Je repense à il y a 9 ans, à la même heure, dans la cuisine au-dessus du garage de mon père. Je comptais ce que je gagnais (1 280 € net), et ce que je voulais gagner (réponse : je savais pas).",
      "C'est exactement ça qui m'a fait perdre 3 ans.",
      "Je voulais \"investir dans l'immo\". Comme tout le monde. Sans chiffre, sans deadline, sans honnêteté. Résultat : 60 biens visités en 3 ans. Zéro acheté.",
      "Le jour où j'ai collé sur mon frigo « 1 appart qui s'autofinance, signé avant fin d'année », j'ai signé 4 mois plus tard. Un T2 moche à Mulhouse à 78 K€. Mais j'avais un cap. Et un cap, ça fait avancer.",
      "Aujourd'hui c'est ton tour. 15 minutes, pas plus.",
    ],
    missionTitle: "Ta mission, 3 actions ce soir",
    missionIntro: "Tu vas pas répondre à un quiz. Tu vas faire 3 trucs concrets, dans le réel, avant de te coucher.",
    missionSteps: [
      { title: "1) Le post-it", body: "Trois lignes, format libre : ton objectif (1 bien qui s'autofinance ? 3 biens en 5 ans ? 1ʳᵉ signature avant Noël ?), ton effort par semaine, ta deadline précise. Colle-le où tu le verras chaque matin." },
      { title: "2) Le message", body: "À UNE personne qui te porte (pas celui qui va dire « fais gaffe »). Texte exact : « Cet été je me lance sur l'immo. Mon objectif : [ton post-it]. T'es la 1ʳᵉ personne à qui je le dis. Note la date. »" },
      { title: "3) Le passeport", body: "Recopie tes 3 lignes dans ton passeport (dans ton dashboard). À chaque escale tu reviens vérifier que tu tiens le cap." },
    ],
    quiz: [
      {
        id: 1,
        q: "Annonce : T2, 65 m², centre moyen, 95 K€, loué 580 €/mois. Tu fais quoi ?",
        options: [
          { v: "a", text: "Je l'envoie à mon banquier ce soir, ça sent bon", emoji: "😍" },
          { v: "b", text: "Je calcule la rentabilité brute, si > 7% je creuse", emoji: "🤔" },
          { v: "c", text: "Je calcule l'autofinancement avec MES taux et MON apport, le brut me dit rien", emoji: "✅" },
        ],
        correct: "c",
        explain: "La rentabilité brute, c'est l'arnaque préférée des vendeurs de formations. Ce qui compte pour toi : est-ce que ce bien paie SES traites avec SES loyers, dans TA situation ? La méthode Emeline SIRON tape direct sur l'autofinancement.",
      },
      {
        id: 2,
        q: "T'as 12 K€ d'épargne, tu vises un bien à 100 K€. Tu te lances quand ?",
        options: [
          { v: "a", text: "Maintenant, on n'a qu'une vie", emoji: "🚀" },
          { v: "b", text: "Quand j'aurai 20 K€ (les fameux 20% d'apport)", emoji: "💸" },
          { v: "c", text: "Maintenant, mais je garde 4 K€ de matelas et je négocie un 110%", emoji: "✅" },
        ],
        correct: "c",
        explain: "Les 20% d'apport, c'est pour rassurer ta belle-mère. Une banque qui croit à ton dossier finance à 110%. Garde du cash pour les emmerdes (il y en aura), négocie le reste.",
      },
      {
        id: 3,
        q: "Ton banquier te dit « votre projet n'est pas viable ». Ta réponse intérieure :",
        options: [
          { v: "a", text: "Bon, je laisse tomber", emoji: "😵" },
          { v: "b", text: "C'est lui qui se plante, je vais lui prouver", emoji: "😤" },
          { v: "c", text: "Qu'est-ce qu'il a vu que je n'ai pas vu ? Et qu'est-ce que la banque d'à côté pourrait penser ?", emoji: "✅" },
        ],
        correct: "c",
        explain: "Un banquier qui dit non te donne une info précieuse sans s'en rendre compte. Demande-lui « qu'est-ce qui vous gêne précisément ? ». Note. Va voir 5 autres banques. Le 6ᵉ oui paie ta liberté.",
      },
    ],
    game: null,
    bonus: [
      { icon: "🎥", title: "Vidéo", desc: "« Pourquoi je veux investir, comment trouver ton vrai pourquoi » (réutilisée 2025, 8 min)" },
      { icon: "📎", title: "Téléchargement", desc: "Modèle de post-it imprimable A6" },
      { icon: "🎧", title: "Audio", desc: "« Le post-it qui m'a sauvée » (4 min, pour ta marche du soir)" },
    ],
    ps: "Si tu as envoyé ton message et qu'on t'a répondu, fais-en une capture et envoie-la-moi en réponse au prochain mail. Je veux les voir.",
  },
  2: {
    emoji: "🏖️",
    titleMain: "La",
    titleAccent: "Plage",
    subtitle: "des finances",
    intro: [
      "Je vais te raconter ma pire humiliation d'investisseuse.",
      "En 2017, je rentre dans ma banque à Mulhouse avec un dossier que je trouvais béton. T2 à 78 K€, rentabilité brute 9%, zéro crédit conso. Je m'assois face au conseiller avec un sourire de gagnante.",
      "Il regarde mon dossier 4 minutes. Me regarde. Me dit : « Madame Siron, votre projet n'est pas viable. Vous n'êtes pas dans la bonne catégorie de clientèle. »",
      "Je suis sortie. J'ai pleuré dans la voiture. Et pendant 3 semaines j'ai cru que c'était mort.",
      "Et puis j'ai fait ce que j'aurais dû faire direct : j'ai envoyé mon dossier à 6 banques le même jour. La 4ᵉ a dit oui. À 110% de financement. Taux négocié. La banque qui m'avait humiliée ? Je ne leur ai jamais redonné un euro.",
      "Aujourd'hui je vais t'apprendre à présenter un dossier tellement bon que 4 banques sur 6 diront oui.",
    ],
    missionTitle: "Ta mission, monter ta valise banquier",
    missionIntro: "Ton dossier bancaire, c'est pas de l'administratif. C'est un pitch. On va le structurer ensemble.",
    missionSteps: [
      { title: "1) Rassemble 6 pièces", body: "3 derniers bulletins de salaire, 3 derniers relevés bancaires, avis d'imposition, tableau d'amortissement de tes crédits en cours, pièce d'identité, justificatif de domicile. Scan-les dans un dossier nommé « Kit Banque »." },
      { title: "2) Écris ton business plan 1 page", body: "Prix du bien, apport, mensualité, loyer projeté, charges, autofinancement. Modèle dans le téléchargement bonus." },
      { title: "3) Liste 6 banques à attaquer", body: "Ta banque actuelle + 5 autres. Inclus au moins 1 banque en ligne (Boursorama, Fortuneo) et 1 mutualiste (Crédit Mutuel, Banque Populaire). Un courtier en parallèle." },
    ],
    quiz: [
      {
        id: 1,
        q: "Tu prépares ta simulation de crédit. Tu calcules l'autofinancement avec quel taux ?",
        options: [
          { v: "a", text: "Le meilleur taux du marché (genre 3,2%)", emoji: "🌈" },
          { v: "b", text: "Le taux moyen actuel + 0,5 point de sécurité", emoji: "✅" },
          { v: "c", text: "Le dernier taux que t'as lu sur Meilleurtaux en janvier", emoji: "📆" },
        ],
        correct: "b",
        explain: "Tu te montes un projet pour dormir. Si ton projet tient avec un taux + 0,5 point, tu es tranquille même si les taux remontent. Calculer avec le meilleur taux, c'est se tirer une balle dans le pied.",
      },
      {
        id: 2,
        q: "Le banquier te demande « pourquoi l'immobilier et pas la bourse ? ». Tu réponds :",
        options: [
          { v: "a", text: "Parce que la pierre c'est solide, on ne peut pas me la voler", emoji: "🧱" },
          { v: "b", text: "Parce que c'est le seul investissement qu'une banque accepte de financer à crédit avec effet de levier", emoji: "✅" },
          { v: "c", text: "Parce que j'ai suivi une formation et c'est ce qu'on m'a conseillé", emoji: "📚" },
        ],
        correct: "b",
        explain: "Le banquier veut entendre un investisseur qui pense. L'effet de levier, c'est LE mot qui prouve que tu as compris pourquoi l'immo, et pas autre chose. Ça te place comme partenaire de banque, pas comme client.",
      },
      {
        id: 3,
        q: "Entre un courtier et aller en direct, tu fais quoi ?",
        options: [
          { v: "a", text: "Courtier uniquement, il fait le boulot à ma place", emoji: "💼" },
          { v: "b", text: "Direct uniquement, je veux pas de frais de courtage", emoji: "💰" },
          { v: "c", text: "Les deux en parallèle, je compare et je prends la meilleure offre", emoji: "✅" },
        ],
        correct: "c",
        explain: "Le courtier te donne accès à des banques qui ne te recevraient pas. Ton tour en direct te donne du pouvoir de négociation. Fais les deux. Le courtier n'est payé que si ça signe avec lui, donc zéro risque.",
      },
    ],
    game: "valise",
    bonus: [
      { icon: "📄", title: "Template", desc: "Business plan 1 page à remplir" },
      { icon: "📋", title: "Checklist", desc: "Kit banque complet, 8 pièces à rassembler" },
      { icon: "🎥", title: "Vidéo", desc: "« Comment je parle à mon banquier » (réutilisée 2025, 12 min)" },
    ],
    ps: "Si ta banque actuelle te dit non, ne le vis pas comme un rejet personnel. Vis-le comme une info : c'est pas ton partenaire, suivant. Et écris-moi pour me le raconter, j'adore ces histoires.",
  },
  3: {
    emoji: "🗺️",
    titleMain: "La",
    titleAccent: "Chasse",
    subtitle: "aux pépites",
    intro: [
      "Mon premier bien, celui qui a tout changé, j'ai failli le laisser passer.",
      "C'était fin 2017. Un T2 à Mulhouse, 78 K€, secteur moyen mais pas pourri. Annonce moche, photos floues, description en 4 lignes. Tout le monde passait à côté.",
      "Moi j'y suis allée par lassitude, après 58 autres visites inutiles. J'arrive. Appartement vide, repeint à l'arrache, cuisine des années 80. Sur le papier : rien.",
      "Mais la copro était saine (AG régulières, zéro procédure), la chaudière était neuve (2 ans), et le métro passait à 6 min à pied. J'ai signé 3 jours plus tard, à 72 K€ après négo.",
      "6 ans après il est loué 620 €/mois, il s'autofinance largement, et il vaut 110 K€.",
      "Ce qui m'a fait dire oui ce jour-là : j'avais une grille de lecture. Pas un coup de cœur, pas une intuition. Une grille. Et je vais te la donner.",
    ],
    missionTitle: "Ta mission, analyser 5 annonces à ta grille",
    missionIntro: "Ouvre Leboncoin ou SeLoger. Trouve 5 annonces dans ta zone. Remplis la grille Emeline pour chacune.",
    missionSteps: [
      { title: "1) La grille 7 critères", body: "Prix / surface / loyer projeté / charges copro / travaux visibles / DPE / distance transports. Télécharge la grille en bonus, elle se remplit en 5 minutes par bien." },
      { title: "2) Les 3 filtres Emeline", body: "Copro saine (demande le PV de la dernière AG avant de visiter), chaudière / toiture / façade en bon état (sinon provisions), emplacement vivant (commerces, transports, écoles)." },
      { title: "3) Le verdict", body: "5 annonces analysées, tu barres 3, tu gardes 2. Sur les 2, tu appelles le propriétaire aujourd'hui pour visiter cette semaine." },
    ],
    quiz: [
      {
        id: 1,
        q: "Une annonce affiche « DPE F, travaux à prévoir ». Ta réaction :",
        options: [
          { v: "a", text: "Je passe, c'est interdit de louer en F bientôt", emoji: "🚫" },
          { v: "b", text: "Je visite quand même en sachant que je négocierai le prix des travaux de rénovation énergétique", emoji: "✅" },
          { v: "c", text: "Je fonce, ça veut dire décote donc opportunité", emoji: "🎯" },
        ],
        correct: "b",
        explain: "Un DPE F est effectivement un problème (location interdite à terme), mais c'est aussi un levier de négociation colossal. Si tu peux chiffrer les travaux et les négocier sur le prix, tu achètes à -20% en moyenne. Ce qu'il ne faut pas faire : ignorer (piège) ou foncer (risque).",
      },
      {
        id: 2,
        q: "Tu visites, le vendeur dit « des charges de copro de 180 €/mois ». Tu fais quoi ?",
        options: [
          { v: "a", text: "Je note dans mon calcul et je continue la visite", emoji: "📝" },
          { v: "b", text: "Je demande les 3 derniers PV d'AG avant de me décider", emoji: "✅" },
          { v: "c", text: "Je négocie le prix de 5 K€ en compensation", emoji: "💰" },
        ],
        correct: "b",
        explain: "180 €/mois de charges, c'est énorme. Avant de négocier, tu veux savoir POURQUOI. Ravalement voté ? Ascenseur HS ? Contentieux en cours ? Les PV d'AG te disent tout. C'est la pièce n°1 du dossier avant même la visite.",
      },
      {
        id: 3,
        q: "Un bien coche 5 de tes 7 critères. Tu fais quoi ?",
        options: [
          { v: "a", text: "Je signe, 5/7 c'est déjà bien", emoji: "✅" },
          { v: "b", text: "Je laisse tomber, il en faut 7/7", emoji: "😤" },
          { v: "c", text: "Je regarde quels 2 manquent et je décide si c'est rédhibitoire ou négociable", emoji: "🧐" },
        ],
        correct: "c",
        explain: "Un bien 7/7 n'existe pas. L'enjeu c'est de savoir lequels des 2 manquants tu peux vivre avec (mauvais DPE = tu rénoves) ou pas (copro en contentieux = tu fuis). Grille Emeline = outil de décision, pas check-list absolue.",
      },
    ],
    game: "coup-de-coeur",
    bonus: [
      { icon: "📊", title: "Grille", desc: "Ma grille 7 critères au format Excel + PDF imprimable" },
      { icon: "🎥", title: "Vidéo", desc: "« Comment je lis une annonce en 30 secondes » (réutilisée 2025, 9 min)" },
      { icon: "📍", title: "Carte", desc: "Les 10 zones françaises que je regarde en priorité en 2026" },
    ],
    ps: "Quand tu auras visité ton 1ᵉʳ bien avec ma grille, envoie-moi l'analyse. Je te dis si tu fonces ou si tu passes, en 24h.",
  },
  4: {
    emoji: "🌴",
    titleMain: "La",
    titleAccent: "Jungle",
    subtitle: "des travaux",
    intro: [
      "Mon 3ᵉ bien, je l'ai acheté avec 18 K€ de travaux prévus. J'ai fini à 27 K€. +50%.",
      "Pourquoi ? Parce que j'avais validé un devis sans vraiment le lire. L'artisan avait une carte de visite propre, il parlait bien, son atelier était à 200 m du bien. Je lui ai fait confiance.",
      "Ce qu'il avait oublié de préciser : la ligne « fourniture matériaux » n'incluait pas l'électroménager (3 K€), la TVA était à 20% au lieu des 10% sur le locatif ancien (encore 2 K€), et « peinture des murs » ne comprenait pas le plafond (2 pièces, 4 K€).",
      "Ce jour-là j'ai appris à lire un devis comme un contrat de divorce : ligne par ligne, piège par piège.",
      "Aujourd'hui je vais te montrer le devis qui m'a eue. Et les 5 trucs qu'il faut repérer en 30 secondes.",
    ],
    missionTitle: "Ta mission, décrypter un devis piégé",
    missionIntro: "Je t'ai préparé un faux devis. Il contient 5 erreurs. Tu les trouves toutes en moins de 5 minutes ?",
    missionSteps: [
      { title: "1) Le jeu des 5 erreurs", body: "Lance le jeu ci-dessous. Clique sur les zones qui te paraissent suspectes." },
      { title: "2) Ta checklist devis", body: "Une fois les 5 erreurs trouvées, télécharge la checklist que je lis à chaque devis reçu. 12 points, à imprimer et garder dans ta pochette visite." },
      { title: "3) Le protocole 3 devis", body: "Règle absolue : tu demandes toujours 3 devis sur les gros lots (cuisine, salle de bain, électricité). Pas 2. Pas 4. Trois. Et tu prends le médian, pas le moins cher." },
    ],
    quiz: [
      {
        id: 1,
        q: "Un artisan te dit « pas la peine d'écrire, je vous fais un prix à l'arrache ». Ta réponse :",
        options: [
          { v: "a", text: "OK si c'est un pote de pote, sinon non", emoji: "🤷" },
          { v: "b", text: "Devis écrit obligatoire, signé des deux côtés, sinon je signe rien", emoji: "✅" },
          { v: "c", text: "Je fais un contrat moi-même type LoiMacron", emoji: "📜" },
        ],
        correct: "b",
        explain: "Pas de devis écrit = pas de recours. Pas de garantie. Pas d'assurance. Règle non négociable : devis détaillé ligne par ligne, avec TVA mentionnée, références assurance décennale, dates de début et fin. Sans ça, tu ne sors pas ta carte.",
      },
      {
        id: 2,
        q: "Tu reçois 3 devis : 12 K€, 18 K€, 24 K€. Tu prends lequel ?",
        options: [
          { v: "a", text: "Le 12 K€, moins cher c'est toujours mieux", emoji: "💰" },
          { v: "b", text: "Le 18 K€, le médian, suivant mon protocole", emoji: "✅" },
          { v: "c", text: "Le 24 K€, qualité premium", emoji: "💎" },
        ],
        correct: "b",
        explain: "Le devis le moins cher cache souvent des oublis volontaires (tu paies la différence à la fin). Le plus cher est souvent une marge de sécurité pour l'artisan. Le médian est statistiquement le plus proche du vrai prix. Plus le détail du devis est propre, plus tu as confiance.",
      },
      {
        id: 3,
        q: "Ton artisan te dit « je commence la semaine prochaine, mais je veux 50% d'acompte ». Tu fais quoi ?",
        options: [
          { v: "a", text: "OK, c'est normal pour un gros chantier", emoji: "👌" },
          { v: "b", text: "30% max à la commande, le reste à l'avancement par jalons", emoji: "✅" },
          { v: "c", text: "Je refuse tout acompte, paiement à la fin", emoji: "🚫" },
        ],
        correct: "b",
        explain: "50% d'acompte, c'est une red flag. Règle : 30% à la commande, 30% à mi-chantier, 30% à la livraison, 10% à la levée des réserves (30 jours après). Un artisan sérieux connaît ce fractionnement et l'accepte.",
      },
    ],
    game: "cinq-erreurs",
    bonus: [
      { icon: "📋", title: "Checklist", desc: "12 points à vérifier sur tout devis reçu" },
      { icon: "🎥", title: "Vidéo", desc: "« Mes 3 règles sacrées sur les devis » (réutilisée 2025, 11 min)" },
      { icon: "📇", title: "Annuaire", desc: "Mes 10 questions à poser à un artisan avant de signer" },
    ],
    ps: "Si un artisan refuse de fractionner les paiements ou de fournir son attestation décennale, fuis. Pas de négociation, pas d'exception.",
  },
  5: {
    emoji: "🎣",
    titleMain: "La",
    titleAccent: "Pêche",
    subtitle: "aux locataires",
    intro: [
      "Mon pire locataire, c'était celui que tout le monde m'aurait conseillé.",
      "CDI depuis 8 ans, cadre, 3 200 € net, zéro crédit, pas d'enfant, la quarantaine tranquille. Le dossier parfait sur le papier. Je lui ai donné les clés en 48h sans creuser.",
      "4 mois après il arrête de payer. « Rupture conventionnelle », « transition professionnelle », « juste un décalage de trésorerie ». 11 mois d'impayés. Procédure. Expulsion. 14 000 € de trou.",
      "Le même mois j'avais refusé un dossier « moins bien » : un couple intérim + CDI à temps partiel, cumul 2 800 €, avec la mère du conjoint qui se portait garante (fonctionnaire retraitée).",
      "Aujourd'hui ils louent un de mes biens depuis 5 ans. Jamais un retard. Travaillent plus dur que n'importe qui. On s'échange des SMS pour le Nouvel An.",
      "Le CDI ne dit rien de la fiabilité. Ce qui parle : la stabilité du foyer, le garant solide, et ton instinct de visite.",
    ],
    missionTitle: "Ta mission, écrire ton annonce et ta grille de tri",
    missionIntro: "Deux livrables ce soir : une annonce qui attire les bons profils, une grille de tri qui écarte les mauvais.",
    missionSteps: [
      { title: "1) L'annonce qui attire", body: "Template 200 mots max : photo lumineuse, phrase d'accroche, 3 arguments concrets (quartier, transports, équipements), loyer + charges détaillés, conditions dossier. Je te donne le modèle en bonus." },
      { title: "2) La grille de tri en 3 colonnes", body: "OUI (revenus 3× loyer + garant solide + stabilité pro/familiale), PEUT-ÊTRE (2 sur 3), NON (1 ou 0). Pas de discussion, pas d'émotion." },
      { title: "3) La visite, 4 questions piège", body: "Tu poses toujours : « Pourquoi vous déménagez ? », « Combien de temps dans votre logement actuel ? », « Votre prochain projet perso dans 2 ans ? », « Un garant solide vous gêne ? ». Les réponses te disent tout." },
    ],
    quiz: [
      {
        id: 1,
        q: "3 candidats : Alice (CDI 1850€, pas de garant), Bertrand (intérim BTP 2400€, garant père fonctionnaire), Chloé (étudiante boursière, 2 garants cadres). Tu choisis :",
        options: [
          { v: "a", text: "Alice, le CDI c'est la sécurité", emoji: "💼" },
          { v: "b", text: "Bertrand, revenus + garant solide, profil stable", emoji: "✅" },
          { v: "c", text: "Chloé, 2 garants cadres c'est du béton", emoji: "🎓" },
        ],
        correct: "b",
        explain: "Bertrand coche les 3 cases : revenus > 3× le loyer (660€ max sur 2400€), garant solide (fonctionnaire retraité = pension garantie), stabilité (BTP = secteur en tension, il retrouvera vite). Alice sans garant à 1850€ nets : un accident de parcours et tu pleures. Chloé est bien mais l'étudiant change de ville en 3 ans, rotation garantie.",
      },
      {
        id: 2,
        q: "Un candidat te fournit un dossier, puis te dit « je préfère ne pas vous donner mes relevés bancaires, c'est privé ». Tu fais quoi ?",
        options: [
          { v: "a", text: "Je respecte, je me base sur les fiches de paie", emoji: "🙏" },
          { v: "b", text: "Je lui explique que c'est la règle et je refuse le dossier s'il ne fournit pas", emoji: "✅" },
          { v: "c", text: "Je lui propose de flouter les transactions sensibles", emoji: "🔐" },
        ],
        correct: "b",
        explain: "Les 3 derniers relevés bancaires sont légaux à demander pour un bailleur (vérification revenus). Un candidat qui refuse a quelque chose à cacher (découvert chronique, crédit non déclaré, autre loyer). Pas de relevés = pas de bail. Tu protèges 8 ans de mensualités.",
      },
      {
        id: 3,
        q: "Un locataire installé te demande de lui céder son bail à son frère « c'est pareil, même famille ». Tu fais quoi ?",
        options: [
          { v: "a", text: "OK, ça m'évite une vacance locative", emoji: "🤝" },
          { v: "b", text: "Refus, je veux un nouveau bail signé avec un nouveau dossier complet", emoji: "✅" },
          { v: "c", text: "OK si le locataire actuel reste caution solidaire", emoji: "🔒" },
        ],
        correct: "b",
        explain: "La cession de bail n'est pas un droit du locataire (sauf exceptions précises type divorce, décès). Un « frère » qui n'a jamais signé n'a aucune obligation envers toi. Tu redémarres à zéro : nouveau dossier complet, nouveau bail, nouveau dépôt de garantie. Sinon tu loues à l'aveugle.",
      },
    ],
    game: "dossier-mystere",
    bonus: [
      { icon: "📝", title: "Template", desc: "Annonce 200 mots à remplir, testée sur mes 55 locataires" },
      { icon: "📊", title: "Grille de tri", desc: "Ma grille 3 colonnes + les 4 questions piège de visite" },
      { icon: "🎥", title: "Vidéo", desc: "« Comment je sélectionne mes locataires » (réutilisée 2025, 14 min)" },
    ],
    ps: "Le meilleur locataire n'est jamais le plus évident sur le papier. Fie-toi à ton instinct de visite + la grille. Jamais l'un sans l'autre.",
  },
};

function EtapeScreen({ stepNum }: { stepNum: number }) {
  const L = LETTRES[stepNum];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = L.quiz.filter((q) => answers[q.id] === q.correct).length;
  const passed = submitted && score >= Math.ceil(L.quiz.length * 0.66);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 font-body relative" style={{ color: C.ink }}>
      <div className="absolute top-2 right-4 text-5xl animate-float">⛵</div>
      <div className="absolute top-32 left-2 text-4xl animate-wiggle">🐚</div>
      <Calculette size={60} className="absolute top-16 right-8 opacity-80 animate-float hidden md:block" style={{ transform: "rotate(-12deg)", animationDelay: "1s" }} />
      <PanneauALouer size={70} className="absolute top-1/3 -right-2 opacity-60 hidden lg:block" style={{ transform: "rotate(8deg)" }} />
      <PieceOr size={20} className="absolute top-52 left-4 opacity-70 animate-float hidden md:block" />

      <button
        className="font-hand text-xl mb-6 hover:underline"
        style={{ color: C.lagonDark }}
      >
        ← Retour à ta carte
      </button>

      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-5xl animate-wiggle">{L.emoji}</span>
          <span
            className="font-hand text-2xl px-3 py-0.5"
            style={{
              background: C.lagon,
              color: "white",
              borderRadius: "999px",
              transform: "rotate(-2deg)",
              display: "inline-block",
            }}
          >
            Escale {stepNum}
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3 leading-tight">
          {L.titleMain}{" "}
          <span className="font-hand" style={{ color: C.coral }}>{L.titleAccent}</span>{" "}
          {L.subtitle}
        </h1>
      </header>

      <section
        className="p-6 mb-8 relative"
        style={{
          background: C.paper,
          border: `2px solid ${C.sandDark}`,
          borderRadius: "20px",
        }}
      >
        <div
          className="absolute -top-4 left-6 px-3 py-1 font-hand text-xl"
          style={{ background: C.coral, color: "white", transform: "rotate(-2deg)" }}
        >
          ✍️ La lettre
        </div>
        <p className="font-hand text-xl mb-3 mt-2" style={{ color: C.inkSoft }}>
          Salut toi,
        </p>
        {L.intro.map((p, i) => (
          <p key={i} className="mb-3 leading-relaxed text-base sm:text-lg">
            {p}
          </p>
        ))}
        <p className="font-hand text-xl mt-3" style={{ color: C.coral }}>
          Bises, Emeline
        </p>
      </section>

      <section
        className="p-6 mb-8 relative"
        style={{
          background: C.lagonLight + "40",
          border: `3px dashed ${C.lagonDark}`,
          borderRadius: "20px",
        }}
      >
        <div
          className="absolute -top-4 left-6 px-3 py-1 font-hand text-xl"
          style={{ background: C.lagon, color: "white", transform: "rotate(-2deg)" }}
        >
          📍 {L.missionTitle}
        </div>
        <p className="mb-4 mt-2 leading-relaxed font-bold">
          {L.missionIntro}
        </p>
        <ol className="space-y-4">
          {L.missionSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="font-hand text-xl flex-shrink-0 w-9 h-9 flex items-center justify-center"
                style={{ background: C.sun, borderRadius: "50%", color: C.ink }}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-bold mb-1">{step.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {L.game === "valise" && <JeuValiseBanquier />}
      {L.game === "coup-de-coeur" && <JeuCoupDeCoeur />}
      {L.game === "cinq-erreurs" && <JeuCinqErreurs />}
      {L.game === "dossier-mystere" && <JeuDossierMystere />}

      <section
        className="p-6 mb-8 relative"
        style={{
          background: C.paper,
          border: `3px solid ${C.ink}`,
          borderRadius: "20px",
          boxShadow: `5px 5px 0 ${C.coral}`,
        }}
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🧩</span>
            <h2 className="font-display text-2xl font-bold">Quiz du capitaine</h2>
          </div>
          <span className="font-hand text-lg" style={{ color: C.inkSoft }}>
            {Math.ceil(L.quiz.length * 0.66)} sur {L.quiz.length} pour valider
          </span>
        </div>

        <div className="space-y-7">
          {L.quiz.map((q) => (
            <div key={q.id}>
              <p className="font-bold text-lg mb-3 flex items-start gap-2">
                <span
                  className="font-hand text-2xl flex-shrink-0"
                  style={{ color: C.coral }}
                >
                  Q{q.id}.
                </span>
                <span>{q.q}</span>
              </p>
              <div className="space-y-2">
                {q.options.map((o) => {
                  const checked = answers[q.id] === o.v;
                  const isRight = submitted && o.v === q.correct;
                  const isWrongPick = submitted && checked && o.v !== q.correct;
                  let bg = C.sand;
                  let border = `2px solid ${C.ink}30`;
                  if (isRight) {
                    bg = C.palm + "30";
                    border = `2px solid ${C.palm}`;
                  } else if (isWrongPick) {
                    bg = C.coral + "20";
                    border = `2px solid ${C.coral}`;
                  } else if (checked) {
                    bg = C.sunLight;
                    border = `2px solid ${C.sun}`;
                  }
                  return (
                    <label
                      key={o.v}
                      className="flex items-center gap-3 p-3 cursor-pointer transition-transform hover:translate-x-1"
                      style={{ background: bg, border, borderRadius: "12px" }}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}-${stepNum}`}
                        value={o.v}
                        checked={checked}
                        onChange={() =>
                          setAnswers((a) => ({ ...a, [q.id]: o.v }))
                        }
                        disabled={submitted}
                        className="sr-only"
                      />
                      <span className="text-2xl">{o.emoji}</span>
                      <span className="text-base flex-1">{o.text}</span>
                      {checked && !submitted && <span style={{ color: C.coral }}>●</span>}
                      {isRight && <span style={{ color: C.palm }}>✓</span>}
                      {isWrongPick && <span style={{ color: C.coral }}>✗</span>}
                    </label>
                  );
                })}
              </div>
              {submitted && (
                <div
                  className="mt-3 p-3 text-sm italic"
                  style={{ background: C.sun + "30", borderLeft: `3px solid ${C.coral}`, color: C.ink }}
                >
                  <span className="font-hand text-lg not-italic" style={{ color: C.coral }}>Emeline :</span>{" "}
                  {q.explain}
                </div>
              )}
            </div>
          ))}
        </div>

        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length < L.quiz.length}
            className="w-full mt-6 font-bold py-3 text-lg transition-transform hover:-translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: C.coral,
              color: "white",
              border: `3px solid ${C.ink}`,
              borderRadius: "999px",
              boxShadow: `4px 4px 0 ${C.ink}`,
            }}
          >
            Valider mes réponses 🎯
          </button>
        ) : (
          <div
            className="mt-6 p-6 text-center"
            style={{
              background: passed ? C.palm : C.coral,
              color: "white",
              border: `3px solid ${C.ink}`,
              borderRadius: "20px",
              boxShadow: `4px 4px 0 ${C.ink}`,
            }}
          >
            {passed ? (
              <>
                <div className="text-5xl mb-2 animate-wiggle inline-block">🏆</div>
                <p className="font-display text-2xl font-bold mb-1">
                  Escale {stepNum} validée
                </p>
                <p className="text-white/90">
                  Score {score}/{L.quiz.length}. Tampon ajouté dans ton passeport.
                </p>
                {stepNum < 5 && (
                  <p className="mt-3 font-hand text-xl text-white">
                    Cap sur l&apos;escale {stepNum + 1} →
                  </p>
                )}
                {stepNum === 5 && (
                  <p className="mt-3 font-hand text-xl text-white">
                    Tu as bouclé les 5 escales. Direction le Coffre 🏆
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">🌊</div>
                <p className="font-display text-xl font-bold mb-1">
                  Presque
                </p>
                <p className="text-white/90 text-sm">
                  Score {score}/{L.quiz.length}. Relis la lettre et retente, t&apos;es à un cheveu.
                </p>
                <button
                  onClick={() => {
                    setAnswers({});
                    setSubmitted(false);
                  }}
                  className="mt-3 underline text-white text-sm"
                >
                  Recommencer
                </button>
              </>
            )}
          </div>
        )}
      </section>

      <section
        className="p-6 mb-8"
        style={{
          background: C.paper,
          border: `2px solid ${C.sandDark}`,
          borderRadius: "20px",
        }}
      >
        <h3 className="font-display text-xl font-bold mb-4" style={{ color: C.ink }}>
          🎁 Tes bonus de l&apos;escale
        </h3>
        <div className="space-y-3">
          {L.bonus.map((b, i) => (
            <div key={i} className="flex items-start gap-3 p-3" style={{ background: C.sand, borderRadius: "12px" }}>
              <span className="text-2xl flex-shrink-0">{b.icon}</span>
              <div>
                <p className="font-bold">{b.title}</p>
                <p className="text-sm" style={{ color: C.inkSoft }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="p-5 mb-8 italic text-sm"
        style={{ background: C.sun + "40", borderRadius: "16px", color: C.ink }}
      >
        <span className="font-hand not-italic text-xl" style={{ color: C.coral }}>PS :</span> {L.ps}
      </section>
    </main>
  );
}

function CoffreScreen() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 font-body relative" style={{ color: C.ink }}>
      <div className="absolute top-0 left-4 text-6xl animate-float">🌴</div>
      <div className="absolute top-8 right-4 animate-spin-slow">
        <Sun size={80} />
      </div>

      <Maison size={70} className="absolute top-12 left-1/4 opacity-30 hidden md:block" style={{ transform: "rotate(-8deg)" }} />
      <Cle size={70} className="absolute top-24 right-1/4 opacity-50 animate-wiggle hidden md:block" style={{ transform: "rotate(20deg)" }} />
      <PieceOr size={26} className="absolute top-40 right-12 opacity-70 animate-float" />
      <PieceOr size={20} className="absolute top-56 left-12 opacity-70 animate-float" style={{ animationDelay: "1.2s" }} />

      <div className="text-center mb-14 relative z-10">
        <div className="inline-block animate-float mb-1">
          <Coffre size={180} />
        </div>
        <p className="font-hand text-3xl mb-2" style={{ color: C.coral }}>
          Tu as bouclé les 5 escales 🎉
        </p>
        <h1 className="font-display text-5xl sm:text-6xl font-bold mb-5 leading-tight">
          Le <span className="highlight-yellow">Coffre</span> au{" "}
          <span className="font-hand" style={{ color: C.coral }}>trésor</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg" style={{ color: C.inkSoft }}>
          Tu as ta carte, tes tampons, ton plan de rentrée. Maintenant tu choisis la suite.
          <br />
          <span className="font-hand text-2xl" style={{ color: C.lagonDark }}>
            Deux portes, deux rythmes, zéro mauvaise réponse.
          </span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        <div
          className="relative p-7 transition-transform hover:-translate-y-2"
          style={{
            background: C.paper,
            border: `3px solid ${C.ink}`,
            borderRadius: "24px",
            boxShadow: `6px 6px 0 ${C.flamingo}`,
            transform: "rotate(-1deg)",
          }}
        >
          <div
            className="absolute -top-3 -left-3 px-3 py-1 font-hand text-xl"
            style={{ background: C.flamingo, color: "white", transform: "rotate(-6deg)" }}
          >
            🌺 La voie communauté
          </div>
          <Tirelire size={70} className="mb-4 mt-3" />
          <h2 className="font-display text-3xl font-bold mb-3">
            Continue avec ES Family
          </h2>
          <p className="mb-5 leading-relaxed" style={{ color: C.inkSoft }}>
            Le suivi mensuel pour ne pas lâcher. Lives, replays, entraide, templates.
            Tu avances à ton rythme, jamais seule.
          </p>
          <ul className="space-y-2 mb-6 text-base">
            {["Lives mensuels avec moi", "Bibliothèque de templates", "Réponses à tes questions", "Sans engagement"].map((it) => (
              <li key={it} className="flex items-start gap-2">
                <span style={{ color: C.flamingo }} className="text-xl flex-shrink-0">✓</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
          <div className="text-center mb-4">
            <span className="font-display text-5xl font-bold">29€</span>
            <span className="text-lg" style={{ color: C.inkSoft }}>/mois</span>
          </div>
          <button
            className="w-full font-bold py-3 text-lg transition-transform hover:-translate-y-1"
            style={{
              background: C.flamingo,
              color: "white",
              border: `3px solid ${C.ink}`,
              borderRadius: "999px",
              boxShadow: `4px 4px 0 ${C.ink}`,
            }}
          >
            Je rejoins ES Family
          </button>
          <p className="text-xs text-center mt-3" style={{ color: C.inkSoft }}>
            Pour le prix d&apos;un forfait téléphonique. Sans engagement.
          </p>
        </div>

        <div
          className="relative p-7 transition-transform hover:-translate-y-2"
          style={{
            background: C.ink,
            color: "white",
            borderRadius: "24px",
            boxShadow: `6px 6px 0 ${C.sun}`,
            transform: "rotate(1deg)",
          }}
        >
          <div
            className="absolute -top-3 -right-3 px-3 py-1 font-hand text-xl"
            style={{ background: C.sun, color: C.ink, transform: "rotate(8deg)" }}
          >
            ⭐ Offre rentrée
          </div>
          <Maison size={70} className="mb-4 mt-3" />
          <h2 className="font-display text-3xl font-bold mb-3">
            Rejoins l&apos;Academy
          </h2>
          <p className="text-white/80 mb-5 leading-relaxed">
            5 sprints, 6 mois de coaching, ma méthode complète. Tu signes ton bien
            d&apos;ici la fin d&apos;année, ou je te rembourse.
          </p>
          <ul className="space-y-2 mb-6 text-base text-white/90">
            {["La méthode Emeline SIRON complète", "Coaching individuel inclus", "3 mois ES Family offerts", "Garantie résultat ou remboursé"].map((it) => (
              <li key={it} className="flex items-start gap-2">
                <span style={{ color: C.sun }} className="text-xl flex-shrink-0">✓</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
          <div className="text-center mb-4">
            <span className="font-display text-5xl font-bold" style={{ color: C.sun }}>
              998€
            </span>
            <span className="text-base text-white/60"> ou 3x 333€</span>
          </div>
          <button
            className="w-full font-bold py-3 text-lg transition-transform hover:-translate-y-1"
            style={{
              background: C.sun,
              color: C.ink,
              border: `3px solid ${C.ink}`,
              borderRadius: "999px",
              boxShadow: `4px 4px 0 white`,
            }}
          >
            Mon appel découverte
          </button>
          <p className="text-xs text-center mt-3 text-white/60">
            15 min avec Antony, gratuit, sans engagement.
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="font-hand text-2xl" style={{ color: C.inkSoft }}>
          Pas encore prête ? Garde tes accès, le cahier reste ouvert tout l&apos;été 🌅
        </p>
      </div>
    </main>
  );
}

// ============================================================
// ÉCRAN ÉTAT DES LIEUX (quiz d'entrée, 5 questions)
// ============================================================

const ETAT_LIEUX_QUESTIONS = [
  {
    key: "niveau" as const,
    label: "Où tu en es aujourd'hui ?",
    options: [
      { v: "debut", text: "Zéro, jamais investi", emoji: "🌱" },
      { v: "1bien", text: "J'ai déjà 1 bien", emoji: "🏠" },
      { v: "2-3", text: "J'ai 2 à 3 biens", emoji: "🏘️" },
      { v: "4+", text: "J'en ai 4 ou plus", emoji: "🏙️" },
    ],
  },
  {
    key: "ambition" as const,
    label: "Dans 5 ans, ton objectif principal c'est...",
    options: [
      { v: "autofi", text: "1 à 2 biens immo qui s'autofinancent", emoji: "⚓" },
      { v: "diversifie", text: "Un patrimoine diversifié : assurance vie, SCPI, immobilier", emoji: "🏛️" },
      { v: "liberte", text: "Remplacer mon salaire ou assurer ma retraite", emoji: "🌅" },
      { v: "sais-pas", text: "Je sais pas encore, je cherche à comprendre", emoji: "🤔" },
    ],
  },
  {
    key: "tempsSemaine" as const,
    label: "Combien d'heures par semaine tu peux mettre sur ce projet ?",
    options: [
      { v: "<2h", text: "Moins de 2h, je suis à fond ailleurs", emoji: "⏰" },
      { v: "2-5h", text: "2 à 5h, soirées et week-ends", emoji: "🌙" },
      { v: "5-10h", text: "5 à 10h, je suis motivée", emoji: "💪" },
      { v: "10+h", text: "10h ou plus, c'est ma priorité", emoji: "🔥" },
    ],
  },
  {
    key: "epargne" as const,
    label: "Côté épargne aujourd'hui, t'en es où franchement ?",
    options: [
      { v: "rien", text: "Aucune épargne, parfois en découvert", emoji: "😬" },
      { v: "fragile", text: "Quelques centaines d'euros, pas un vrai matelas", emoji: "🌬️" },
      { v: "stable", text: "3 à 6 mois de mes charges fixes de côté", emoji: "🛟" },
      { v: "investie", text: "Plus de 6 mois + de l'épargne placée (LDD, AV, etc.)", emoji: "💎" },
    ],
  },
  {
    key: "blocage" as const,
    label: "Ton vrai blocage aujourd'hui, franchement ?",
    options: [
      { v: "banque", text: "La banque, j'ai peur qu'elle dise non", emoji: "🏦" },
      { v: "bien", text: "Trouver le bien, je sais pas où chercher", emoji: "🔍" },
      { v: "travaux", text: "Les travaux, ça me fait flipper", emoji: "🔨" },
      { v: "temps", text: "Le temps, je cours partout", emoji: "🌀" },
      { v: "mindset", text: "Moi, la peur de me planter", emoji: "😰" },
    ],
  },
  {
    key: "situation" as const,
    label: "Tu es sur ce projet...",
    options: [
      { v: "solo", text: "Toute seule", emoji: "🚶‍♀️" },
      { v: "couple", text: "En couple, à deux dans le projet", emoji: "👥" },
      { v: "couple-solo", text: "En couple mais je porte le projet", emoji: "🙋‍♀️" },
      { v: "famille", text: "En famille (parents, frère, sœur)", emoji: "👨‍👩‍👧" },
    ],
  },
];

function EtatLieuxScreen({ onComplete }: { onComplete: (p: Profile) => void }) {
  const [answers, setAnswers] = useState<Partial<Profile>>({});
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const q = ETAT_LIEUX_QUESTIONS[index];
  const total = ETAT_LIEUX_QUESTIONS.length;

  function pick(v: string) {
    const next = { ...answers, [q.key]: v };
    setAnswers(next);
    if (index < total - 1) {
      setTimeout(() => setIndex(index + 1), 280);
    } else {
      setTimeout(() => setDone(true), 280);
    }
  }

  if (done) {
    const profile = answers as Profile;
    const verdict = getVerdict(profile);
    return (
      <main className="max-w-2xl mx-auto px-6 py-10 font-body relative" style={{ color: C.ink }}>
        <Sun size={60} className="absolute top-0 right-4 animate-spin-slow opacity-60" />
        <div className="text-center mb-8">
          <p className="font-hand text-3xl mb-2" style={{ color: C.coral }}>
            Ton état des lieux ⚓
          </p>
          <h1 className="font-display text-4xl font-bold">
            Voici{" "}
            <span className="highlight-yellow">ton profil</span>{" "}
            d&apos;explorateur
          </h1>
        </div>

        <div
          className="p-6 mb-6"
          style={{
            background: C.paper,
            border: `3px solid ${C.ink}`,
            borderRadius: "20px",
            boxShadow: `5px 5px 0 ${C.coral}`,
          }}
        >
          <p className="font-hand text-4xl mb-3" style={{ color: C.lagonDark }}>
            {verdict.titre}
          </p>
          <p className="mb-4 leading-relaxed">{verdict.description}</p>
          <div className="pt-4 border-t" style={{ borderColor: C.sandDark }}>
            <p className="font-bold text-sm mb-2">Ton parcours recommandé cet été :</p>
            <p className="text-sm" style={{ color: C.inkSoft }}>{verdict.parcours}</p>
          </div>
        </div>

        {verdict.alerte && (
          <div
            className="p-4 mb-6 text-sm"
            style={{
              background: C.coral + "15",
              borderLeft: `4px solid ${C.coral}`,
              borderRadius: "10px",
              color: C.ink,
            }}
          >
            <span className="font-hand text-lg block mb-1" style={{ color: C.coralDark }}>Alerte capitaine</span>
            {verdict.alerte}
          </div>
        )}

        {verdict.pisteSolstice && (
          <div
            className="p-5 mb-6"
            style={{
              background: C.lagonLight + "30",
              border: `2px dashed ${C.lagonDark}`,
              borderRadius: "14px",
            }}
          >
            <p className="font-hand text-xl mb-2 flex items-center gap-2" style={{ color: C.lagonDark }}>
              🌅 Une autre piste pour toi
            </p>
            <p className="text-sm leading-relaxed" style={{ color: C.ink }}>
              {verdict.pisteSolstice}
            </p>
          </div>
        )}

        <button
          onClick={() => onComplete(profile)}
          className="w-full font-bold py-4 text-lg transition-transform hover:-translate-y-1"
          style={{
            background: C.coral,
            color: "white",
            border: `3px solid ${C.ink}`,
            borderRadius: "999px",
            boxShadow: `4px 4px 0 ${C.ink}`,
          }}
        >
          Voir ma carte d&apos;expédition →
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 font-body relative" style={{ color: C.ink }}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-hand text-xl" style={{ color: C.lagonDark }}>
            État des lieux · Question {index + 1} sur {total}
          </p>
          <span className="font-hand text-2xl" style={{ color: C.coral }}>
            {Math.round(((index) / total) * 100)}%
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: C.sandDark }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(index / total) * 100}%`, background: `linear-gradient(90deg, ${C.coral}, ${C.sun})` }}
          />
        </div>
      </div>

      <div
        className="p-7"
        style={{
          background: C.paper,
          border: `3px solid ${C.ink}`,
          borderRadius: "20px",
          boxShadow: `5px 5px 0 ${C.lagon}`,
        }}
      >
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6 leading-tight">
          {q.label}
        </h2>

        <div className="space-y-3">
          {q.options.map((o) => (
            <button
              key={o.v}
              onClick={() => pick(o.v)}
              className="w-full flex items-center gap-4 p-4 text-left transition-all hover:translate-x-1"
              style={{
                background: C.sand,
                border: `2px solid ${C.ink}30`,
                borderRadius: "14px",
              }}
            >
              <span className="text-3xl flex-shrink-0">{o.emoji}</span>
              <span className="font-medium flex-1">{o.text}</span>
              <span className="text-xl" style={{ color: C.coral }}>→</span>
            </button>
          ))}
        </div>

        {index > 0 && (
          <button
            onClick={() => setIndex(index - 1)}
            className="mt-5 font-hand text-lg hover:underline"
            style={{ color: C.inkSoft }}
          >
            ← Question précédente
          </button>
        )}
      </div>

      <p className="text-center mt-6 text-sm italic" style={{ color: C.inkSoft }}>
        Tes réponses restent entre toi et moi. Elles personnalisent ton parcours et tes mails.
      </p>
    </main>
  );
}

function getVerdict(p: Profile): {
  titre: string;
  description: string;
  parcours: string;
  alerte?: string;
  pisteSolstice?: string;
} {
  // Cas 1 : épargne nulle ou fragile -> on freine sur l'immo, on oriente sur les bases
  if (p.epargne === "rien") {
    return {
      titre: "La Rêveuse honnête",
      description:
        "Tu es lucide, et c'est ce qui me plaît : tu reconnais que tes finances perso sont à reprendre avant de te lancer dans l'immo. Acheter un bien locatif sans matelas, c'est se mettre à genoux dès le 1ᵉʳ coup dur (chaudière HS, locataire qui paie pas, vacance).",
      parcours:
        "Fais quand même les 5 escales pour comprendre la mécanique. Mais ta vraie mission cet été, c'est de monter ton matelas avant tout. Vise 3 mois de tes charges fixes en épargne d'urgence avant de viser un crédit immo.",
      alerte:
        "⛔ Ne te lance PAS dans un achat sans matelas. C'est la 1ʳᵉ règle non négociable de ma méthode.",
      pisteSolstice:
        "Si tu veux qu'on regarde ensemble comment structurer tes finances perso AVANT l'immo, mon cabinet de gestion patrimoine Solstice peut faire un point gratuit avec toi à la rentrée.",
    };
  }
  if (p.epargne === "fragile") {
    return {
      titre: "La Préparatrice",
      description:
        "Tu as commencé à mettre de côté mais tu n'es pas encore au niveau de sécurité pour te lancer. C'est OK. Le cahier va te servir à apprendre la méthode pendant que tu consolides ton matelas en parallèle.",
      parcours:
        "Fais les 5 escales sans pression cet été. En septembre, tu décides : si ton épargne a atteint 3 mois de charges, tu peux passer à l'action. Sinon, tu continues de consolider.",
      pisteSolstice:
        "Pour optimiser ta capacité d'épargne (placement de précaution, réduction d'impôts), Solstice peut t'aider à structurer ça à la rentrée.",
    };
  }

  // Cas 2 : ambition diversifiée -> piste Solstice claire
  if (p.ambition === "diversifie") {
    return {
      titre: "La Bâtisseuse multi-facettes",
      description:
        "Tu vises un patrimoine qui mixe immo + financier (assurance vie, SCPI, etc.). Excellent positionnement long terme : tu ne mets pas tous tes œufs dans un panier, tu construis solide.",
      parcours:
        "Le cahier va te lancer côté immo locatif (escales 1 à 5). En parallèle, garde en tête que tu as besoin d'un vrai conseil patrimonial pour la partie financière.",
      pisteSolstice:
        "Solstice, mon cabinet de gestion patrimoine, est exactement fait pour ton profil. À la rentrée on peut faire un bilan complet : immo + AV + SCPI + fiscalité.",
    };
  }

  // Cas 3 : ambition retraite/salaire -> long terme, plus stratégique
  if (p.ambition === "liberte") {
    return {
      titre: "La Stratège long terme",
      description:
        "Tu vises grand : remplacer ton salaire ou assurer ta retraite. C'est ambitieux et faisable, mais ça demande une stratégie en plusieurs étapes (pas un coup de chance, une montée en charge).",
      parcours:
        "Fais les 5 escales en mode étude. Concentre-toi sur les escales 1 (objectifs) et 2 (finances) qui sont les fondations. Les autres viennent ensuite, projet par projet.",
      pisteSolstice:
        "Pour un objectif retraite/salaire, l'immo seule ne suffit pas toujours. Solstice peut compléter avec assurance vie, PER, SCPI selon ton profil fiscal. À la rentrée si tu veux qu'on en parle.",
    };
  }

  // Cas 4 : "je sais pas" -> exploratrice
  if (p.ambition === "sais-pas") {
    return {
      titre: "L'Exploratrice",
      description:
        "Tu es en phase de clarification, et c'est un bon endroit pour démarrer. Ce cahier va t'aider à savoir SI l'immo est pour toi, pas juste COMMENT faire. Prends ton temps cet été pour découvrir.",
      parcours:
        "Fais les 5 escales dans l'ordre. Ne saute pas l'escale 1, c'est celle qui va te débloquer. À la fin, tu sauras si tu veux te lancer ou pas.",
    };
  }

  // Cas 5 : niveau immo
  if (p.niveau === "debut") {
    return {
      titre: "La Défricheuse",
      description:
        "Tu démarres de zéro côté immo et c'est parfait. Pas de mauvaises habitudes, pas de mauvaise méthode. Tu peux construire ta base sur des fondations propres.",
      parcours:
        "Commence par les escales 1 (Port des objectifs) et 2 (Plage des finances) avant d'ouvrir la moindre annonce. Les escales 3 et 4 viendront quand ta machine bancaire est calée.",
    };
  }
  if (p.niveau === "1bien") {
    return {
      titre: "La Navigatrice",
      description:
        "Tu as déjà 1 bien, donc tu sais que c'est possible. Ce cahier va t'aider à passer du « j'ai fait un coup » au « j'ai une méthode ». L'enjeu pour toi : professionnaliser ton œil et ta sélection.",
      parcours:
        "Tu peux zapper l'escale 1 si ton cap est clair. Attaque fort l'escale 3 (Chasse aux pépites) et 4 (Jungle des travaux), c'est là où tu vas vraiment monter en niveau.",
    };
  }
  return {
    titre: "La Capitaine",
    description:
      "Tu as déjà un vrai parc. Ce cahier va te servir d'audit plus que de formation. L'enjeu pour toi : repérer les angles morts de ta méthode actuelle et optimiser ce qui ronronne.",
    parcours:
      "Parcours libre. Utilise les escales comme check-list. L'escale 5 (Pêche aux locataires) est probablement celle où tu vas trouver le plus de trucs à retravailler.",
    pisteSolstice:
      "Avec un parc déjà constitué, tu pourrais avoir besoin d'optimiser fiscalement. Solstice peut faire un point complet à la rentrée.",
  };
}

// ============================================================
// JEU 1 : LA VALISE DU BANQUIER (escale 2)
// ============================================================

const VALISE_ITEMS = [
  { id: "salaire", label: "3 bulletins de salaire", dans: true, why: "Preuve de revenu stable, obligatoire." },
  { id: "releves", label: "3 relevés bancaires", dans: true, why: "La banque veut voir comment tu gères ton flux au quotidien." },
  { id: "imposition", label: "Avis d'imposition", dans: true, why: "Confirme tes revenus sur 1 an." },
  { id: "amortissement", label: "Tableau d'amortissement crédits en cours", dans: true, why: "Montre ton reste à rembourser et ta capacité d'endettement réelle." },
  { id: "businessplan", label: "Ton business plan immo 1 page", dans: true, why: "Te place en partenaire, pas en client. La différence est colossale." },
  { id: "epargne", label: "Livret A + assurance vie", dans: true, why: "Prouve ton matelas, rassure pour les coups durs." },
  { id: "ldd", label: "Ton LDD avec 400 €", dans: false, why: "400 € c'est pas un matelas, c'est une alerte rouge." },
  { id: "credits-conso", label: "Tes 4 crédits conso", dans: false, why: "Chaque crédit conso divise ta capacité d'emprunt. À solder AVANT d'aller voir la banque." },
  { id: "decouverts", label: "Ton historique de découverts", dans: false, why: "Tu ne le montres pas, mais il est visible dans tes relevés. Anticipe en soldant et en attendant 3 mois clean." },
  { id: "bitcoin", label: "Ton portefeuille Bitcoin", dans: false, why: "Volatile, fiscal, mal vu. Exclus." },
  { id: "lettre-mere", label: "Lettre de ta mère qui se porte garante", dans: false, why: "Pas de caution morale, la banque veut un acte juridique, pas une lettre émouvante." },
  { id: "cv", label: "Ton CV pro", dans: false, why: "Sauf si tu changes de boulot dans les 3 mois, ça ne sert à rien et ça peut éveiller des questions." },
];

function JeuValiseBanquier() {
  const [state, setState] = useState<Record<string, boolean>>({}); // true = dans la valise
  const [reveal, setReveal] = useState(false);
  const placed = Object.keys(state).length;
  const total = VALISE_ITEMS.length;
  const correct = VALISE_ITEMS.filter((it) => state[it.id] === it.dans).length;

  return (
    <section
      className="p-6 mb-8 relative"
      style={{
        background: C.paper,
        border: `3px solid ${C.ink}`,
        borderRadius: "20px",
        boxShadow: `5px 5px 0 ${C.lagon}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">🎒</span>
        <h2 className="font-display text-2xl font-bold">Jeu : La valise du banquier</h2>
      </div>
      <p className="mb-5 text-sm" style={{ color: C.inkSoft }}>
        Glisse chaque item dans la bonne colonne. 12 items, il faut les 12 bien rangés pour valider.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div
          className="p-4"
          style={{ background: C.palm + "20", border: `3px dashed ${C.palm}`, borderRadius: "16px", minHeight: "200px" }}
        >
          <p className="font-hand text-2xl mb-2" style={{ color: C.palm }}>✓ Dans la valise</p>
          <div className="space-y-1.5">
            {VALISE_ITEMS.filter((it) => state[it.id] === true).map((it) => (
              <button
                key={it.id}
                onClick={() => !reveal && setState((s) => { const n = { ...s }; delete n[it.id]; return n; })}
                className="block w-full text-left px-3 py-2 text-sm"
                style={{ background: C.paper, border: `1px solid ${C.palm}`, borderRadius: "10px" }}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="p-4"
          style={{ background: C.coral + "20", border: `3px dashed ${C.coralDark}`, borderRadius: "16px", minHeight: "200px" }}
        >
          <p className="font-hand text-2xl mb-2" style={{ color: C.coralDark }}>✗ Pas dans la valise</p>
          <div className="space-y-1.5">
            {VALISE_ITEMS.filter((it) => state[it.id] === false).map((it) => (
              <button
                key={it.id}
                onClick={() => !reveal && setState((s) => { const n = { ...s }; delete n[it.id]; return n; })}
                className="block w-full text-left px-3 py-2 text-sm"
                style={{ background: C.paper, border: `1px solid ${C.coral}`, borderRadius: "10px" }}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="font-hand text-xl mb-2" style={{ color: C.inkSoft }}>À trier ({total - placed}) :</p>
        <div className="flex flex-wrap gap-2">
          {VALISE_ITEMS.filter((it) => state[it.id] === undefined).map((it) => (
            <div
              key={it.id}
              className="px-3 py-2 text-sm flex items-center gap-2"
              style={{ background: C.sand, border: `2px solid ${C.ink}40`, borderRadius: "10px" }}
            >
              <span>{it.label}</span>
              <button
                onClick={() => setState((s) => ({ ...s, [it.id]: true }))}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold"
                style={{ background: C.palm, color: "white", borderRadius: "50%" }}
                title="Dans la valise"
              >
                ✓
              </button>
              <button
                onClick={() => setState((s) => ({ ...s, [it.id]: false }))}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold"
                style={{ background: C.coral, color: "white", borderRadius: "50%" }}
                title="Pas dans la valise"
              >
                ✗
              </button>
            </div>
          ))}
        </div>
      </div>

      {placed === total && !reveal && (
        <button
          onClick={() => setReveal(true)}
          className="w-full mt-6 font-bold py-3 transition-transform hover:-translate-y-1"
          style={{
            background: C.coral,
            color: "white",
            border: `3px solid ${C.ink}`,
            borderRadius: "999px",
            boxShadow: `4px 4px 0 ${C.ink}`,
          }}
        >
          Je ferme la valise, révéler la correction
        </button>
      )}

      {reveal && (
        <div className="mt-6">
          <p className="font-display text-2xl font-bold mb-3" style={{ color: correct === total ? C.palm : C.coral }}>
            {correct}/{total} bien classés
          </p>
          <div className="space-y-2">
            {VALISE_ITEMS.map((it) => {
              const user = state[it.id];
              const ok = user === it.dans;
              return (
                <div key={it.id} className="p-3 text-sm" style={{ background: ok ? C.palm + "15" : C.coral + "15", borderRadius: "10px", borderLeft: `3px solid ${ok ? C.palm : C.coral}` }}>
                  <p className="font-bold mb-1">
                    {ok ? "✓" : "✗"} {it.label} {it.dans ? "(dans la valise)" : "(pas dans la valise)"}
                  </p>
                  <p style={{ color: C.inkSoft }}>{it.why}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// JEU 2 : LE COUP DE COEUR PIÉGÉ (escale 3)
// ============================================================

const ANNONCES_PIEGES = [
  {
    id: "A",
    emoji: "🏢",
    titre: "Annonce A, centre-ville moyen",
    desc: "T2 de 60 m², 92 K€, à rénover, 5 min de la gare.",
    details: ["DPE : F", "Loyer estimé : 590 €", "Charges copro : 80 €/mois", "Copro : 12 lots"],
    piege: "DPE F = location bientôt interdite. Tu achètes une bombe à retardement si tu ne budgétises pas 15 à 25 K€ de travaux énergétiques dès l'acquisition.",
    verdict: "À ne visiter QUE si le vendeur accepte de baisser à 75 K€ minimum pour intégrer les travaux énergétiques. Sinon, fuir.",
    rating: "⚠️ Piégée",
  },
  {
    id: "B",
    emoji: "🏘️",
    titre: "Annonce B, quartier résidentiel",
    desc: "T2 de 58 m², 98 K€, rénové, copro saine.",
    details: ["DPE : C", "Loyer estimé : 520 €", "Charges copro : 180 €/mois", "Copro : 40 lots"],
    piege: "180 €/mois de charges sur un petit bien, c'est énorme. Avant de se prononcer, il faut récupérer les 3 derniers PV d'AG pour voir ce qui grève (ravalement, ascenseur, contentieux).",
    verdict: "Potentiel si les charges sont justifiées par des services (ascenseur, gardien) et pas par un mur de la copro qui s'écroule. À creuser.",
    rating: "🔍 À creuser",
  },
  {
    id: "C",
    emoji: "🎓",
    titre: "Annonce C, quartier étudiant",
    desc: "T2 de 62 m², 90 K€, parfait étudiant, colocation possible.",
    details: ["DPE : D", "Loyer estimé : 620 € (ou colocation 2×360 €)", "Charges copro : 60 €/mois", "Ravalement voté 12 K€"],
    piege: "Le ravalement voté 12 K€ est une ligne qu'il faut négocier ou intégrer au prix d'achat. Mais c'est une info transparente, pas un piège caché.",
    verdict: "La meilleure des 3. DPE correct, loyer solide (encore plus si colocation), charges raisonnables. Tu visites, tu négocies 6 K€ de prix pour absorber le ravalement, tu signes.",
    rating: "✅ Pépite",
  },
];

function JeuCoupDeCoeur() {
  const [pick, setPick] = useState<string | null>(null);

  return (
    <section
      className="p-6 mb-8"
      style={{
        background: C.paper,
        border: `3px solid ${C.ink}`,
        borderRadius: "20px",
        boxShadow: `5px 5px 0 ${C.coral}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">🕵️</span>
        <h2 className="font-display text-2xl font-bold">Jeu : Le coup de cœur piégé</h2>
      </div>
      <p className="mb-5 text-sm" style={{ color: C.inkSoft }}>
        3 annonces, même ville, même surface, prix proches. Tu visites laquelle en priorité ?
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {ANNONCES_PIEGES.map((a) => (
          <button
            key={a.id}
            onClick={() => setPick(a.id)}
            className="text-left p-4 transition-transform hover:-translate-y-1"
            style={{
              background: pick === a.id ? C.sun + "40" : C.sand,
              border: pick === a.id ? `3px solid ${C.coral}` : `2px solid ${C.ink}30`,
              borderRadius: "14px",
            }}
          >
            <div className="text-3xl mb-2">{a.emoji}</div>
            <p className="font-bold mb-1 text-sm">{a.titre}</p>
            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{a.desc}</p>
            <ul className="text-xs space-y-0.5" style={{ color: C.inkSoft }}>
              {a.details.map((d) => <li key={d}>· {d}</li>)}
            </ul>
          </button>
        ))}
      </div>

      {pick && (
        <div className="mt-5 space-y-3">
          <h3 className="font-display text-xl font-bold">Mon analyse des 3 :</h3>
          {ANNONCES_PIEGES.map((a) => (
            <div
              key={a.id}
              className="p-4"
              style={{
                background: a.rating.includes("Pépite") ? C.palm + "15" : a.rating.includes("creuser") ? C.sun + "25" : C.coral + "15",
                borderLeft: `4px solid ${a.rating.includes("Pépite") ? C.palm : a.rating.includes("creuser") ? C.sun : C.coral}`,
                borderRadius: "10px",
                opacity: a.id === pick ? 1 : 0.85,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold">{a.emoji} {a.titre}</p>
                <span className="text-xs font-bold">{a.rating}</span>
              </div>
              <p className="text-sm mb-2"><span className="font-bold">Piège ou enjeu :</span> {a.piege}</p>
              <p className="text-sm"><span className="font-bold">Ma reco :</span> {a.verdict}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================
// JEU 3 : LES 5 ERREURS DU DEVIS (escale 4)
// ============================================================

const DEVIS_ERREURS = [
  { id: "tva", label: "TVA 20%", x: 70, y: 18, explain: "TVA devrait être à 10% sur de la rénovation de locatif ancien de plus de 2 ans. 20% = +1 100 € de trop-payé." },
  { id: "electromenager", label: "« Fourniture matériaux inclus »", x: 30, y: 36, explain: "Ligne floue : dans 90% des cas ça n'inclut pas l'électroménager. À chiffrer en plus (+2 500 €)." },
  { id: "plafond", label: "« Peinture murs 3 pièces »", x: 30, y: 55, explain: "Peinture MURS uniquement. Les plafonds sont hors devis. +1 200 € minimum qui tomberont à la fin." },
  { id: "acompte", label: "Acompte 50% à la commande", x: 30, y: 72, explain: "50% d'acompte = red flag. Règle : 30% commande, 30% mi-chantier, 30% livraison, 10% levée des réserves." },
  { id: "decennale", label: "Pas de n° d'assurance décennale", x: 50, y: 88, explain: "Aucun numéro de décennale mentionné. Sans ça, en cas de malfaçon dans les 10 ans, tu n'as aucun recours. Non négociable." },
];

function JeuCinqErreurs() {
  const [found, setFound] = useState<string[]>([]);
  const total = DEVIS_ERREURS.length;

  function tryFind(id: string) {
    if (!found.includes(id)) {
      setFound([...found, id]);
    }
  }

  return (
    <section
      className="p-6 mb-8"
      style={{
        background: C.paper,
        border: `3px solid ${C.ink}`,
        borderRadius: "20px",
        boxShadow: `5px 5px 0 ${C.palm}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">🔎</span>
        <h2 className="font-display text-2xl font-bold">Jeu : Les 5 erreurs du devis</h2>
      </div>
      <p className="mb-5 text-sm" style={{ color: C.inkSoft }}>
        Voici un vrai devis, reçu d'un artisan en 2017. Il contient 5 erreurs qui m'auraient coûté +9 K€. Clique sur chaque erreur trouvée.{" "}
        <span className="font-bold">{found.length}/{total} trouvées.</span>
      </p>

      <div
        className="relative mx-auto p-6 font-mono text-xs sm:text-sm leading-relaxed"
        style={{
          background: "#fffdf0",
          border: `2px solid ${C.ink}`,
          borderRadius: "8px",
          maxWidth: "600px",
          minHeight: "500px",
        }}
      >
        <p className="font-bold mb-2 text-center">DEVIS N°2017-042 · SARL Artisan Pro</p>
        <p className="text-center mb-4" style={{ color: C.inkSoft }}>Rénovation T2, 60m², 48 Rue des Tulipes</p>

        <div className="mb-3 relative">
          <p><span className="font-bold">TVA :</span> 20%</p>
          <button
            onClick={() => tryFind("tva")}
            className="absolute inset-0 w-full h-full"
            style={{ background: found.includes("tva") ? C.coral + "50" : "transparent", border: found.includes("tva") ? `2px dashed ${C.coral}` : "none", borderRadius: "4px" }}
            aria-label="Erreur TVA"
          />
        </div>

        <p className="font-bold mt-4 mb-2">Prestations :</p>

        <div className="mb-2 relative pl-2">
          <p>· Fourniture matériaux inclus .................. 4 800 €</p>
          <button
            onClick={() => tryFind("electromenager")}
            className="absolute inset-0 w-full h-full"
            style={{ background: found.includes("electromenager") ? C.coral + "50" : "transparent", border: found.includes("electromenager") ? `2px dashed ${C.coral}` : "none", borderRadius: "4px" }}
            aria-label="Erreur matériaux"
          />
        </div>

        <p className="pl-2 mb-2">· Démolition cloison salon ................. 650 €</p>
        <p className="pl-2 mb-2">· Pose cuisine équipée ....................... 2 100 €</p>

        <div className="mb-2 relative pl-2">
          <p>· Peinture murs 3 pièces ..................... 1 400 €</p>
          <button
            onClick={() => tryFind("plafond")}
            className="absolute inset-0 w-full h-full"
            style={{ background: found.includes("plafond") ? C.coral + "50" : "transparent", border: found.includes("plafond") ? `2px dashed ${C.coral}` : "none", borderRadius: "4px" }}
            aria-label="Erreur plafond"
          />
        </div>

        <p className="pl-2 mb-2">· Électricité mise aux normes ............. 2 400 €</p>
        <p className="pl-2 mb-2">· Carrelage salle de bain ................... 1 600 €</p>

        <p className="font-bold mt-4 mb-2">TOTAL HT : 12 950 €</p>
        <p className="font-bold mb-3">TOTAL TTC : 15 540 €</p>

        <div className="mb-3 relative">
          <p><span className="font-bold">Modalités de paiement :</span> 50% à la commande, solde à la livraison.</p>
          <button
            onClick={() => tryFind("acompte")}
            className="absolute inset-0 w-full h-full"
            style={{ background: found.includes("acompte") ? C.coral + "50" : "transparent", border: found.includes("acompte") ? `2px dashed ${C.coral}` : "none", borderRadius: "4px" }}
            aria-label="Erreur acompte"
          />
        </div>

        <p className="mb-3" style={{ color: C.inkSoft }}>Début des travaux : dans 2 semaines. Durée : 4 semaines.</p>

        <div className="mt-6 pt-4 relative" style={{ borderTop: `1px solid ${C.ink}30` }}>
          <p className="text-xs" style={{ color: C.inkSoft }}>SARL Artisan Pro, 12 Rue du Moulin, SIRET 123 456 789 00012</p>
          <button
            onClick={() => tryFind("decennale")}
            className="absolute inset-0 w-full h-full"
            style={{ background: found.includes("decennale") ? C.coral + "50" : "transparent", border: found.includes("decennale") ? `2px dashed ${C.coral}` : "none", borderRadius: "4px" }}
            aria-label="Erreur décennale manquante"
          />
        </div>
      </div>

      {found.length > 0 && (
        <div className="mt-5 space-y-2">
          <h3 className="font-display text-lg font-bold">Erreurs repérées :</h3>
          {DEVIS_ERREURS.filter((e) => found.includes(e.id)).map((e) => (
            <div key={e.id} className="p-3 text-sm" style={{ background: C.palm + "15", borderLeft: `3px solid ${C.palm}`, borderRadius: "8px" }}>
              <p className="font-bold mb-1">✓ {e.label}</p>
              <p style={{ color: C.inkSoft }}>{e.explain}</p>
            </div>
          ))}
        </div>
      )}

      {found.length === total && (
        <div className="mt-5 p-4 text-center" style={{ background: C.palm, color: "white", borderRadius: "14px" }}>
          <p className="font-display text-xl font-bold">Bravo, tu as trouvé les 5 erreurs 🏆</p>
          <p className="text-sm mt-1">Ce devis corrigé aurait dû coûter 12 950 € HT à 10% de TVA = 14 245 € TTC (soit 1 295 € économisés sur la TVA). Plus : 2 500 € électroménager + 1 200 € plafond en clair dès le départ. Tu sais désormais où regarder.</p>
        </div>
      )}
    </section>
  );
}

// ============================================================
// JEU 4 : LE DOSSIER MYSTÈRE (escale 5)
// ============================================================

const DOSSIERS = [
  {
    id: "alice",
    nom: "Alice, 28 ans",
    emoji: "👩‍⚕️",
    situation: "CDI pharma, 1 850 €/mois net, pas de garant, loge chez ses parents",
    analyse: "Revenus = 3,15× le loyer (plafond théorique à 590 €). Mais SANS garant, si elle perd son poste ou tombe malade longtemps, tu n'as aucun recours. Le CDI ne vaut rien sans filet.",
    verdict: "refuser",
    raison: "Dossier incomplet. Demande-lui un garant physique (parent) ou une garantie Visale.",
  },
  {
    id: "bertrand",
    nom: "Bertrand, 34 ans",
    emoji: "👷",
    situation: "Intérim BTP, 2 400 €/mois net sur 6 derniers mois, 3 fiches de paie, garant père retraité fonctionnaire",
    analyse: "Revenus stables (il tourne depuis 6 mois avec le même donneur d'ordre). Garant solide (pension fonctionnaire = versement garanti à vie). Secteur BTP en tension, il retrouvera vite. Stabilité familiale à creuser.",
    verdict: "prendre",
    raison: "Le bon choix. Revenus > 4× le loyer, garant béton, secteur porteur. Si la visite confirme la stabilité, tu signes.",
  },
  {
    id: "chloe",
    nom: "Chloé, 21 ans",
    emoji: "🎓",
    situation: "Étudiante école de commerce, 2 garants parents cadres CDI, boursière échelon 4",
    analyse: "Aucun revenu propre mais 2 garants cadres CDI, c'est du béton juridique. Risque : rotation dans 2 à 3 ans à la fin de ses études. Parfait pour un bail meublé courte durée.",
    verdict: "prendre-avec-condition",
    raison: "OK mais uniquement si ton bien convient à une étudiante (proche de l'école, meublé) et si tu acceptes une rotation rapide. Sinon tu passes.",
  },
];

function JeuDossierMystere() {
  const [pick, setPick] = useState<string | null>(null);

  return (
    <section
      className="p-6 mb-8"
      style={{
        background: C.paper,
        border: `3px solid ${C.ink}`,
        borderRadius: "20px",
        boxShadow: `5px 5px 0 ${C.flamingo}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">👥</span>
        <h2 className="font-display text-2xl font-bold">Jeu : Le dossier mystère</h2>
      </div>
      <p className="mb-5 text-sm" style={{ color: C.inkSoft }}>
        Loyer : 580 €/mois. 3 candidats te postulent. Tu choisis qui tu appelles en priorité ?
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {DOSSIERS.map((d) => (
          <button
            key={d.id}
            onClick={() => setPick(d.id)}
            className="text-left p-4 transition-transform hover:-translate-y-1"
            style={{
              background: pick === d.id ? C.sun + "40" : C.sand,
              border: pick === d.id ? `3px solid ${C.coral}` : `2px solid ${C.ink}30`,
              borderRadius: "14px",
            }}
          >
            <div className="text-4xl mb-2">{d.emoji}</div>
            <p className="font-bold text-base mb-2">{d.nom}</p>
            <p className="text-xs leading-relaxed" style={{ color: C.inkSoft }}>{d.situation}</p>
          </button>
        ))}
      </div>

      {pick && (
        <div className="mt-5 space-y-3">
          <h3 className="font-display text-xl font-bold">Mon analyse :</h3>
          {DOSSIERS.map((d) => {
            const color = d.verdict === "prendre" ? C.palm : d.verdict === "refuser" ? C.coral : C.sun;
            const label = d.verdict === "prendre" ? "✅ À prendre" : d.verdict === "refuser" ? "❌ À refuser" : "🤔 À conditionner";
            return (
              <div
                key={d.id}
                className="p-4"
                style={{
                  background: color + "15",
                  borderLeft: `4px solid ${color}`,
                  borderRadius: "10px",
                  opacity: d.id === pick ? 1 : 0.85,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold">{d.emoji} {d.nom}</p>
                  <span className="text-xs font-bold" style={{ color }}>{label}</span>
                </div>
                <p className="text-sm mb-2"><span className="font-bold">Analyse :</span> {d.analyse}</p>
                <p className="text-sm"><span className="font-bold">Ma reco :</span> {d.raison}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================
// ÉCRAN SÉQUENCE EMAIL
// ============================================================

const EMAILS = [
  {
    jour: "J0",
    objet: "J'ai un secret à te dire avant qu'on parte",
    preheader: "Ta carte d'expédition t'attend. 15 min ce soir, pas plus.",
    promesse: "Bienvenue + setup + première mission",
    body: `Salut {{prenom}},

Y'a 9 ans, j'avais ton problème. Je voulais "me lancer" sans savoir ni quand, ni combien, ni pour quoi. J'ai perdu 3 ans à hésiter.

Je vais pas te laisser perdre 3 jours.

Ton cahier est ouvert ici : [lien]

Première mission, ce soir, 15 minutes. Pas plus.

On en parle dans 48h.

Bises, Emeline

PS : tu vas recevoir un mail tous les 2 à 3 jours pendant 5 semaines. Si tu décroches, je viendrai te chercher. Promesse de capitaine.`,
  },
  {
    jour: "J2",
    objet: "T'as posé ton cap au Port ?",
    preheader: "Le post-it du frigo, c'est tout ce qui sépare ceux qui signent de ceux qui rêvent.",
    promesse: "Push escale 1 + story post-it",
    body: `Salut {{prenom}},

Tu sais ce qui fait la différence entre quelqu'un qui signera son bien cette année et quelqu'un qui le racontera encore dans 3 ans ?

Un post-it. Littéralement.

Si t'as fait l'escale 1, tu vois de quoi je parle. Si t'as pas encore commencé, vas-y avant de lire la suite : [lien escale 1]

De retour ? OK. Ce post-it, je l'ai collé sur mon frigo en juillet 2017. J'ai signé en novembre. 4 mois.

Cette semaine, on attaque la Plage des finances. Parce qu'avoir un cap sans banque, c'est comme avoir une carte sans bateau.

Mission escale 2 : [lien]

Bises, Emeline

PS : envoie-moi une photo de ton post-it en réponse à ce mail. Je les affiche chaque été dans mon bureau.`,
  },
  {
    jour: "J5",
    objet: "Direction la Plage des finances 🏖️",
    preheader: "L'histoire de la fois où ma banque m'a humiliée (et comment la 4ᵉ a dit oui à 110%).",
    promesse: "Push escale 2 + story banque",
    body: `Salut {{prenom}},

En 2017 ma banque à Mulhouse m'a dit : « Madame Siron, votre projet n'est pas viable. Vous n'êtes pas dans la bonne catégorie de clientèle. »

Je suis sortie. J'ai pleuré dans la voiture. 3 semaines j'ai cru que c'était mort.

Puis j'ai envoyé mon dossier à 6 banques le même jour. La 4ᵉ a dit oui. À 110%. Taux négocié.

La banque qui m'avait humiliée ? Ils m'ont jamais revu.

Ce que j'ai compris ce jour-là, c'est dans l'escale 2. Si t'as pas encore attaqué : [lien]

Et si tu l'as faite, reste pas avec. Envoie 6 dossiers cette semaine. Pas 1. Pas 3. Six.

Bises, Emeline

PS : ton 1ᵉʳ refus de banque, envoie-le-moi. Je te jure, ça va te faire du bien de le raconter.`,
  },
  {
    jour: "J7",
    objet: "Tu es à mi-parcours, je te veux ici",
    preheader: "Petit check-in de capitaine. 2 escales faites, 3 devant toi. On tient le cap ?",
    promesse: "Bilan mi-parcours + rappel coffre",
    body: `Salut {{prenom}},

Check-in de capitaine. Semaine 2 du cahier.

Où t'en es vraiment ? (coche, c'est entre toi et moi)
· Tu as ton post-it sur le frigo ? Oui / Non
· Tu as ton kit banque scanné ? Oui / Non
· Tu as envoyé au moins 3 dossiers ? Oui / Non

Si 3 oui : t'es pile dans le bon timing. Attaque l'escale 3 cette semaine.

Si 1 ou 2 oui : tu n'as pas décroché, tu as juste ralenti. C'est OK. Reprends demain avec 30 min sur ce qui manque.

Si 0 oui : viens me voir. Réponds à ce mail et dis-moi ce qui te bloque. Je te débloque.

Et rappel : au bout des 5 escales, tu débloques le Coffre au trésor + mon offre rentrée.

Bises, Emeline`,
  },
  {
    jour: "J10",
    objet: "Comment j'ai trouvé ma 1ʳᵉ pépite à 45K",
    preheader: "58 visites inutiles avant celle-là. Tout le monde l'avait vue et l'avait zappée.",
    promesse: "Push escale 3 + story pépite Mulhouse",
    body: `Salut {{prenom}},

Ma 1ʳᵉ pépite, j'ai failli la laisser passer.

58 visites avant. Toutes inutiles. Je commençais à douter.

Ce T2 à Mulhouse à 78 K€, annonce moche, photos floues, description en 4 lignes. Tout le monde passait.

J'y suis allée par lassitude. Et je l'ai vue, elle, pas l'annonce : copro saine, chaudière neuve de 2 ans, métro à 6 min à pied.

J'ai signé 3 jours plus tard. Négociée à 72 K€.

6 ans après : loué 620 €/mois, elle vaut 110 K€.

Ce qui m'a fait dire oui ce jour-là, c'est une grille de lecture. Pas un coup de cœur. Une grille. Elle est dans l'escale 3 : [lien]

Mission cette semaine : 5 annonces à analyser. Pas 1. Cinq.

Bises, Emeline

PS : envoie-moi l'analyse de ton annonce favorite en réponse. Je te dis en 24h si tu fonces ou si tu passes.`,
  },
  {
    jour: "J14",
    objet: "Le piège n°1 sur les devis travaux (je l'ai pris)",
    preheader: "+9 K€ que j'aurais pu éviter en relisant 5 minutes de plus.",
    promesse: "Push escale 4 + story devis piégé",
    body: `Salut {{prenom}},

Mon 3ᵉ bien, je l'ai acheté avec 18 K€ de travaux prévus. J'ai fini à 27 K€. +50%.

Pourquoi ? J'avais validé un devis sans vraiment le lire. Carte de visite propre, artisan sympa, atelier à 200 m.

Ce qui manquait : l'électroménager, le plafond des peintures, la TVA à 10% (il l'avait mis à 20%). +9 K€.

Aujourd'hui je lis un devis comme un contrat de divorce. Ligne par ligne, piège par piège.

Dans l'escale 4, je t'ai préparé le vrai devis qui m'a eue. 5 erreurs à repérer. Tu joues : [lien]

Bises, Emeline

PS : si un artisan refuse d'écrire son devis ou de fournir sa décennale, fuis. Pas de négociation, pas d'exception.`,
  },
  {
    jour: "J17",
    objet: "Mon annonce qui a eu 200 candidatures",
    preheader: "Pas de recette magique. Juste 3 trucs que 95% des bailleurs font mal.",
    promesse: "Push escale 5 + story annonce locatif",
    body: `Salut {{prenom}},

L'été 2019, j'ai mis une annonce en ligne à 14h.

À 20h j'avais 200 candidatures. Pas 20. Deux cents.

Le secret ? 3 trucs que 95% des bailleurs font mal :
· Une photo lumineuse (pas ton tel tenu de travers)
· Une phrase d'accroche qui parle d'un bénéfice pas d'un mètre carré
· Des conditions claires en bas de l'annonce (filtre les candidats zéro)

Et surtout : une grille de tri pour pas noyer dans les dossiers.

Escale 5, le package complet : [lien]

Bises, Emeline

PS : l'ancien me dit que ma pire erreur sur les locataires, c'était le profil « sur le papier parfait ». On y reviendra.`,
  },
  {
    jour: "J21",
    objet: "Tu as débloqué le Coffre au trésor 🏆",
    preheader: "Tu as bouclé les 5 escales. Deux portes s'ouvrent pour la rentrée.",
    promesse: "Coffre + double funnel Family/Academy",
    body: `Salut {{prenom}},

Tu l'as fait. 5 escales, 5 tampons. Ton passeport d'investisseur 2026 est complet.

Je t'ouvre le Coffre : [lien]

Deux portes, deux rythmes, zéro mauvaise réponse :

· La voie communauté · ES Family · 29 €/mois · Suivi mensuel + lives + entraide
· La voie coaching · Academy · 998 € · 5 sprints + coaching individuel + garantie

Prends le temps. Regarde les deux. Choisis ce qui colle à TA vitesse.

Ou fais ni l'un ni l'autre et garde juste tes accès cahier, ça me va aussi. Pas de pression, jamais.

Bises, Emeline

PS : l'offre Academy inclut 3 mois d'ES Family offerts. Si tu hésites, prends Academy, tu as les deux.`,
  },
  {
    jour: "J28",
    objet: "Tes accès expirent dans 7 jours",
    preheader: "Si tu as décroché en route, je te tends une corde.",
    promesse: "Relance décrocheurs + offre de rattrapage",
    body: `Salut {{prenom}},

Soyons honnêtes. Si t'ouvres ce mail, soit t'es en mode « j'ai tout fait » (bravo), soit t'as décroché en route.

Si t'as décroché : pas grave. C'est exactement pour ça que je t'écris.

Tes accès au cahier restent ouverts jusqu'au 31 août. Après, je ferme pour passer à la rentrée.

Ce qui marche bien quand on reprend après avoir lâché : ne reprends pas là où tu t'es arrêtée. Prends 20 minutes aujourd'hui pour FAIRE la mission de l'escale où tu en étais. Juste 20 minutes. Pas relire, pas planifier. Faire.

Lien direct vers ta carte : [lien]

Bises, Emeline

PS : si c'est vraiment pas le bon moment, réponds-moi, je te libère du suivi. Zéro jugement.`,
  },
  {
    jour: "J35",
    objet: "Dernière chance offre rentrée (et je te laisse tranquille)",
    preheader: "L'Academy à 998 € se referme vendredi minuit. Après c'est 1 490 €.",
    promesse: "Closer Academy + deadline ferme",
    body: `Salut {{prenom}},

Dernière lettre, promis.

L'offre Academy été 2026 se ferme vendredi minuit. 5 jours.

Après, elle passe à 1 490 €. Ceux qui s'inscrivent maintenant gardent le prix ainsi que les 3 mois d'ES Family offerts.

Si tu as fait le cahier et que tu veux qu'on avance ensemble sur ta rentrée : [lien appel]

Si tu as fait le cahier et que ça te va comme ça, parfait. Garde tes accès, ils restent ouverts jusqu'au 31 août.

Soit c'est oui et on bosse ensemble pour ton 1ᵉʳ acte signé d'ici décembre. Soit c'est non et on se recroise à l'édition 2027.

Zéro pression, jamais.

Bises, Emeline

PS : 72% des alumnis Academy signent leur 1ᵉʳ bien dans les 6 mois. Si tu hésites, appelle Antony en 15 min, gratuit, pas vendeur. Il te dit juste ce qu'il voit.`,
  },
];

function EmailsScreen() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-body relative" style={{ color: C.ink }}>
      <div className="absolute top-4 right-4 text-5xl animate-float">💌</div>
      <header className="mb-8">
        <p className="font-hand text-3xl mb-1" style={{ color: C.coral }}>
          Séquence email
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
          <span className="highlight-yellow">10 mails</span> sur 5 semaines
        </h1>
        <p className="mt-3 text-base" style={{ color: C.inkSoft }}>
          Arc narratif : Emeline raconte SON été 2017 en parallèle de TON été 2026. Cliffhangers, PS qui créent du retour, deadline ferme.
        </p>
      </header>

      <div className="space-y-3">
        {EMAILS.map((e, i) => {
          const open = openIdx === i;
          return (
            <div
              key={e.jour}
              className="overflow-hidden"
              style={{
                background: C.paper,
                border: `2px solid ${C.ink}`,
                borderRadius: "14px",
                boxShadow: `3px 3px 0 ${i % 2 === 0 ? C.lagon : C.coral}`,
              }}
            >
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full text-left p-4 flex items-start gap-4"
              >
                <div
                  className="flex-shrink-0 w-14 h-14 flex items-center justify-center font-hand text-2xl"
                  style={{ background: i % 2 === 0 ? C.lagon : C.coral, color: "white", borderRadius: "12px" }}
                >
                  {e.jour}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base mb-0.5">{e.objet}</p>
                  <p className="text-xs truncate" style={{ color: C.inkSoft }}>{e.preheader}</p>
                  <p className="text-xs mt-1 italic" style={{ color: C.lagonDark }}>→ {e.promesse}</p>
                </div>
                <span className="text-xl flex-shrink-0" style={{ color: C.inkSoft }}>
                  {open ? "−" : "+"}
                </span>
              </button>
              {open && (
                <div className="px-4 pb-5 pt-1">
                  <div
                    className="p-4 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed"
                    style={{ background: C.sand, borderRadius: "10px", color: C.ink }}
                  >
                    {e.body}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section
        className="mt-10 p-5 text-sm italic"
        style={{ background: C.sun + "40", borderRadius: "16px", color: C.ink }}
      >
        <span className="font-hand not-italic text-xl" style={{ color: C.coral }}>Note Tiffany :</span> tous
        ces mails sont rédigés pour être modifiables en DB admin (zéro hardcoding). Tu pourras ajuster chaque texte sans passer par Claude ni par Emeline.
      </section>
    </main>
  );
}
