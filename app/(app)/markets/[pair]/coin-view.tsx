"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, PercentChange } from "@/components/ui";
import { formatCompact, formatPriceTick } from "@/lib/format";
import { KLINE_INTERVALS, type Candle, type KlineInterval, type Ticker24h } from "@/lib/market/binance";
import { marketHref, type MarketInfo } from "@/lib/market/markets-shared";
import { tickerFromStream, useBinanceStream, type KlineMsg, type MiniTickerMsg } from "@/lib/market/use-binance-stream";
import { OrderPanel } from "./order-panel";
import { PriceChart } from "./price-chart";

type Props = {
  market: MarketInfo;
  quotes: string[]; // wszystkie waluty, w których notowana jest ta moneta (przełącznik par)
  initialTicker: Ticker24h | null;
  balances: { base: string; quote: string };
  ath: number | null; // maksimum wszech czasów (USD) — linia na wykresie
};

const tabClass = (active: boolean) =>
  `rounded-md px-3 py-1 text-sm font-medium transition-colors ${
    active ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface-muted hover:text-foreground"
  }`;

export const CoinView = ({ market, quotes, initialTicker, balances, ath }: Props) => {
  const [interval, setChartInterval] = useState<KlineInterval>("1h");
  const [ticker, setTicker] = useState(initialTicker);
  const [liveCandle, setLiveCandle] = useState<Candle | null>(null);

  // Jedno połączenie, dwa strumienie: statystyki 24h oraz bieżąca świeca wybranego interwału.
  const pair = market.symbol.toLowerCase();
  useBinanceStream<MiniTickerMsg | KlineMsg>([`${pair}@miniTicker`, `${pair}@kline_${interval}`], (m) => {
    if (m.e === "24hrMiniTicker") return setTicker(tickerFromStream(m));
    const k = m.k;
    setLiveCandle({ time: k.t / 1000, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v });
  });

  const price = liveCandle?.close ?? ticker?.lastPrice ?? null;
  const fmt = (v?: number) => (v == null ? "—" : formatPriceTick(v, market.tickSize));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {market.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={market.imageUrl} alt="" width={40} height={40} className="rounded-full" />
          )}
          <div>
            <h1 className="text-2xl font-semibold">
              {market.base}
              <span className="text-muted">/{market.quote}</span>
              {market.name !== market.base && <span className="ml-2 text-base font-normal text-muted">{market.name}</span>}
            </h1>
            <p className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold tabular-nums">{fmt(price ?? undefined)}</span>
              <span className="text-sm text-muted">{market.quote}</span>
              <PercentChange value={ticker?.changePercent} className="text-sm font-medium" />
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Stat label="Max 24h" value={fmt(ticker?.high)} />
          <Stat label="Min 24h" value={fmt(ticker?.low)} />
          <Stat label="Obrót 24h" value={ticker ? `${formatCompact(ticker.quoteVolume)} ${market.quote}` : "—"} />
        </dl>
      </div>

      {quotes.length > 1 && (
        <nav className="flex flex-wrap items-center gap-1" aria-label="Inne pary tej monety">
          <span className="mr-2 text-sm text-muted">Para:</span>
          {quotes.map((quote) => (
            <Link key={quote} href={marketHref({ base: market.base, quote })} className={tabClass(quote === market.quote)}>
              {market.base}/{quote}
            </Link>
          ))}
        </nav>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-4">
          <div className="mb-3 flex gap-1" role="tablist" aria-label="Interwał wykresu">
            {KLINE_INTERVALS.map((i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === interval}
                onClick={() => {
                  setChartInterval(i);
                  setLiveCandle(null); // świeca z poprzedniego interwału nie pasuje do nowego wykresu
                }}
                className={tabClass(i === interval)}
              >
                {i.toUpperCase()}
              </button>
            ))}
          </div>
          <PriceChart market={market.symbol} tickSize={market.tickSize} interval={interval} liveCandle={liveCandle} ath={ath} />
        </Card>
        <OrderPanel market={market} balances={balances} price={price} />
      </div>
    </>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-muted">{label}</dt>
    <dd className="font-medium tabular-nums">{value}</dd>
  </div>
);
