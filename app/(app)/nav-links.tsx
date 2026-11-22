"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

export const MAIN_LINKS = [
  { href: "/dashboard", label: "Portfel" },
  { href: "/markets", label: "Rynek" },
  { href: "/orders", label: "Zlecenia" },
  { href: "/ranking", label: "Ranking" },
] as const;

// Komponent głównych zakładek nawigacji.
export const NavLinks = () => (
  <Suspense fallback={<LinkList pathname={null} />}>
    <ActiveNavLinks />
  </Suspense>
);

// Komponent zakładek z podświetleniem aktywnej strony.
const ActiveNavLinks = () => <LinkList pathname={usePathname()} />;

// Komponent listy linków nawigacji.
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
