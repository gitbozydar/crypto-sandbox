export type MarketInfo = {
  symbol: string;
  base: string;
  quote: string;
  name: string;
  imageUrl: string | null;
  rank: number | null;
  tickSize: string;
  stepSize: string;
  minQty: string;
  minNotional: string;
};

// Funkcja zwracająca adres strony pary.
export const marketHref = (m: { base: string; quote: string }) => `/markets/${m.base}-${m.quote}`;
