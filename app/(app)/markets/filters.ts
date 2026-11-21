// Filtry listy rynku: waluta kwotowania, wyszukiwanie, sortowanie i strona.
// Cały stan siedzi w adresie URL (np. /markets?quote=BTC&sort=change&dir=asc),
// dzięki temu działa przycisk „wstecz” i link z filtrami można komuś wysłać.
import { QUOTE_ASSETS, type QuoteAsset } from "@/lib/market/binance";
import type { MarketInfo } from "@/lib/market/markets-shared";

export const PAGE_SIZE = 50;

// Kolumny do sortowania i kierunek przy pierwszym kliknięciu:
// ranking i nazwa rosnąco (#1, A→Z), liczby malejąco (największe na górze).
export const DEFAULT_DIR = { rank: "asc", name: "asc", price: "desc", change: "desc", volume: "desc" } as const;
export type SortKey = keyof typeof DEFAULT_DIR;
export type SortDir = "asc" | "desc";

export type FilterState = { quote: QuoteAsset; sort: SortKey; dir: SortDir; q: string; page: number };

export type MarketRow = MarketInfo & { price: number | null; changePercent: number | null; quoteVolume: number | null };

// Parametry z URL → poprawny stan (nieznane wartości zastępujemy domyślnymi).
export const parseFilters = (params: Record<string, string | string[] | undefined>): FilterState => {
  const get = (key: string) => String(params[key] ?? "");
  const quote = QUOTE_ASSETS.find((q) => q === get("quote").toUpperCase()) ?? "USDT";
  const sort = (get("sort") in DEFAULT_DIR ? get("sort") : "rank") as SortKey;
  const dir = get("dir") === "asc" || get("dir") === "desc" ? (get("dir") as SortDir) : DEFAULT_DIR[sort];
  return { quote, sort, dir, q: get("q").trim(), page: Math.max(1, Number(get("page")) || 1) };
};

// Stan → adres URL. Wartości domyślne pomijamy, żeby adres był krótki.
export const marketsUrl = ({ quote, sort, dir, q, page }: FilterState) => {
  const p = new URLSearchParams();
  if (quote !== "USDT") p.set("quote", quote);
  if (sort !== "rank") p.set("sort", sort);
  if (dir !== DEFAULT_DIR[sort]) p.set("dir", dir);
  if (q) p.set("q", q);
  if (page > 1) p.set("page", String(page));
  return p.size ? `/markets?${p}` : "/markets";
};

// Kliknięcie w nagłówek: ta sama kolumna → odwróć kierunek, inna → jej domyślny kierunek.
export const sortBy = (state: FilterState, column: SortKey): FilterState => {
  const dir = state.sort === column ? (state.dir === "asc" ? "desc" : "asc") : DEFAULT_DIR[column];
  return { ...state, sort: column, dir, page: 1 };
};

// Wyszukiwanie bez wielkości liter i polskich znaków ("ę" = "e").
const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export const matchesSearch = (m: MarketInfo, q: string) => !q || normalize(m.base).includes(normalize(q)) || normalize(m.name).includes(normalize(q));

const sortValue = {
  rank: (r: MarketRow) => r.rank,
  name: (r: MarketRow) => r.base,
  price: (r: MarketRow) => r.price,
  change: (r: MarketRow) => r.changePercent,
  volume: (r: MarketRow) => r.quoteVolume,
};

export const sortRows = (rows: MarketRow[], { sort, dir }: FilterState) => {
  const sign = dir === "asc" ? 1 : -1;
  return rows.sort((a, b) => {
    const x = sortValue[sort](a);
    const y = sortValue[sort](b);
    // Puste wartości (np. moneta bez rankingu) zawsze na końcu, a między sobą wg obrotu.
    if (x == null || y == null) {
      return x == null && y == null ? (b.quoteVolume ?? 0) - (a.quoteVolume ?? 0) : x == null ? 1 : -1;
    }
    return sign * (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number));
  });
};
