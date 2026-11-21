import { headers } from "next/headers";
import { Suspense } from "react";
import { SectionsSkeleton } from "@/components/states";
import { Badge, Section } from "@/components/ui";
import { auth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getCurrentSession } from "@/lib/session";
import { DeleteAccount, ResetPortfolio, RevokeOtherSessions } from "./account-forms";
import { TwoFactorSettings } from "./two-factor-settings";

// Ustawienia: bezpieczeństwo (2FA, sesje) i konto (reset portfela, usunięcie). Dane osobowe są w /profile.
const SettingsPage = () => (
  <>
    <div>
      <h1 className="text-2xl font-semibold">Ustawienia</h1>
      <p className="text-sm text-muted">Bezpieczeństwo i zarządzanie kontem.</p>
    </div>
    {/* Sesję czytamy w czasie żądania, więc treść musi być w <Suspense>. */}
    <Suspense fallback={<SectionsSkeleton />}>
      <Settings />
    </Suspense>
  </>
);

export default SettingsPage;

// "Mozilla/5.0 (Macintosh…) … Chrome/…" → "Chrome · macOS"
const describeDevice = (userAgent?: string | null) => {
  const ua = userAgent ?? "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Przeglądarka";
  const system = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "nieznany system";
  return `${browser} · ${system}`;
};

const Settings = async () => {
  const { user, session } = await getCurrentSession();
  const sessions = await auth.api.listSessions({ headers: await headers() });

  return (
    <>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Bezpieczeństwo</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <TwoFactorSettings enabled={Boolean(user.twoFactorEnabled)} />

        <Section title="Aktywne sesje" description="Urządzenia, na których jesteś zalogowany.">
          <ul className="flex flex-col divide-y divide-border">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{describeDevice(s.userAgent)}</p>
                  <p className="text-xs text-muted">
                    {s.ipAddress || "nieznany adres IP"} · od {formatDateTime(s.createdAt)}
                  </p>
                </div>
                {s.token === session.token && <Badge tone="success">To urządzenie</Badge>}
              </li>
            ))}
          </ul>
          {sessions.length > 1 && <RevokeOtherSessions />}
        </Section>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Konto</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Portfel" description="Zacznij od nowa z kapitałem 10 000 USDT. Salda, transakcje i historia wartości zostaną usunięte.">
          <ResetPortfolio />
        </Section>

        <Section title="Usuń konto" description="Usuwa konto, portfel i całą historię. Tego nie da się cofnąć." danger>
          <DeleteAccount />
        </Section>
      </div>
    </>
  );
};
