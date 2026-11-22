import Link from "next/link";
import { Suspense } from "react";
import { ToastProvider } from "@/components/toast";
import { Avatar } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { UrlNotice } from "./url-notice";
import { VerifyEmailBanner } from "./verify-email-banner";

// Układ zalogowanej części aplikacji: pasek nawigacji i treść.
const AppLayout = ({ children }: LayoutProps<"/">) => (
  <ToastProvider>
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link href="/dashboard" className="font-semibold">
          Crypto Sandbox
        </Link>
        <NavLinks />
        <div className="ml-auto">
          <Suspense fallback={<Avatar name="" />}>
            <CurrentUserMenu />
          </Suspense>
        </div>
      </nav>
    </header>
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      <Suspense fallback={null}>
        <EmailReminder />
      </Suspense>
      {children}
    </main>
    <Suspense fallback={null}>
      <UrlNotice />
    </Suspense>
  </ToastProvider>
);

export default AppLayout;

// Komponent pobierający użytkownika i wyświetlający jego menu.
const CurrentUserMenu = async () => {
  const user = await getCurrentUser();
  return <UserMenu name={user.name} email={user.email} image={user.image} />;
};

// Komponent pokazujący przypomnienie o niepotwierdzonym e-mailu.
const EmailReminder = async () => {
  const user = await getCurrentUser();
  return user.emailVerified ? null : <VerifyEmailBanner email={user.email} />;
};
