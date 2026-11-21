import { cacheLife, cacheTag } from "next/cache";

// Informacje o monecie z CoinGecko: maksimum wszech czasów (ATH), kapitalizacja, podaż.
// Wartości w USD. Cache 10 min — te dane zmieniają się wolno, a publiczne API ma limit zapytań.
export type CoinInfo = {
  ath: number;
  athDate: string;
  athChangePercent: number; // o ile % obecna cena jest niżej od ATH
  atl: number;
  atlDate: string;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number | null;
  maxSupply: number | null;
};

export const getCoinInfo = async (coingeckoId: string): Promise<CoinInfo | null> => {
  "use cache";
  cacheTag("coin-info");
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coingeckoId)}`);
  if (!res.ok) return null; // np. limit zapytań — strona pokaże się bez tej karty
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
