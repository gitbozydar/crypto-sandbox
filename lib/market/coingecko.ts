// Klient CoinGecko — tylko do metadanych monet (nazwa, logo, ranking), nie do cen.
// Publiczne API pozwala na ok. 5–15 zapytań na minutę, stąd przerwy między stronami.

const PER_PAGE = 250; // maksimum dozwolone przez API
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type CoinGeckoCoin = { id: string; symbol: string; name: string; image: string; market_cap_rank: number | null };

// Jedna strona rankingu. Zwraca null, gdy mimo czekania wciąż przekraczamy limit zapytań.
const fetchPage = async (page: number): Promise<CoinGeckoCoin[] | null> => {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${PER_PAGE}&page=${page}`;
  // Opcjonalny darmowy klucz "Demo" (COINGECKO_API_KEY w .env) podnosi limit zapytań.
  const headers: HeadersInit = process.env.COINGECKO_API_KEY ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY } : {};

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status !== 429) throw new Error(`CoinGecko page=${page} → ${res.status}`);
    // 429 = za dużo zapytań → czekamy tyle sekund, ile podaje serwer (domyślnie 60).
    await sleep(Math.min(Number(res.headers.get("retry-after")) || 60, 120) * 1000);
  }
  console.warn(`CoinGecko: limit zapytań na stronie ${page} — używam tego, co już pobrano`);
  return null;
};

// Top `limit` monet według kapitalizacji (od największej).
export const getTopCoins = async (limit: number) => {
  const coins: CoinGeckoCoin[] = [];
  for (let page = 1; coins.length < limit; page++) {
    if (page > 1) await sleep(6_000);
    const batch = await fetchPage(page);
    if (!batch) break;
    coins.push(...batch);
    if (batch.length < PER_PAGE) break; // ostatnia strona
  }
  return coins;
};
