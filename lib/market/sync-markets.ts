import { prisma } from "@/lib/db";
import { getExchangeMarkets } from "./binance";
import { getTopCoins, type CoinGeckoCoin } from "./coingecko";

const COINGECKO_POOL = 1500;

// Funkcja grupująca monety CoinGecko po symbolu.
const indexBySymbol = (coins: CoinGeckoCoin[]) => {
  const map = new Map<string, CoinGeckoCoin>();
  for (const coin of coins) {
    const symbol = coin.symbol.toUpperCase();
    if (!map.has(symbol)) map.set(symbol, coin);
  }
  return map;
};

// Funkcja synchronizująca pary z Binance i metadane z CoinGecko.
export const syncMarkets = async () => {
  const [markets, coins] = await Promise.all([getExchangeMarkets(), getTopCoins(COINGECKO_POOL)]);
  const coinBySymbol = indexBySymbol(coins);

  const symbols = [...new Set(markets.flatMap((m) => [m.base, m.quote]))];
  const matched = symbols.filter((s) => coinBySymbol.has(s)).map((s) => coinBySymbol.get(s)!);
  const marketSymbols = markets.map((m) => m.symbol);

  const [, , , deactivated] = await prisma.$transaction([
    prisma.asset.createMany({ data: symbols.map((s) => ({ symbol: s, name: s })), skipDuplicates: true }),

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

    prisma.$executeRaw`
      UPDATE "Market" SET "isActive" = false, "updatedAt" = now()
      WHERE "isActive" AND NOT ("symbol" = ANY(${marketSymbols}::text[]))`,
  ]);

  return { markets: markets.length, assets: symbols.length, matched: matched.length, deactivated };
};
