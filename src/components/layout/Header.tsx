"use client";

import { useState } from "react";
import Link from "next/link";

const SocialIcons = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <a
      href="https://www.instagram.com/emelinesiron/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="text-gray-400 hover:text-es-green transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.757.91.957 1.47.163.46.349 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.349-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.349-1.26-.403-2.43C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.063 2.293c.46-.163 1.26-.349 2.43-.403C8.759 1.832 9.139 1.82 12 1.82h.343M12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.902.333 4.14.63a5.876 5.876 0 00-2.126 1.384A5.876 5.876 0 00.63 4.14C.333 4.902.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.151.558 2.913a5.876 5.876 0 001.384 2.126 5.876 5.876 0 002.126 1.384c.762.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.151-.261 2.913-.558a5.876 5.876 0 002.126-1.384 5.876 5.876 0 001.384-2.126c.297-.762.499-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.059-1.278-.261-2.151-.558-2.913a5.876 5.876 0 00-1.384-2.126A5.876 5.876 0 0019.86.63C19.098.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    </a>
    <a
      href="https://www.linkedin.com/in/emeline-siron/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LinkedIn"
      className="text-gray-400 hover:text-es-green transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    </a>
    <a
      href="https://www.youtube.com/@emelinesiron"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="YouTube"
      className="text-gray-400 hover:text-es-green transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </a>
  </div>
);

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
            Qui est Emeline ?
          </Link>
        </nav>

        {/* Social + CTA + Connexion */}
        <div className="hidden md:flex items-center gap-3">
          <SocialIcons />
          <span className="w-px h-5 bg-gray-200" />
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
              Qui est Emeline ?
            </Link>
            <hr className="border-gray-100 my-1" />
            <SocialIcons className="px-3 py-2" />
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
