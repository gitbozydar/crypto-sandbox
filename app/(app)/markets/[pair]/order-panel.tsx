"use client";

import { useState, useTransition } from "react";
import { Card, ErrorMessage, inputClass } from "@/components/ui";
import { decimalsFromStep, formatNumber, formatPriceTick } from "@/lib/format";
import type { MarketInfo } from "@/lib/market/markets-shared";
import { FEE_RATE } from "@/lib/trading/constants";
import { placeOrder } from "./actions";

type Props = {
  market: MarketInfo;
  balances: { base: string; quote: string };
  price: number | null; // ostatnia cena na żywo — tylko do podglądu, cenę wykonania ustala serwer
};

const fee = Number(FEE_RATE);
const sideColor = (s: "BUY" | "SELL") => (s === "BUY" ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground");

// Zaokrąglenie w dół do `decimals` miejsc i zapis bez notacji 1e-7 (do pola formularza).
const floorTo = (value: number, decimals: number) =>
  value > 0 ? (Math.floor(value * 10 ** decimals + 1e-9) / 10 ** decimals).toFixed(decimals).replace(/\.?0+$/, "") : "";

// Formularz zlecenia rynkowego.
//   Kupno:    wpisujesz kwotę w walucie kwotowania (np. 100 USDT).
//   Sprzedaż: wpisujesz ilość monety (np. 0.01 BTC).
// Wyliczenia tutaj to tylko podgląd — serwer liczy wszystko od nowa po aktualnej cenie.
export const OrderPanel = ({ market, balances, price }: Props) => {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [typed, setTyped] = useState("");
  const [max, setMax] = useState(false); // „100%” = całe saldo w chwili wykonania, a nie konkretna liczba
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const isBuy = side === "BUY";
  const unit = isBuy ? market.quote : market.base; // w czym wpisujesz kwotę = czym płacisz
  const balance = Number(isBuy ? balances.quote : balances.base);
  const decimals = isBuy ? 8 : decimalsFromStep(market.stepSize);
  const p = price ?? 0;

  const amount = max ? balance : Number(typed.replace(",", "."));

  // Podgląd: ilość zaokrąglona w dół do kroku giełdy, tak samo jak na serwerze.
  const step = Number(market.stepSize);
  const qty = p > 0 ? Math.floor((isBuy ? amount / (p * (1 + fee)) : amount) / step + 1e-9) * step : 0;
  const value = qty * p;
  const feeAmount = value * fee;
  const tooMuch = !max && amount > balance;
  const tooLittle = qty > 0 && (qty < Number(market.minQty) || value < Number(market.minNotional));

  const choose = (next: { side?: "BUY" | "SELL"; typed?: string; max?: boolean }) => {
    if (next.side) setSide(next.side);
    setTyped(next.typed ?? "");
    setMax(next.max ?? false);
    setResult(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await placeOrder({ market: market.symbol, side, amount: typed, max });
      if (!res.ok) return setResult({ ok: false, text: res.error });
      const t = res.trade;
      choose({});
      setResult({
        ok: true,
        text: `${isBuy ? "Kupiono" : "Sprzedano"} ${formatNumber(+t.quantity)} ${t.base} po ${formatPriceTick(+t.price, market.tickSize)} ${t.quote}`,
      });
    });
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
        {(["BUY", "SELL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => choose({ side: s })}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              side === s ? sideColor(s) : "text-muted hover:text-foreground"
            }`}
          >
            {s === "BUY" ? "Kup" : "Sprzedaj"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Dostępne</span>
          <span className="font-medium tabular-nums">
            {formatNumber(balance, decimals)} {unit}
          </span>
        </div>

        <label className="relative">
          <span className="sr-only">{isBuy ? `Kwota w ${unit}` : `Ilość ${unit}`}</span>
          <input
            value={max ? floorTo(balance, decimals) : typed}
            onChange={(e) => choose({ typed: e.target.value.replace(/[^0-9.,]/g, "") })}
            inputMode="decimal"
            placeholder={isBuy ? "Kwota" : "Ilość"}
            autoComplete="off"
            className={`${inputClass} w-full pr-16 text-right tabular-nums`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">{unit}</span>
        </label>

        <div className="grid grid-cols-4 gap-1">
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const active = pct === 1 && max;
            return (
              <button
                key={pct}
                type="button"
                disabled={balance <= 0}
                onClick={() => choose(pct === 1 ? { max: true } : { typed: floorTo(balance * pct, decimals) })}
                className={`rounded-md border py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                  active ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:text-foreground"
                }`}
              >
                {pct * 100}%
              </button>
            );
          })}
        </div>

        <dl className="flex flex-col gap-1.5 rounded-lg bg-surface-muted p-3 text-sm">
          <Row label="Cena (≈)" value={p > 0 ? `${formatPriceTick(p, market.tickSize)} ${market.quote}` : "—"} />
          <Row label={`Prowizja ${fee * 100}%`} value={qty > 0 ? `${formatNumber(feeAmount)} ${market.quote}` : "—"} />
          <Row
            label="Otrzymasz (≈)"
            value={qty <= 0 ? "—" : isBuy ? `${formatNumber(qty)} ${market.base}` : `${formatNumber(value - feeAmount)} ${market.quote}`}
          />
        </dl>

        {max && <p className="text-xs text-muted">Całe saldo — ilość zostanie dopasowana do ceny w chwili wykonania.</p>}
        {tooMuch && <p className="text-xs text-danger">Przekracza dostępne środki.</p>}
        {tooLittle && (
          <p className="text-xs text-muted">
            Minimum: {market.minQty} {market.base} i {market.minNotional} {market.quote}.
          </p>
        )}
        {result &&
          (result.ok ? (
            <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
              {result.text}
            </p>
          ) : (
            <ErrorMessage message={result.text} />
          ))}

        <button
          type="submit"
          disabled={pending || !(amount > 0) || tooMuch}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40 ${sideColor(side)}`}
        >
          {pending ? "Realizuję…" : `${isBuy ? "Kup" : "Sprzedaj"} ${market.base}`}
        </button>
        <p className="text-center text-xs text-muted">Zlecenie rynkowe po najlepszej cenie z arkusza Binance.</p>
      </form>
    </Card>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <dt className="text-muted">{label}</dt>
    <dd className="text-right tabular-nums">{value}</dd>
  </div>
);
