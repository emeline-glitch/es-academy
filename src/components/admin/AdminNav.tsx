"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href?: string;
  icon?: string;
  sub?: boolean;
  section?: boolean;
}

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname() || "";

  return (
    <nav className="flex-1 py-2 overflow-y-auto">
      {items.map((item, idx) => {
        // Titre de section : non-clickable, minuscule grise, separateur visuel
        if (item.section) {
          return (
            <div
              key={`section-${idx}`}
              className={`px-6 ${idx === 0 ? "pt-2" : "pt-5"} pb-1.5 text-[10px] uppercase tracking-wider text-white/30 font-semibold`}
            >
              {item.label}
            </div>
          );
        }

        if (!item.href) return null;

        const active =
          item.href === pathname ||
          (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`flex items-center gap-3 ${item.sub ? "pl-12 pr-6 py-1.5 text-xs" : "px-6 py-2 text-sm"} transition-colors relative ${
              active
                ? "bg-white/15 text-white font-semibold"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-es-gold" />}
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
