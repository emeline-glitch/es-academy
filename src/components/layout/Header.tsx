"use client";

import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  activePage?: "home" | "academy" | "family";
}

export function Header({ activePage = "home" }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const ctaHref = activePage === "family"
    ? "https://www.skool.com/es-family"
    : "/academy";
  const ctaText = activePage === "family"
    ? "Rejoindre ES Family"
    : "Rejoindre la formation";
  const ctaClass = activePage === "family"
    ? "bg-es-terracotta hover:bg-es-terracotta-dark"
    : "bg-es-green hover:bg-es-green-light";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-serif text-lg sm:text-xl font-bold text-es-green hover:text-es-green-light transition-colors">
          Emeline Siron
        </Link>

        {/* Nav desktop — Academy et Family avec badges couleur */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/academy"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activePage === "academy"
                ? "bg-es-green text-white"
                : "text-es-green hover:bg-es-green/10"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activePage === "academy" ? "bg-white" : "bg-es-green"}`} />
            ES Academy
          </Link>
          <Link
            href="/family"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activePage === "family"
                ? "bg-es-terracotta text-white"
                : "text-es-terracotta hover:bg-es-terracotta/10"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activePage === "family" ? "bg-white" : "bg-es-terracotta"}`} />
            ES Family
          </Link>
          <span className="w-px h-5 bg-gray-200 mx-2" />
          <Link href="/simulateurs" className="px-3 py-1.5 text-sm text-gray-500 hover:text-es-green transition-colors">
            Simulateurs
          </Link>
          <Link href="/blog" className="px-3 py-1.5 text-sm text-gray-500 hover:text-es-green transition-colors">
            Blog
          </Link>
          <Link href="/a-propos" className="px-3 py-1.5 text-sm text-gray-500 hover:text-es-green transition-colors">
            À propos
          </Link>
        </nav>

        {/* CTA + Connexion */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/connexion" className="text-sm text-gray-500 hover:text-es-green transition-colors">
            Connexion
          </Link>
          <a
            href={ctaHref}
            target={activePage === "family" ? "_blank" : undefined}
            rel={activePage === "family" ? "noopener noreferrer" : undefined}
            className={`inline-flex items-center justify-center font-medium rounded-full px-5 py-2 text-sm text-white transition-all shadow-sm hover:shadow-md ${ctaClass}`}
          >
            {ctaText}
          </a>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6 text-es-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-es-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2">
            <Link href="/academy" className="flex items-center gap-2 text-sm text-es-green font-medium py-2.5 px-3 rounded-lg hover:bg-es-green/5" onClick={() => setMobileOpen(false)}>
              <span className="w-2 h-2 rounded-full bg-es-green" />
              ES Academy
            </Link>
            <Link href="/family" className="flex items-center gap-2 text-sm text-es-terracotta font-medium py-2.5 px-3 rounded-lg hover:bg-es-terracotta/5" onClick={() => setMobileOpen(false)}>
              <span className="w-2 h-2 rounded-full bg-es-terracotta" />
              ES Family
            </Link>
            <Link href="/simulateurs" className="text-sm text-gray-600 py-2.5 px-3 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
              Simulateurs
            </Link>
            <Link href="/blog" className="text-sm text-gray-600 py-2.5 px-3 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
              Blog
            </Link>
            <Link href="/a-propos" className="text-sm text-gray-600 py-2.5 px-3 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
              À propos
            </Link>
            <hr className="border-gray-100 my-1" />
            <Link href="/connexion" className="text-sm text-es-green font-medium py-2.5 px-3" onClick={() => setMobileOpen(false)}>
              Connexion
            </Link>
            <a
              href={ctaHref}
              className={`text-center font-medium rounded-full px-4 py-3 text-sm text-white ${ctaClass}`}
            >
              {ctaText}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
