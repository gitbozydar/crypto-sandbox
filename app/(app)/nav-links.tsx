"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

// Główne zakładki. Na wąskich ekranach są ukryte w pasku i pokazują się w menu użytkownika.
export const MAIN_LINKS = [
  { href: "/dashboard", label: "Portfel" },
  { href: "/markets", label: "Rynek" },
] as const;

// Na trasach dynamicznych (np. /markets/[symbol]) ścieżka jest znana dopiero w czasie żądania,
// więc statyczna powłoka renderuje linki bez podświetlenia, a aktywny link dochodzi po chwili.
export const NavLinks = () => (
  <Suspense fallback={<LinkList pathname={null} />}>
    <ActiveNavLinks />
  </Suspense>
);

const ActiveNavLinks = () => <LinkList pathname={usePathname()} />;

const LinkList = ({ pathname }: { pathname: string | null }) => (
  <ul className="hidden gap-1 text-sm font-medium sm:flex">
    {MAIN_LINKS.map(({ href, label }) => {
      const active = pathname?.startsWith(href);
      return (
        <li key={href}>
          <Link
            href={href}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        </li>
      );
    })}
  </ul>
);
