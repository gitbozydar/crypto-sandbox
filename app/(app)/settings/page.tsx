import { headers } from "next/headers";
import { Page } from "@/components/page";
import { SectionsSkeleton } from "@/components/states";
import { Badge, Section } from "@/components/ui";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { describeDevice } from "@/lib/device";
import { getCurrentSession } from "@/lib/session";
import { DeleteAccount, RankingVisibility, ResetPortfolio, RevokeOtherSessions } from "./account-forms";
import { TwoFactorSettings } from "./two-factor-settings";

// Strona ustawień.
const SettingsPage = () => (
  <Page title="Ustawienia" description="Bezpieczeństwo i zarządzanie kontem." fallback={<SectionsSkeleton />}>
    <Settings />
  </Page>
);

export default SettingsPage;

// Komponent sekcji bezpieczeństwa i konta.
const Settings = async () => {
  const { user, session } = await getCurrentSession();
  const [sessions, privacy] = await Promise.all([
    auth.api.listSessions({ headers: await headers() }),
    prisma.user.findUnique({ where: { id: user.id }, select: { showInRanking: true } }),
  ]);

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
        <Section title="Prywatność" description="W rankingu inni widzą Twoje imię, zdjęcie, ROI i wartość portfela.">
          <RankingVisibility visible={privacy?.showInRanking ?? true} />
        </Section>

        <Section
          title="Portfel"
          description="Zacznij od nowa z kapitałem 10 000 USDT. Salda, transakcje i historia wartości zostaną usunięte."
        >
          <ResetPortfolio />
        </Section>

        <Section title="Usuń konto" description="Usuwa konto, portfel i całą historię. Tego nie da się cofnąć." danger>
          <DeleteAccount />
        </Section>
      </div>
    </>
  );
};
