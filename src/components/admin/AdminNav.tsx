"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname() || "";

  return (
    <nav className="flex-1 py-4">
      {items.map((item) => {
        const active =
          item.href === pathname ||
          (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors relative ${
              active
                ? "bg-white/15 text-white font-semibold"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-es-gold" />}
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
