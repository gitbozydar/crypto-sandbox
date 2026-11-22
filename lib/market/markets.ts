import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getAllTickers, type Ticker24h } from "./binance";
import type { MarketInfo } from "./markets-shared";

export { marketHref, type MarketInfo } from "./markets-shared";

// Funkcja pobierająca wszystkie aktywne pary.
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

// Funkcja zwracająca parę po symbolu.
export const getMarket = async (symbol: string) => (await getActiveMarkets()).find((m) => m.symbol === symbol) ?? null;

// Funkcja zwracająca wszystkie pary danej monety.
export const getMarketsForBase = async (base: string) => (await getActiveMarkets()).filter((m) => m.base === base);

// Funkcja pobierająca statystyki 24h wszystkich par.
export const getTickers = async (): Promise<Record<string, Ticker24h>> => {
  "use cache";
  cacheTag("tickers");
  cacheLife({ stale: 10, revalidate: 15, expire: 60 });

  const tickers = await getAllTickers();
  return Object.fromEntries(tickers.map((t) => [t.symbol, t]));
};
