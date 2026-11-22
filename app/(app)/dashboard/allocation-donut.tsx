"use client";

import { useState } from "react";
import { formatUsdt } from "@/lib/format";
import { assignCoinColors, OTHER_COLOR } from "@/lib/portfolio/coin-colors";
import type { Holding } from "@/lib/portfolio/portfolio";

const MAX_SLICES = 5;
const SIZE = 200;
const CENTER = SIZE / 2;
const OUTER = 96;
const INNER = 64;

type Slice = { key: string; label: string; value: number; share: number; color: string };

// Funkcja dzieląca pozycje na wycinki wykresu (największe osobno, reszta jako „Inne”).
const toSlices = (holdings: Holding[]): Slice[] => {
  const valued = holdings.filter((h) => (h.value ?? 0) > 0);
  const top = valued.length > MAX_SLICES + 1 ? valued.slice(0, MAX_SLICES) : valued;
  const rest = valued.slice(top.length);
  const colors = assignCoinColors(top.map((h) => h.symbol));

  const slices = top.map((h) => ({
    key: h.symbol,
    label: h.symbol,
    value: h.value!,
    share: h.share,
    color: colors.get(h.symbol)!,
  }));
  if (rest.length) {
    slices.push({
      key: "other",
      label: `Inne (${rest.length})`,
      value: rest.reduce((s, h) => s + h.value!, 0),
      share: rest.reduce((s, h) => s + h.share, 0),
      color: OTHER_COLOR,
    });
  }
  return slices;
};

// Funkcja wyliczająca punkt na okręgu dla danego kąta i promienia.
const pointAt = (angle: number, radius: number) =>
  `${(CENTER + radius * Math.sin(angle)).toFixed(2)} ${(CENTER - radius * Math.cos(angle)).toFixed(2)}`;

// Funkcja budująca ścieżkę SVG jednego wycinka pierścienia.
const ringSegment = (start: number, end: number) => {
  const sweep = Math.min(end - start, 2 * Math.PI - 1e-4);
  const stop = start + sweep;
  const large = sweep > Math.PI ? 1 : 0;
  return [
    `M ${pointAt(start, OUTER)}`,
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${pointAt(stop, OUTER)}`,
    `L ${pointAt(stop, INNER)}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${pointAt(start, INNER)}`,
    "Z",
  ].join(" ");
};

// Komponent wykresu kołowego ze składem portfela i legendą.
export const AllocationDonut = ({ holdings, total }: { holdings: Holding[]; total: number }) => {
  const slices = toSlices(holdings);
  const [active, setActive] = useState<string | null>(null);
  const focused = slices.find((s) => s.key === active);

  const starts = slices.map((_, i) => slices.slice(0, i).reduce((a, s) => a + s.share, 0) * 2 * Math.PI);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Skład portfela</h2>
      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Udział monet w portfelu">
          {slices.map((s, i) => (
            <path
              key={s.key}
              d={ringSegment(starts[i], starts[i] + s.share * 2 * Math.PI)}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={2}
              opacity={active && active !== s.key ? 0.35 : 1}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setActive(s.key)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted">{focused ? focused.label : "Razem"}</span>
          <span className="font-semibold tabular-nums">{formatUsdt(focused?.value ?? total)}</span>
          <span className="text-xs text-muted">{focused ? `${(focused.share * 100).toFixed(1)}%` : "USDT"}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        {slices.map((s) => (
          <li
            key={s.key}
            onMouseEnter={() => setActive(s.key)}
            onMouseLeave={() => setActive(null)}
            className={`flex items-center gap-2 rounded-md px-2 py-1 ${active === s.key ? "bg-surface-muted" : ""}`}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="font-medium">{s.label}</span>
            <span className="ml-auto tabular-nums text-muted">{(s.share * 100).toFixed(1)}%</span>
            <span className="w-28 text-right tabular-nums">{formatUsdt(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
