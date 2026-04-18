import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-es-green-dark relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark via-es-green to-es-green-light/20" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative">
          <Link href="/" className="font-serif text-xl font-bold text-white">
            Emeline Siron
          </Link>
        </div>

        <div className="relative">
          <h1 className="font-serif text-4xl font-bold text-white leading-tight mb-4">
            Ton espace<br />
            <span className="text-es-gold">de formation</span>
          </h1>
          <p className="text-white/60 leading-relaxed max-w-md">
            Accède à tes modules, suis ta progression, télécharge tes outils et échange avec la communauté.
          </p>
        </div>

        <div className="relative flex items-center gap-6 text-sm text-white/40">
          <span>14 modules</span>
          <span>·</span>
          <span>30h de vidéo</span>
          <span>·</span>
          <span>60 outils</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-es-cream">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="font-serif text-xl font-bold text-es-green">
              Emeline Siron
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-es-cream-dark p-8">
            {children}
          </div>
          <p className="text-center text-xs text-es-text-muted/50 mt-6">
            <Link href="/" className="hover:text-es-green transition-colors">← Retour au site</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
