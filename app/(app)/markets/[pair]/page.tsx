import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PairSkeleton } from "@/components/states";
import { TradesTable } from "@/components/trades-table";
import { QUOTE_ASSETS } from "@/lib/market/binance";
import { getMarket, getMarketsForBase, getTickers, marketHref } from "@/lib/market/markets";
import { getCurrentUser } from "@/lib/session";
import { getBalances, getRecentTrades } from "@/lib/trading/queries";
import { CoinView } from "./coin-view";

const PairPage = ({ params }: PageProps<"/markets/[pair]">) => (
  <>
    <Link href="/markets" className="text-sm text-muted hover:text-foreground">
      ← Rynek
    </Link>
    {/* Parametr z adresu znamy dopiero w czasie żądania, więc treść musi być w <Suspense>. */}
    <Suspense fallback={<PairSkeleton />}>
      <Pair params={params} />
    </Suspense>
  </>
);

export default PairPage;

// Kolejność walut w przełączniku par: tak jak w QUOTE_ASSETS (USDT pierwsze).
const byQuoteOrder = (a: string, b: string) =>
  QUOTE_ASSETS.indexOf(a as never) - QUOTE_ASSETS.indexOf(b as never);

const Pair = async ({ params }: Pick<PageProps<"/markets/[pair]">, "params">) => {
  const user = await getCurrentUser();
  const [base, quote] = decodeURIComponent((await params).pair).toUpperCase().split("-");

  // Sam symbol monety (np. /markets/ETH) → przekierowanie na jej pierwszą parę, zwykle ETH/USDT.
  if (!quote) {
    const quotes = (await getMarketsForBase(base)).map((m) => m.quote).sort(byQuoteOrder);
    if (!quotes.length) notFound();
    redirect(marketHref({ base, quote: quotes[0] }));
  }

  const market = await getMarket(base + quote);
  // Sprawdzamy base, bo samo sklejenie może pasować do innej pary (np. "BN"+"BBTC").
  if (!market || market.base !== base) notFound();

  const [pairs, tickers, balances, trades] = await Promise.all([
    getMarketsForBase(base),
    getTickers(),
    getBalances(user.id, [market.base, market.quote]),
    getRecentTrades(user.id, { market: market.symbol, take: 10 }),
  ]);

  return (
    <>
      <CoinView
        market={market}
        quotes={pairs.map((m) => m.quote).sort(byQuoteOrder)}
        initialTicker={tickers[market.symbol] ?? null}
        balances={{ base: balances[market.base], quote: balances[market.quote] }}
      />
      <TradesTable trades={trades} title={`Twoje transakcje ${market.base}/${market.quote}`} />
    </>
  );
};
