import { after } from "next/server";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/states";
import { TradesTable } from "@/components/trades-table";
import { ButtonLink, Card } from "@/components/ui";
import { getPortfolio, getValueHistory, recordSnapshotIfStale } from "@/lib/portfolio/portfolio";
import { getCurrentUser } from "@/lib/session";
import { getRecentTrades } from "@/lib/trading/queries";
import { AllocationDonut } from "./allocation-donut";
import { HoldingsTable } from "./holdings-table";
import { StatTiles } from "./stat-tiles";
import { ValueChart } from "./value-chart";

// Sesję czytamy w czasie żądania, więc treść musi być w <Suspense>.
const DashboardPage = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <Dashboard />
  </Suspense>
);

export default DashboardPage;

const Dashboard = async () => {
  const user = await getCurrentUser();
  const portfolio = await getPortfolio(user.id);
  const [history, trades] = await Promise.all([
    getValueHistory(portfolio.walletId, portfolio.total),
    getRecentTrades(user.id),
  ]);

  // Punkt na wykresie także bez transakcji (najwyżej raz na godzinę), już po wysłaniu strony.
  after(() => recordSnapshotIfStale(portfolio.walletId, portfolio.total));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cześć, {user.name}</h1>
          <p className="text-sm text-muted">Portfel „{portfolio.walletName}” · wycena w USDT</p>
        </div>
        <ButtonLink href="/markets" size="sm">
          Handluj
        </ButtonLink>
      </div>

      <StatTiles portfolio={portfolio} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <ValueChart points={history} initial={portfolio.initial} />
        </Card>
        <Card>
          <AllocationDonut holdings={portfolio.holdings} total={portfolio.total} />
        </Card>
      </div>

      <HoldingsTable holdings={portfolio.holdings} />
      <TradesTable trades={trades} title="Ostatnie transakcje" showMarket />
    </>
  );
};
