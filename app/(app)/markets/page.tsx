import { Page } from "@/components/page";
import { MarketsSkeleton } from "@/components/states";
import { QUOTE_ASSETS } from "@/lib/market/binance";
import { getActiveMarkets, getTickers } from "@/lib/market/markets";
import { getCurrentUser } from "@/lib/session";
import { matchesSearch, PAGE_SIZE, parseFilters, sortRows, type MarketRow } from "./filters";
import { MarketFilters } from "./market-filters";
import { MarketTable } from "./market-table";
import { Pagination } from "./pagination";

// Strona listy rynku.
const MarketsPage = ({ searchParams }: PageProps<"/markets">) => (
  <Page
    title="Rynek"
    description="Wszystkie pary z Binance, ceny na żywo. Kliknij parę, aby zobaczyć wykres."
    fallback={<MarketsSkeleton />}
  >
    <Markets searchParams={searchParams} />
  </Page>
);

export default MarketsPage;

// Komponent filtrujący, sortujący i dzielący na strony listę par.
const Markets = async ({ searchParams }: Pick<PageProps<"/markets">, "searchParams">) => {
  await getCurrentUser();
  const state = parseFilters(await searchParams);
  const [markets, tickers] = await Promise.all([getActiveMarkets(), getTickers()]);

  const counts = Object.fromEntries(QUOTE_ASSETS.map((q) => [q, markets.filter((m) => m.quote === q).length]));

  const rows: MarketRow[] = markets
    .filter((m) => m.quote === state.quote && matchesSearch(m, state.q))
    .map((m) => ({
      ...m,
      price: tickers[m.symbol]?.lastPrice ?? null,
      changePercent: tickers[m.symbol]?.changePercent ?? null,
      quoteVolume: tickers[m.symbol]?.quoteVolume ?? null,
    }));
  sortRows(rows, state);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(state.page, pages);

  return (
    <div className="flex flex-col gap-4">
      <MarketFilters state={state} counts={counts} />
      <MarketTable rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)} state={state} />
      <Pagination state={{ ...state, page }} pages={pages} total={rows.length} />
    </div>
  );
};
