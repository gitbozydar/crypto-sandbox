const PER_PAGE = 250;
// Funkcja czekająca podaną liczbę milisekund.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type CoinGeckoCoin = { id: string; symbol: string; name: string; image: string; market_cap_rank: number | null };

// Funkcja pobierająca jedną stronę rankingu CoinGecko.
const fetchPage = async (page: number): Promise<CoinGeckoCoin[] | null> => {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${PER_PAGE}&page=${page}`;
  const headers: HeadersInit = process.env.COINGECKO_API_KEY
    ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY }
    : {};

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status !== 429) throw new Error(`CoinGecko page=${page} → ${res.status}`);
    await sleep(Math.min(Number(res.headers.get("retry-after")) || 60, 120) * 1000);
  }
  console.warn(`CoinGecko: limit zapytań na stronie ${page} — używam tego, co już pobrano`);
  return null;
};

// Funkcja pobierająca największe monety według kapitalizacji.
export const getTopCoins = async (limit: number) => {
  const coins: CoinGeckoCoin[] = [];
  for (let page = 1; coins.length < limit; page++) {
    if (page > 1) await sleep(6_000);
    const batch = await fetchPage(page);
    if (!batch) break;
    coins.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return coins;
};
