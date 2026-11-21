"use client";

import { BaselineSeries, ColorType, createChart, LineStyle, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { formatDateTime, formatUsdt } from "@/lib/format";
import type { ValuePoint } from "@/lib/portfolio/portfolio";

// Wartość portfela w czasie. Linia bazowa = kapitał startowy:
// powyżej niej wykres jest zielony (zysk), poniżej czerwony (strata).
export const ValueChart = ({ points, initial }: { points: ValuePoint[]; initial: number }) => {
  const container = useRef<HTMLDivElement>(null);
  const last = points.at(-1)!;
  // Punkt pod kursorem (dymek); bez kursora pokazujemy ostatnią wartość.
  const [hover, setHover] = useState<ValuePoint | null>(null);
  const shown = hover ?? last;

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const color = (name: string) => css.getPropertyValue(name).trim();
    const [text, grid, up, down] = ["--muted", "--border", "--success", "--danger"].map(color);

    const chart = createChart(container.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: text, attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: grid } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
      localization: { locale: "pl-PL" },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: initial },
      topLineColor: up,
      topFillColor1: up + "55", // "55" = półprzezroczysty
      topFillColor2: up + "05",
      bottomLineColor: down,
      bottomFillColor1: down + "05",
      bottomFillColor2: down + "55",
      lineWidth: 2,
      priceLineVisible: false,
    });
    series.setData(points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })));
    series.createPriceLine({ price: initial, color: text, lineStyle: LineStyle.Dashed, lineWidth: 1, title: "Start" });
    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove((param) => {
      const data = param.seriesData.get(series) as { value: number } | undefined;
      setHover(data && param.time ? { time: param.time as number, value: data.value } : null);
    });

    return () => chart.remove();
  }, [points, initial]);

  const change = shown.value - initial;
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Wartość portfela</h2>
        <p className="text-sm tabular-nums">
          <span className="text-muted">{formatDateTime(shown.time * 1000)} · </span>
          <span className="font-semibold">{formatUsdt(shown.value)} USDT</span>{" "}
          <span className={change >= 0 ? "text-success" : "text-danger"}>
            ({change >= 0 ? "+" : "−"}
            {formatUsdt(Math.abs(change))})
          </span>
        </p>
      </div>
      <div ref={container} className="h-72 w-full" />
    </div>
  );
};
