"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { decimalsFromStep } from "@/lib/format";
import type { Candle, KlineInterval } from "@/lib/market/binance";

type Chart = {
  api: IChartApi;
  candles: ISeriesApi<"Candlestick">;
  volume: ISeriesApi<"Histogram">;
  up: string; // kolor świecy wzrostowej
  down: string; // kolor świecy spadkowej
};

type Props = { market: string; tickSize: string; interval: KlineInterval; liveCandle: Candle | null; ath: number | null };

// Wykres świecowy (TradingView lightweight-charts). Historia z naszego API, ostatnia świeca na żywo.
export const PriceChart = ({ market, tickSize, interval, liveCandle, ath }: Props) => {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<Chart | null>(null);

  // Zapamiętujemy, dla jakiej pary i interwału przyszły dane. Jeśli dla innych niż teraz —
  // to znaczy, że nowe jeszcze się ładują (nie trzeba osobnego setState("loading")).
  const key = `${market}:${interval}`;
  const [loaded, setLoaded] = useState<{ key: string; ok: boolean } | null>(null);
  const status = loaded?.key !== key ? "loading" : loaded.ok ? "ready" : "error";

  // 1. Tworzymy wykres raz. Kolory bierzemy z tokenów CSS (app/globals.css).
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const color = (name: string) => css.getPropertyValue(name).trim();
    const [text, grid, up, down] = ["--muted", "--border", "--success", "--danger"].map(color);

    const api = createChart(container.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: text, attributionLogo: false },
      grid: { vertLines: { color: grid }, horzLines: { color: grid } },
      rightPriceScale: { borderColor: grid },
      timeScale: { borderColor: grid, timeVisible: true },
      localization: { locale: "pl-PL" },
    });
    const candles = api.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      wickUpColor: up,
      wickDownColor: down,
      borderVisible: false,
    });
    // Wolumen jako słupki w dolnych 20% wykresu, na osobnej skali.
    const volume = api.addSeries(HistogramSeries, { priceScaleId: "volume", priceFormat: { type: "volume" } });
    api.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chart.current = { api, candles, volume, up, down };
    return () => api.remove();
  }, []);

  // Świeca w formacie biblioteki + słupek wolumenu w kolorze świecy ("66" = półprzezroczysty).
  const bar = (c: Candle) => ({ ...c, time: c.time as UTCTimestamp });
  const volumeBar = (c: Candle, ch: Chart) => ({
    time: c.time as UTCTimestamp,
    value: c.volume,
    color: (c.close >= c.open ? ch.up : ch.down) + "66",
  });

  // 2. Przy zmianie pary lub interwału pobieramy historię świec.
  useEffect(() => {
    const ch = chart.current!;
    const ctrl = new AbortController();
    fetch(`/api/market/klines?market=${market}&interval=${interval}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Candle[]>) : Promise.reject(r.status)))
      .then((data) => {
        // Oś cen z dokładnością pary, np. BNB/BTC → 6 miejsc po przecinku.
        ch.candles.applyOptions({ priceFormat: { type: "price", precision: decimalsFromStep(tickSize), minMove: +tickSize } });
        ch.candles.setData(data.map(bar));
        ch.volume.setData(data.map((c) => volumeBar(c, ch)));
        ch.api.timeScale().fitContent();
        setLoaded({ key, ok: true });
      })
      .catch(() => !ctrl.signal.aborted && setLoaded({ key, ok: false }));
    return () => ctrl.abort(); // przerwij stare zapytanie, gdy użytkownik szybko przełącza interwały
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tickSize]);

  // Przerywana linia „ATH” (maksimum wszech czasów). Widać ją, gdy mieści się w zakresie wykresu.
  useEffect(() => {
    const ch = chart.current;
    if (!ch || !ath) return;
    const line = ch.candles.createPriceLine({ price: ath, color: ch.up, lineWidth: 1, lineStyle: LineStyle.Dashed, title: "ATH" });
    return () => ch.candles.removePriceLine(line);
  }, [ath]);

  // 3. Bieżąca świeca z WebSocketu: update() nadpisuje ostatnią albo dokłada nową.
  useEffect(() => {
    const ch = chart.current;
    if (!ch || !liveCandle || status !== "ready") return;
    ch.candles.update(bar(liveCandle));
    ch.volume.update(volumeBar(liveCandle, ch));
  }, [liveCandle, status]);

  return (
    <div className="relative h-80 w-full sm:h-[420px]">
      <div ref={container} className="absolute inset-0" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/70 text-sm text-muted">
          {status === "loading" ? "Ładowanie wykresu…" : "Nie udało się pobrać danych."}
        </div>
      )}
    </div>
  );
};
