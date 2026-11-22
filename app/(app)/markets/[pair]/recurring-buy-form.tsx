"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/toast";
import { ErrorMessage } from "@/components/ui";
import { formatNumber, parseInputNumber } from "@/lib/format";
import type { MarketInfo } from "@/lib/market/markets-shared";
import { DCA_INTERVALS, type DcaInterval } from "@/lib/trading/constants";
import { createRecurringBuy } from "@/lib/actions/trading";
import { AvailableBalance, ChipRow, NumberInput, Summary } from "./form-parts";

type Props = { market: MarketInfo; balances: { base: string; quote: string } };

const intervals = Object.keys(DCA_INTERVALS).map(Number) as DcaInterval[];
const HOURS_PER_YEAR = 365 * 24;

// Formularz automatycznego kupowania (DCA).
export const RecurringBuyForm = ({ market, balances }: Props) => {
  const [amount, setAmount] = useState("");
  const [interval, setIntervalHours] = useState<DcaInterval>(168);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const am = parseInputNumber(amount);
  const perYear = am * (HOURS_PER_YEAR / interval);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createRecurringBuy({ market: market.symbol, amount, intervalHours: interval });
      if (!res.ok) return setError(res.error);
      toast({
        title: "Włączono automatyczne kupowanie",
        text: `${market.base} za ${formatNumber(am, 2)} ${market.quote} — ${DCA_INTERVALS[interval].toLowerCase()}. Pierwszy zakup za chwilę.`,
      });
      setAmount("");
      setError(null);
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        Kupuj {market.base} za stałą kwotę w równych odstępach — średnia cena zakupu wyrównuje wahania rynku.
      </p>
      <AvailableBalance amount={formatNumber(Number(balances.quote), 2)} unit={market.quote} />
      <NumberInput label="Kwota każdego zakupu" unit={market.quote} value={amount} onChange={setAmount} />
      <ChipRow
        items={intervals.map((h) => ({
          label: DCA_INTERVALS[h],
          active: h === interval,
          onClick: () => setIntervalHours(h),
        }))}
      />
      <Summary
        rows={[
          ["Pierwszy zakup", "teraz (w ciągu kilkunastu sekund)"],
          ["Potem", DCA_INTERVALS[interval].toLowerCase()],
          ["Rocznie (≈)", am > 0 ? `${formatNumber(perYear, 2)} ${market.quote}` : "—"],
        ]}
      />
      <p className="text-xs text-muted">Plan działa w tle. Zatrzymasz go w każdej chwili na liście zleceń.</p>
      <ErrorMessage message={error} />
      <button
        type="submit"
        disabled={pending || !(am > 0)}
        className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary-hover disabled:opacity-40"
      >
        {pending ? "Zapisuję…" : "Włącz automatyczne kupowanie"}
      </button>
    </form>
  );
};
