import Link from "next/link";
import { Suspense } from "react";
import { ToastProvider } from "@/components/toast";
import { Avatar } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { UrlNotice } from "./url-notice";
import { VerifyEmailBanner } from "./verify-email-banner";

// Wspólny układ zalogowanej części aplikacji: górny pasek + treść.
const AppLayout = ({ children }: LayoutProps<"/">) => (
  // ToastProvider: powiadomienia (useToast) dostępne na każdej stronie zalogowanej części.
  <ToastProvider>
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link href="/dashboard" className="font-semibold">
          Crypto Sandbox
        </Link>
        <NavLinks />
        <div className="ml-auto">
          {/* Dane użytkownika znamy dopiero w czasie żądania — do tego czasu sam awatar. */}
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
    {/* Powiadomienie po kliknięciu linku z maila (czyta parametry adresu → musi być w <Suspense>). */}
    <Suspense fallback={null}>
      <UrlNotice />
    </Suspense>
  </ToastProvider>
);

export default AppLayout;

const CurrentUserMenu = async () => {
  const user = await getCurrentUser();
  return <UserMenu name={user.name} email={user.email} image={user.image} />;
};

const EmailReminder = async () => {
  const user = await getCurrentUser();
  return user.emailVerified ? null : <VerifyEmailBanner email={user.email} />;
};
