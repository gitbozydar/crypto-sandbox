// Typy i funkcje rynków, których może używać przeglądarka (bez dostępu do bazy).

export type MarketInfo = {
  symbol: string; // symbol na Binance, np. "BNBBTC"
  base: string; // moneta, którą kupujesz/sprzedajesz, np. "BNB"
  quote: string; // waluta, w której płacisz, np. "BTC"
  name: string; // nazwa monety, np. "BNB"
  imageUrl: string | null;
  rank: number | null; // pozycja w rankingu kapitalizacji (CoinGecko)
  // Zasady giełdy (jako tekst, żeby nie tracić precyzji):
  tickSize: string; // krok ceny — ile miejsc po przecinku ma cena
  stepSize: string; // krok ilości
  minQty: string; // minimalna ilość w zleceniu
  minNotional: string; // minimalna wartość zlecenia w walucie kwotowania
};

// Adres strony pary: /markets/BNB-BTC (czytelniej niż BNBBTC).
export const marketHref = (m: { base: string; quote: string }) => `/markets/${m.base}-${m.quote}`;
