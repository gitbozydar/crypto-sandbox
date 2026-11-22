import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Page } from "@/components/page";
import { PairSkeleton } from "@/components/states";
import { TradesTable } from "@/components/trades-table";
import { QUOTE_ASSETS } from "@/lib/market/binance";
import { getCoinInfoFor } from "@/lib/market/coin-info";
import { getMarket, getMarketsForBase, getTickers, marketHref } from "@/lib/market/markets";
import { getCurrentUser } from "@/lib/session";
import { getOrders } from "@/lib/trading/orders";
import { getBalances, getRecentTrades } from "@/lib/trading/queries";
import { OrdersList } from "../../orders/orders-list";
import { CoinInfoCard } from "./coin-info-card";
import { CoinView } from "./coin-view";

// Strona pary handlowej.
const PairPage = ({ params }: PageProps<"/markets/[pair]">) => (
  <>
    <Link href="/markets" className="text-sm text-muted hover:text-foreground">
      ← Rynek
    </Link>
    <Page fallback={<PairSkeleton />}>
      <Pair params={params} />
    </Page>
  </>
);

export default PairPage;

const USD_QUOTES = ["USDT", "USDC", "FDUSD"];

// Funkcja sortująca waluty kwotowania w ustalonej kolejności.
const byQuoteOrder = (a: string, b: string) => QUOTE_ASSETS.indexOf(a as never) - QUOTE_ASSETS.indexOf(b as never);

// Komponent pobierający dane pary i wyświetlający wykres, zlecenia i transakcje.
const Pair = async ({ params }: Pick<PageProps<"/markets/[pair]">, "params">) => {
  const user = await getCurrentUser();
  const [base, quote] = decodeURIComponent((await params).pair)
    .toUpperCase()
    .split("-");

  if (!quote) {
    const quotes = (await getMarketsForBase(base)).map((m) => m.quote).sort(byQuoteOrder);
    if (!quotes.length) notFound();
    redirect(marketHref({ base, quote: quotes[0] }));
  }

  const market = await getMarket(base + quote);
  if (!market || market.base !== base) notFound();

  const [pairs, tickers, balances, trades, orders, coinInfo] = await Promise.all([
    getMarketsForBase(base),
    getTickers(),
    getBalances(user.id, [market.base, market.quote]),
    getRecentTrades(user.id, { market: market.symbol, take: 10 }),
    getOrders(user.id, market.symbol),
    getCoinInfoFor(market.base),
  ]);
  const hasOrders = orders.conditional.length > 0 || orders.recurring.length > 0;

  return (
    <>
      <CoinView
        market={market}
        quotes={pairs.map((m) => m.quote).sort(byQuoteOrder)}
        initialTicker={tickers[market.symbol] ?? null}
        balances={{ base: balances[market.base], quote: balances[market.quote] }}
        ath={coinInfo && USD_QUOTES.includes(market.quote) ? coinInfo.ath : null}
      />
      {coinInfo && <CoinInfoCard name={market.name} symbol={market.base} info={coinInfo} />}
      {hasOrders && <OrdersList orders={orders} />}
      <TradesTable trades={trades} title={`Twoje transakcje ${market.base}/${market.quote}`} />
    </>
  );
};
