import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";

export type CoinInfo = {
  ath: number;
  athDate: string;
  athChangePercent: number;
  atl: number;
  atlDate: string;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number | null;
  maxSupply: number | null;
};

// Funkcja pobierająca informacje o monecie z CoinGecko.
const getCoinInfo = async (coingeckoId: string): Promise<CoinInfo | null> => {
  "use cache";
  cacheTag("coin-info");
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coingeckoId)}`,
  );
  if (!res.ok) return null;
  const [coin] = await res.json();
  if (!coin) return null;
  return {
    ath: coin.ath,
    athDate: coin.ath_date,
    athChangePercent: coin.ath_change_percentage,
    atl: coin.atl,
    atlDate: coin.atl_date,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    circulatingSupply: coin.circulating_supply,
    maxSupply: coin.max_supply,
  };
};

// Funkcja pobierająca informacje o monecie po jej symbolu.
export const getCoinInfoFor = async (symbol: string) => {
  const asset = await prisma.asset.findUnique({ where: { symbol }, select: { coingeckoId: true } });
  return asset?.coingeckoId ? getCoinInfo(asset.coingeckoId) : null;
};
