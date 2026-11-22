"use client";

import type { ReactNode } from "react";
import { inputClass } from "@/components/ui";

export type Side = "BUY" | "SELL";
// Funkcja zwracająca kolor dla kupna (zielony) lub sprzedaży (czerwony).
export const sideColor = (s: Side) =>
  s === "BUY" ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground";

// Komponent pola liczbowego z jednostką po prawej.
export const NumberInput = ({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <label className="flex flex-col gap-1 text-xs text-muted">
    {label}
    <span className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        inputMode="decimal"
        placeholder="0"
        autoComplete="off"
        className={`${inputClass} w-full pr-16 text-right text-sm tabular-nums`}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">{unit}</span>
    </span>
  </label>
);

// Komponent rzędu małych przycisków wyboru.
export const ChipRow = ({
  items,
}: {
  items: { label: string; active?: boolean; onClick: () => void; disabled?: boolean }[];
}) => (
  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((item) => (
      <button
        key={item.label}
        type="button"
        disabled={item.disabled}
        onClick={item.onClick}
        className={`rounded-md border py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
          item.active ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:text-foreground"
        }`}
      >
        {item.label}
      </button>
    ))}
  </div>
);

// Komponent podsumowania zlecenia w formie listy.
export const Summary = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="flex flex-col gap-1.5 rounded-lg bg-surface-muted p-3 text-sm">
    {rows.map(([label, value]) => (
      <div key={label} className="flex justify-between gap-2">
        <dt className="text-muted">{label}</dt>
        <dd className="text-right tabular-nums">{value}</dd>
      </div>
    ))}
  </dl>
);

// Komponent wyświetlający dostępne saldo.
export const AvailableBalance = ({ amount, unit }: { amount: string; unit: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted">Dostępne</span>
    <span className="font-medium tabular-nums">
      {amount} {unit}
    </span>
  </div>
);
