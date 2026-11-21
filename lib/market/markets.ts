import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getAllTickers, type Ticker24h } from "./binance";
import type { MarketInfo } from "./markets-shared";

export { marketHref, type MarketInfo } from "./markets-shared";

// Wszystkie aktywne pary. Zmieniają się tylko przy synchronizacji (npm run sync:markets),
// więc trzymamy je w cache serwera przez kilka godzin.
export const getActiveMarkets = async (): Promise<MarketInfo[]> => {
  "use cache";
  cacheTag("markets");
  cacheLife("hours");

  const rows = await prisma.market.findMany({
    where: { isActive: true },
    include: { base: { select: { name: true, imageUrl: true, marketCapRank: true } } },
  });
  return rows.map((m) => ({
    symbol: m.symbol,
    base: m.baseSymbol,
    quote: m.quoteSymbol,
    name: m.base.name,
    imageUrl: m.base.imageUrl,
    rank: m.base.marketCapRank,
    tickSize: m.tickSize.toString(),
    stepSize: m.stepSize.toString(),
    minQty: m.minQty.toString(),
    minNotional: m.minNotional.toString(),
  }));
};

export const getMarket = async (symbol: string) => (await getActiveMarkets()).find((m) => m.symbol === symbol) ?? null;

// Wszystkie pary danej monety (BNB/USDT, BNB/BTC…) — do przełącznika na stronie pary.
export const getMarketsForBase = async (base: string) => (await getActiveMarkets()).filter((m) => m.base === base);

// Statystyki 24h wszystkich par jednym zapytaniem do Binance, wspólne dla wszystkich
// użytkowników i odświeżane co ~15 s. Ceny na żywo dochodzą potem przez WebSocket.
export const getTickers = async (): Promise<Record<string, Ticker24h>> => {
  "use cache";
  cacheTag("tickers");
  cacheLife({ stale: 10, revalidate: 15, expire: 60 });

  const tickers = await getAllTickers();
  return Object.fromEntries(tickers.map((t) => [t.symbol, t]));
};
