// Klient publicznego API Binance (bez klucza). Binance jest naszym źródłem cen.

const BINANCE_REST = "https://api.binance.com/api/v3";
export const BINANCE_WS = "wss://stream.binance.com:9443";

// Waluty kwotowania, które obsługujemy. Pomijamy egzotyczne waluty fiat (TRY, IDR, JPY…).
export const QUOTE_ASSETS = ["USDT", "USDC", "FDUSD", "BTC", "ETH", "BNB", "EUR"] as const;
export type QuoteAsset = (typeof QUOTE_ASSETS)[number];

export const KLINE_INTERVALS = ["1m", "15m", "1h", "4h", "1d"] as const;
export type KlineInterval = (typeof KLINE_INTERVALS)[number];

// Świeca na wykresie. `time` w sekundach UNIX (początek świecy).
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

// Statystyki pary z ostatnich 24 godzin.
export type Ticker24h = {
  symbol: string;
  lastPrice: number;
  changePercent: number;
  high: number;
  low: number;
  quoteVolume: number; // obrót w walucie kwotowania
};

// REST i WebSocket zwracają te same dane pod innymi nazwami pól — obie wersje przechodzą tędy.
export const makeTicker = (symbol: string, last: string, open: string, high: string, low: string, quoteVolume: string): Ticker24h => {
  const change = Number(open) > 0 ? ((Number(last) - Number(open)) / Number(open)) * 100 : 0;
  return { symbol, lastPrice: Number(last), changePercent: change, high: Number(high), low: Number(low), quoteVolume: Number(quoteVolume) };
};

const get = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(BINANCE_REST + path, init);
  if (!res.ok) throw new Error(`Binance ${path} → ${res.status} ${await res.text()}`);
  return res.json();
};

// Wszystkie notowane pary z obsługiwanymi walutami kwotowania, razem z zasadami zleceń.
export const getExchangeMarkets = async () => {
  type Filter = { filterType: string; tickSize?: string; stepSize?: string; minQty?: string; minNotional?: string };
  type Info = { symbols: { symbol: string; baseAsset: string; quoteAsset: string; status: string; filters: Filter[] }[] };

  const info = await get<Info>("/exchangeInfo?permissions=SPOT");
  const quotes = new Set<string>(QUOTE_ASSETS);

  return info.symbols
    .filter((s) => s.status === "TRADING" && quotes.has(s.quoteAsset))
    .map((s) => {
      // Zasady giełdy są w tablicy "filters", każda pod swoją nazwą.
      const filter = (type: string) => s.filters.find((f) => f.filterType === type);
      return {
        symbol: s.symbol,
        base: s.baseAsset,
        quote: s.quoteAsset,
        tickSize: filter("PRICE_FILTER")?.tickSize ?? "0.00000001",
        stepSize: filter("LOT_SIZE")?.stepSize ?? "0.00000001",
        minQty: filter("LOT_SIZE")?.minQty ?? "0",
        minNotional: filter("NOTIONAL")?.minNotional ?? "0",
      };
    });
};

// Statystyki 24h wszystkich par giełdy jednym zapytaniem (wersja MINI = mniej pól).
export const getAllTickers = async () => {
  type Raw = { symbol: string; lastPrice: string; openPrice: string; highPrice: string; lowPrice: string; quoteVolume: string };
  const raw = await get<Raw[]>("/ticker/24hr?type=MINI");
  return raw.map((t) => makeTicker(t.symbol, t.lastPrice, t.openPrice, t.highPrice, t.lowPrice, t.quoteVolume));
};

export const getKlines = async (symbol: string, interval: KlineInterval): Promise<Candle[]> => {
  // Binance zwraca świece jako tablice: [czas otwarcia, open, high, low, close, wolumen, …]
  const raw = await get<[number, string, string, string, string, string][]>(
    `/klines?symbol=${symbol}&interval=${interval}&limit=500`,
  );
  return raw.map(([t, o, h, l, c, v]) => ({ time: t / 1000, open: +o, high: +h, low: +l, close: +c, volume: +v }));
};

// Najlepsza oferta kupna (bid) i sprzedaży (ask) w arkuszu zleceń — ceny wykonania zleceń.
export const getBookTicker = async (symbol: string) => {
  const t = await get<{ bidPrice: string; askPrice: string }>(`/ticker/bookTicker?symbol=${symbol}`, { cache: "no-store" });
  return { bid: t.bidPrice, ask: t.askPrice };
};
