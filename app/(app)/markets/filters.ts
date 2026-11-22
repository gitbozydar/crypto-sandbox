import { QUOTE_ASSETS, type QuoteAsset } from "@/lib/market/binance";
import type { MarketInfo } from "@/lib/market/markets-shared";

export const PAGE_SIZE = 50;

const DEFAULT_DIR = { rank: "asc", name: "asc", price: "desc", change: "desc", volume: "desc" } as const;
export type SortKey = keyof typeof DEFAULT_DIR;
type SortDir = "asc" | "desc";

export type FilterState = { quote: QuoteAsset; sort: SortKey; dir: SortDir; q: string; page: number };

export type MarketRow = MarketInfo & { price: number | null; changePercent: number | null; quoteVolume: number | null };

// Funkcja odczytująca filtry listy rynku z adresu URL.
export const parseFilters = (params: Record<string, string | string[] | undefined>): FilterState => {
  const get = (key: string) => String(params[key] ?? "");
  const quote = QUOTE_ASSETS.find((q) => q === get("quote").toUpperCase()) ?? "USDT";
  const sort = (get("sort") in DEFAULT_DIR ? get("sort") : "rank") as SortKey;
  const dir = get("dir") === "asc" || get("dir") === "desc" ? (get("dir") as SortDir) : DEFAULT_DIR[sort];
  return { quote, sort, dir, q: get("q").trim(), page: Math.max(1, Number(get("page")) || 1) };
};

// Funkcja budująca adres URL listy rynku z filtrów.
export const marketsUrl = ({ quote, sort, dir, q, page }: FilterState) => {
  const p = new URLSearchParams();
  if (quote !== "USDT") p.set("quote", quote);
  if (sort !== "rank") p.set("sort", sort);
  if (dir !== DEFAULT_DIR[sort]) p.set("dir", dir);
  if (q) p.set("q", q);
  if (page > 1) p.set("page", String(page));
  return p.size ? `/markets?${p}` : "/markets";
};

// Funkcja zmieniająca sortowanie po kliknięciu w nagłówek kolumny.
export const sortBy = (state: FilterState, column: SortKey): FilterState => {
  const dir = state.sort === column ? (state.dir === "asc" ? "desc" : "asc") : DEFAULT_DIR[column];
  return { ...state, sort: column, dir, page: 1 };
};

// Funkcja normalizująca tekst do wyszukiwania (małe litery, bez polskich znaków).
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

// Funkcja sprawdzająca, czy para pasuje do wyszukiwanej frazy.
export const matchesSearch = (m: MarketInfo, q: string) =>
  !q || normalize(m.base).includes(normalize(q)) || normalize(m.name).includes(normalize(q));

const sortValue = {
  rank: (r: MarketRow) => r.rank,
  name: (r: MarketRow) => r.base,
  price: (r: MarketRow) => r.price,
  change: (r: MarketRow) => r.changePercent,
  volume: (r: MarketRow) => r.quoteVolume,
};

// Funkcja sortująca wiersze listy rynku.
export const sortRows = (rows: MarketRow[], { sort, dir }: FilterState) => {
  const sign = dir === "asc" ? 1 : -1;
  return rows.sort((a, b) => {
    const x = sortValue[sort](a);
    const y = sortValue[sort](b);
    if (x == null || y == null) {
      return x == null && y == null ? (b.quoteVolume ?? 0) - (a.quoteVolume ?? 0) : x == null ? 1 : -1;
    }
    return sign * (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number));
  });
};
