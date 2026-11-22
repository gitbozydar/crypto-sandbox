"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/toast";
import { ErrorMessage } from "@/components/ui";
import { decimalsFromStep, formatNumber, formatPriceTick, parseInputNumber, toInputNumber } from "@/lib/format";
import type { MarketInfo } from "@/lib/market/markets-shared";
import { FEE_RATE } from "@/lib/trading/constants";
import { placeOrder } from "@/lib/actions/trading";
import { AvailableBalance, ChipRow, NumberInput, sideColor, Summary, type Side } from "./form-parts";

const fee = Number(FEE_RATE);

type Props = { market: MarketInfo; side: Side; balances: { base: string; quote: string }; price: number | null };

// Formularz zlecenia rynkowego (kupno lub sprzedaż od razu).
export const MarketOrderForm = ({ market, side, balances, price }: Props) => {
  const [typed, setTyped] = useState("");
  const [max, setMax] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const isBuy = side === "BUY";
  const unit = isBuy ? market.quote : market.base;
  const balance = Number(isBuy ? balances.quote : balances.base);
  const decimals = isBuy ? 8 : decimalsFromStep(market.stepSize);
  const p = price ?? 0;
  const amount = max ? balance : parseInputNumber(typed);

  const step = Number(market.stepSize);
  const qty = p > 0 ? Math.floor((isBuy ? amount / (p * (1 + fee)) : amount) / step + 1e-9) * step : 0;
  const value = qty * p;
  const feeAmount = value * fee;
  const tooMuch = !max && amount > balance;
  const tooLittle = qty > 0 && (qty < Number(market.minQty) || value < Number(market.minNotional));

  const set = (next: { typed?: string; max?: boolean }) => {
    setTyped(next.typed ?? "");
    setMax(next.max ?? false);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await placeOrder({ market: market.symbol, side, amount: typed, max });
      if (!res.ok) return setError(res.error);
      const t = res.data;
      set({});
      toast({
        title: `${t.side === "BUY" ? "Kupiono" : "Sprzedano"} ${formatNumber(+t.quantity)} ${t.base}`,
        text: `Po ${formatPriceTick(+t.price, market.tickSize)} ${t.quote} · wartość ${formatNumber(+t.value, 2)} ${t.quote}`,
      });
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <AvailableBalance amount={formatNumber(balance, decimals)} unit={unit} />
      <NumberInput
        label={isBuy ? "Kwota" : "Ilość"}
        unit={unit}
        value={max ? toInputNumber(balance, decimals) : typed}
        onChange={(v) => set({ typed: v })}
      />
      <ChipRow
        items={[0.25, 0.5, 0.75, 1].map((pct) => ({
          label: `${pct * 100}%`,
          active: pct === 1 && max,
          disabled: balance <= 0,
          onClick: () => set(pct === 1 ? { max: true } : { typed: toInputNumber(balance * pct, decimals) }),
        }))}
      />
      <Summary
        rows={[
          ["Cena (≈)", p > 0 ? `${formatPriceTick(p, market.tickSize)} ${market.quote}` : "—"],
          [`Prowizja ${fee * 100}%`, qty > 0 ? `${formatNumber(feeAmount)} ${market.quote}` : "—"],
          [
            "Otrzymasz (≈)",
            qty <= 0
              ? "—"
              : isBuy
                ? `${formatNumber(qty)} ${market.base}`
                : `${formatNumber(value - feeAmount)} ${market.quote}`,
          ],
        ]}
      />
      {max && <p className="text-xs text-muted">Całe saldo — ilość zostanie dopasowana do ceny w chwili wykonania.</p>}
      {tooMuch && <p className="text-xs text-danger">Przekracza dostępne środki.</p>}
      {tooLittle && (
        <p className="text-xs text-muted">
          Minimum: {market.minQty} {market.base} i {market.minNotional} {market.quote}.
        </p>
      )}
      <ErrorMessage message={error} />
      <button
        type="submit"
        disabled={pending || !(amount > 0) || tooMuch}
        className={`rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40 ${sideColor(side)}`}
      >
        {pending ? "Realizuję…" : `${isBuy ? "Kup" : "Sprzedaj"} ${market.base}`}
      </button>
      <p className="text-center text-xs text-muted">Zlecenie rynkowe po najlepszej cenie z arkusza Binance.</p>
    </form>
  );
};
