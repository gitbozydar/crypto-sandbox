"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CoinIcon, PercentChange } from "@/components/ui";
import { formatCompact, formatPriceTick } from "@/lib/format";
import type { Ticker24h } from "@/lib/market/binance";
import { marketHref } from "@/lib/market/markets-shared";
import { tickerFromStream, useBinanceStream, type MiniTickerMsg } from "@/lib/market/use-binance-stream";
import { marketsUrl, sortBy, type FilterState, type MarketRow, type SortKey } from "./filters";

// Najnowsze dane z WebSocketu + poprzednia cena (żeby wiedzieć, czy mignąć na zielono, czy na czerwono).
type Live = Ticker24h & { prevPrice: number | null };

export const MarketTable = ({ rows, state }: { rows: MarketRow[]; state: FilterState }) => {
  const [live, setLive] = useState<Record<string, Live>>({});

  // Jedno połączenie WebSocket dla par widocznych na tej stronie (aktualizacja co ~1 s).
  const streams = useMemo(() => rows.map((r) => `${r.symbol.toLowerCase()}@miniTicker`), [rows]);
  useBinanceStream<MiniTickerMsg>(streams, (m) =>
    setLive((prev) => ({ ...prev, [m.s]: { ...tickerFromStream(m), prevPrice: prev[m.s]?.lastPrice ?? null } })),
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <SortHeader state={state} column="rank" label="#" />
            <SortHeader state={state} column="name" label="Para" />
            <SortHeader state={state} column="price" label={`Cena (${state.quote})`} right />
            <SortHeader state={state} column="change" label="24h" right />
            <SortHeader state={state} column="volume" label={`Obrót 24h (${state.quote})`} right />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const l = live[row.symbol];
            const price = l?.lastPrice ?? row.price;
            // Klasa animacji tylko, gdy cena się zmieniła. `key={price}` na komórce sprawia,
            // że React tworzy ją od nowa przy każdej zmianie, więc animacja odpala się ponownie.
            const flash = !l?.prevPrice || l.prevPrice === l.lastPrice ? "" : l.lastPrice > l.prevPrice ? "animate-flash-up" : "animate-flash-down";
            return (
              <tr key={row.symbol} className="transition-colors hover:bg-surface-muted">
                <td className="px-4 py-3 text-muted tabular-nums">{row.rank ?? "—"}</td>
                <td className="px-4 py-3">
                  <Link href={marketHref(row)} className="flex items-center gap-3">
                    <CoinIcon src={row.imageUrl} symbol={row.base} />
                    <span className="font-medium">
                      {row.base}
                      <span className="text-muted">/{row.quote}</span>
                    </span>
                    {row.name !== row.base && <span className="hidden text-muted sm:inline">{row.name}</span>}
                  </Link>
                </td>
                <td key={price ?? "-"} className={`px-4 py-3 text-right font-medium tabular-nums ${flash}`}>
                  {price != null ? formatPriceTick(price, row.tickSize) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <PercentChange value={l?.changePercent ?? row.changePercent} />
                </td>
                <td className="px-4 py-3 text-right text-muted tabular-nums">
                  {formatCompact(l?.quoteVolume ?? row.quoteVolume ?? 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-muted">
          {state.q ? `Brak par ${state.quote} pasujących do „${state.q}”.` : "Brak par."}
        </p>
      )}
    </div>
  );
};

// Nagłówek kolumny jest linkiem: klik sortuje po kolumnie, ponowny klik odwraca kierunek.
// Sortuje serwer (całą listę, nie tylko widoczną stronę).
const SortHeader = ({ state, column, label, right }: { state: FilterState; column: SortKey; label: string; right?: boolean }) => {
  const active = state.sort === column;
  return (
    <th
      aria-sort={active ? (state.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 font-medium ${right ? "text-right" : ""}`}
    >
      <Link
        href={marketsUrl(sortBy(state, column))}
        scroll={false}
        className={`inline-flex items-center gap-1 uppercase hover:text-foreground ${right ? "flex-row-reverse" : ""} ${
          active ? "text-primary" : ""
        }`}
      >
        {label}
        {/* Strzałka jest zawsze, tylko niewidoczna — dzięki temu nagłówki nie skaczą. */}
        <span className={`w-2 text-[10px] ${active ? "" : "opacity-0"}`} aria-hidden>
          {active && state.dir === "asc" ? "▲" : "▼"}
        </span>
      </Link>
    </th>
  );
};
