import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-es-green-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="font-serif text-lg font-bold text-white hover:text-es-gold transition-colors">
              Emeline Siron
            </Link>
            <p className="text-white/30 text-xs mt-2">Formatrice en investissement immobilier</p>
            <p className="text-white/30 text-xs">Aix-en-Provence, France</p>
          </div>

          {/* Formations */}
          <div>
            <h4 className="text-sm font-medium text-white/60 mb-3">Formations</h4>
            <div className="flex flex-col gap-2">
              <Link href="/academy" className="text-sm text-white/40 hover:text-white transition-colors">ES Academy</Link>
              <Link href="/family" className="text-sm text-white/40 hover:text-white transition-colors">ES Family</Link>
              <Link href="/connexion" className="text-sm text-white/40 hover:text-white transition-colors">Espace élève</Link>
            </div>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="text-sm font-medium text-white/60 mb-3">Ressources</h4>
            <div className="flex flex-col gap-2">
              <Link href="/blog" className="text-sm text-white/40 hover:text-white transition-colors">Blog</Link>
              <Link href="/academy#partenaires" className="text-sm text-white/40 hover:text-white transition-colors">Partenaires</Link>
              <Link href="/#contact" className="text-sm text-white/40 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-medium text-white/60 mb-3">Légal</h4>
            <div className="flex flex-col gap-2">
              <Link href="/mentions-legales" className="text-sm text-white/40 hover:text-white transition-colors">Mentions légales</Link>
              <Link href="/cgv" className="text-sm text-white/40 hover:text-white transition-colors">CGV</Link>
              <Link href="/politique-confidentialite" className="text-sm text-white/40 hover:text-white transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/20">
          © {new Date().getFullYear()} Emeline Siron. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
