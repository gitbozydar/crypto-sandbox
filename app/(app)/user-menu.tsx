"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChartIcon, ListIcon, LogOutIcon, MenuIcon, SettingsIcon, TrophyIcon, UserIcon, WalletIcon } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { MAIN_LINKS } from "./nav-links";

const MAIN_ICONS = { "/dashboard": WalletIcon, "/markets": ChartIcon, "/orders": ListIcon, "/ranking": TrophyIcon };

// Menu użytkownika w prawym górnym rogu: ☰ + awatar.
// Otwiera się kliknięciem. Zamyka po wybraniu pozycji, kliknięciu poza menu albo klawiszem Esc.
export const UserMenu = ({ name, email, image }: { name: string; email: string; image: string | null }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onClickOutside = (e: MouseEvent) => !root.current?.contains(e.target as Node) && close();
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  const signOut = async () => {
    close();
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu użytkownika"
        className={`flex items-center gap-2 rounded-full border py-1 pr-1 pl-3 transition-colors ${
          open ? "border-primary bg-surface-muted" : "border-border hover:border-border-strong"
        }`}
      >
        <MenuIcon className="size-4 text-muted" />
        <Avatar name={name} image={image} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-60">
          <div role="menu" className="overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/40">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Avatar name={name} image={image} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="truncate text-xs text-muted">{email}</p>
              </div>
            </div>

            {/* Główne zakładki — tylko na telefonie, bo na szerokim ekranie są w pasku. */}
            <div className="border-b border-border py-1 sm:hidden">
              {MAIN_LINKS.map(({ href, label }) => (
                <MenuLink key={href} href={href} icon={MAIN_ICONS[href]} onClick={close}>
                  {label}
                </MenuLink>
              ))}
            </div>

            <div className="py-1">
              <MenuLink href="/profile" icon={UserIcon} onClick={close}>
                Profil
              </MenuLink>
              <MenuLink href="/settings" icon={SettingsIcon} onClick={close}>
                Ustawienia
              </MenuLink>
            </div>
            <div className="border-t border-border py-1">
              <button role="menuitem" onClick={signOut} className={`${itemClass} text-danger`}>
                <LogOutIcon />
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const itemClass = "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-surface-muted";

const MenuLink = ({
  href,
  icon: IconComponent,
  onClick,
  children,
}: {
  href: string;
  icon: (p: { className?: string }) => ReactNode;
  onClick: () => void;
  children: ReactNode;
}) => (
  <Link role="menuitem" href={href} onClick={onClick} className={itemClass}>
    <IconComponent className="size-4 text-muted" />
    {children}
  </Link>
);
