"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/toast";
import { ErrorMessage } from "@/components/ui";
import { decimalsFromStep, formatNumber, formatPriceTick, toInputNumber } from "@/lib/format";
import type { MarketInfo } from "@/lib/market/markets-shared";
import { TRIGGERS, type TriggerType } from "@/lib/trading/constants";
import { createConditionalOrderAction } from "../../orders/actions";
import { AvailableBalance, ChipRow, NumberInput, sideColor, Summary } from "./form-parts";

type Props = { market: MarketInfo; balances: { base: string; quote: string }; price: number | null };

// Szybkie progi ceny względem obecnej: w dół dla stop-loss i kupna, w górę dla take-profit.
const OFFSETS = [5, 10, 20];

// Zlecenie warunkowe: czeka, aż cena dojdzie do progu, i wtedy wykonuje się jak zlecenie rynkowe.
export const ConditionalOrderForm = ({ market, balances, price }: Props) => {
  const [type, setType] = useState<TriggerType>("STOP_LOSS");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const trigger = TRIGGERS[type];
  const isSell = trigger.side === "SELL";
  const unit = isSell ? market.base : market.quote; // sprzedaż: ilość monety, kupno: kwota
  const balance = Number(isSell ? balances.base : balances.quote);
  const amountDecimals = isSell ? decimalsFromStep(market.stepSize) : 8;
  const priceDecimals = decimalsFromStep(market.tickSize);
  const p = price ?? 0;
  const tp = Number(triggerPrice.replace(",", "."));
  const am = Number(amount.replace(",", "."));
  const direction = trigger.when === "below" ? -1 : 1;

  const chooseType = (next: TriggerType) => {
    setType(next);
    setTriggerPrice("");
    setAmount("");
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createConditionalOrderAction({ market: market.symbol, type, triggerPrice, amount });
      if (!res.ok) return setError(res.error);
      toast({
        title: `Ustawiono: ${trigger.label}`,
        text: `${market.base}/${market.quote} · ${trigger.hint.toLowerCase()} ${formatPriceTick(tp, market.tickSize)} ${market.quote}`,
      });
      chooseType(type);
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <ChipRow
        items={(Object.keys(TRIGGERS) as TriggerType[]).map((t) => ({
          label: TRIGGERS[t].label,
          active: t === type,
          onClick: () => chooseType(t),
        }))}
      />
      <p className="text-xs text-muted">{trigger.hint} podanej ceny — wtedy zlecenie wykona się po cenie rynkowej.</p>

      <NumberInput label="Cena progowa" unit={market.quote} value={triggerPrice} onChange={setTriggerPrice} />
      <ChipRow
        items={OFFSETS.map((pct) => ({
          label: `${direction < 0 ? "−" : "+"}${pct}%`,
          disabled: p <= 0,
          onClick: () => setTriggerPrice(toInputNumber(p * (1 + (direction * pct) / 100), priceDecimals)),
        }))}
      />

      <AvailableBalance amount={formatNumber(balance, amountDecimals)} unit={unit} />
      <NumberInput label={isSell ? "Ilość do sprzedaży" : "Kwota zakupu"} unit={unit} value={amount} onChange={setAmount} />
      <ChipRow
        items={[0.25, 0.5, 0.75, 1].map((pct) => ({
          label: `${pct * 100}%`,
          disabled: balance <= 0,
          onClick: () => setAmount(toInputNumber(balance * pct, amountDecimals)),
        }))}
      />

      <Summary
        rows={[
          ["Obecna cena", p > 0 ? `${formatPriceTick(p, market.tickSize)} ${market.quote}` : "—"],
          ["Odległość od ceny", p > 0 && tp > 0 ? `${(((tp - p) / p) * 100).toFixed(2)}%` : "—"],
          [
            isSell ? "Otrzymasz (≈)" : "Kupisz (≈)",
            tp > 0 && am > 0 ? (isSell ? `${formatNumber(am * tp, 2)} ${market.quote}` : `${formatNumber(am / tp)} ${market.base}`) : "—",
          ],
        ]}
      />
      <p className="text-xs text-muted">Środki nie są blokowane — sprawdzimy je w chwili wykonania.</p>
      <ErrorMessage message={error} />
      <button
        type="submit"
        disabled={pending || !(tp > 0) || !(am > 0)}
        className={`rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40 ${sideColor(trigger.side)}`}
      >
        {pending ? "Zapisuję…" : `Ustaw ${trigger.label.toLowerCase()}`}
      </button>
    </form>
  );
};
