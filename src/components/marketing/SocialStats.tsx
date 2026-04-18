const InstagramLogo = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden>
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#FEDA75" />
        <stop offset="25%" stopColor="#FA7E1E" />
        <stop offset="50%" stopColor="#D62976" />
        <stop offset="75%" stopColor="#962FBF" />
        <stop offset="100%" stopColor="#4F5BD5" />
      </radialGradient>
    </defs>
    <path
      fill="url(#ig-grad)"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
    />
  </svg>
);

const LinkedInLogo = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#0A66C2"
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    />
  </svg>
);

const MailLogo = () => (
  <svg className="w-8 h-8 text-es-green" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
    <path d="M17 4h3v2a4 4 0 01-4 4M7 4H4v2a4 4 0 004 4" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ArrowRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

const rows = [
  {
    href: "https://www.instagram.com/emelinesiron/",
    external: true,
    value: "85 000",
    label: "abonnés Instagram",
    icon: <InstagramLogo />,
  },
  {
    href: "https://www.linkedin.com/in/emeline-siron/",
    external: true,
    value: "25 000",
    label: "abonnés LinkedIn",
    icon: <LinkedInLogo />,
  },
  {
    href: "#newsletter",
    external: false,
    value: "26 000",
    label: "lecteurs — L'Immo Sans Prise de Tête",
    icon: <MailLogo />,
  },
];

export function SocialStats() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        {rows.map((r) => (
          <a
            key={r.label}
            href={r.href}
            {...(r.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="group flex items-center gap-5 bg-white rounded-2xl px-6 py-5 border border-es-cream-dark hover:border-es-green/40 hover:shadow-md transition-all"
          >
            <div className="w-16 h-16 rounded-xl bg-es-cream-light flex items-center justify-center shrink-0">
              <div className="scale-125">{r.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-es-text leading-none">
                {r.value}
              </p>
              <p className="text-base text-es-text-muted mt-2 truncate">
                {r.label}
              </p>
            </div>
            <span className="text-es-green/40 group-hover:text-es-green group-hover:translate-x-1 transition-all shrink-0">
              <ArrowRight />
            </span>
          </a>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-es-green rounded-2xl px-6 py-5 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <div className="scale-125"><TrophyIcon /></div>
          </div>
          <div className="min-w-0">
            <p className="font-serif text-lg font-bold leading-tight">
              N°1 influenceuse immo 2026
            </p>
            <p className="text-sm text-white/80 mt-1">Classement Le Revenu</p>
          </div>
        </div>

        <div className="bg-es-green rounded-2xl px-6 py-5 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <div className="scale-125"><EyeIcon /></div>
          </div>
          <div className="min-w-0">
            <p className="font-serif text-lg font-bold leading-tight">
              +20 millions de vues
            </p>
            <p className="text-sm text-white/80 mt-1">par trimestre</p>
          </div>
        </div>
      </div>
    </div>
  );
}
