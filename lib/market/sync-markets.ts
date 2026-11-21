// Synchronizacja rynków (npm run sync:markets):
//   Binance   → lista par, którymi można handlować (+ zasady zleceń),
//   CoinGecko → nazwy, logo i ranking monet, dopasowane po symbolu.
import { prisma } from "@/lib/db";
import { getExchangeMarkets } from "./binance";
import { getTopCoins, type CoinGeckoCoin } from "./coingecko";

// 1500 monet z CoinGecko wystarcza, żeby dopasować prawie wszystkie monety z Binance.
const COINGECKO_POOL = 1500;

// Symbol → moneta. Lista jest od największej kapitalizacji, więc przy powtórzonym symbolu
// (różne monety z tym samym tickerem) zostaje ta większa.
const indexBySymbol = (coins: CoinGeckoCoin[]) => {
  const map = new Map<string, CoinGeckoCoin>();
  for (const coin of coins) {
    const symbol = coin.symbol.toUpperCase();
    if (!map.has(symbol)) map.set(symbol, coin);
  }
  return map;
};

export const syncMarkets = async () => {
  const [markets, coins] = await Promise.all([getExchangeMarkets(), getTopCoins(COINGECKO_POOL)]);
  const coinBySymbol = indexBySymbol(coins);

  const symbols = [...new Set(markets.flatMap((m) => [m.base, m.quote]))];
  const matched = symbols.filter((s) => coinBySymbol.has(s)).map((s) => coinBySymbol.get(s)!);
  const marketSymbols = markets.map((m) => m.symbol);

  // Postgres `unnest(tablica1, tablica2, …)` zamienia kilka tablic na wiersze tabeli.
  // Dzięki temu zapisujemy setki wierszy jednym zapytaniem zamiast setek osobnych.
  const [, , , deactivated] = await prisma.$transaction([
    // 1. Każda moneta musi być w tabeli Asset (pary się do niej odwołują). Nowa dostaje nazwę = symbol.
    prisma.asset.createMany({ data: symbols.map((s) => ({ symbol: s, name: s })), skipDuplicates: true }),

    // 2. Metadane z CoinGecko — tylko dla dopasowanych monet. Reszta zachowuje to, co miała.
    prisma.$executeRaw`
      UPDATE "Asset" AS a
      SET "name" = t.name, "coingeckoId" = t.id, "imageUrl" = t.image, "marketCapRank" = t.rank, "updatedAt" = now()
      FROM unnest(
        ${matched.map((c) => c.symbol.toUpperCase())}::text[],
        ${matched.map((c) => c.name)}::text[],
        ${matched.map((c) => c.id)}::text[],
        ${matched.map((c) => c.image)}::text[],
        ${matched.map((c) => c.market_cap_rank)}::int[]
      ) AS t(symbol, name, id, image, rank)
      WHERE a.symbol = t.symbol`,

    // 3. Pary: nowe dodajemy, istniejące aktualizujemy (zasady giełdy mogą się zmienić).
    prisma.$executeRaw`
      INSERT INTO "Market" ("symbol", "baseSymbol", "quoteSymbol", "tickSize", "stepSize", "minQty", "minNotional", "isActive", "updatedAt")
      SELECT *, true, now() FROM unnest(
        ${marketSymbols}::text[],
        ${markets.map((m) => m.base)}::text[],
        ${markets.map((m) => m.quote)}::text[],
        ${markets.map((m) => m.tickSize)}::numeric[],
        ${markets.map((m) => m.stepSize)}::numeric[],
        ${markets.map((m) => m.minQty)}::numeric[],
        ${markets.map((m) => m.minNotional)}::numeric[]
      )
      ON CONFLICT ("symbol") DO UPDATE SET
        "isActive" = true, "tickSize" = EXCLUDED."tickSize", "stepSize" = EXCLUDED."stepSize",
        "minQty" = EXCLUDED."minQty", "minNotional" = EXCLUDED."minNotional", "updatedAt" = now()`,

    // 4. Pary, których Binance już nie notuje, wyłączamy — nie usuwamy, bo mogą mieć historię transakcji.
    prisma.$executeRaw`
      UPDATE "Market" SET "isActive" = false, "updatedAt" = now()
      WHERE "isActive" AND NOT ("symbol" = ANY(${marketSymbols}::text[]))`,
  ]);

  return { markets: markets.length, assets: symbols.length, matched: matched.length, deactivated };
};
