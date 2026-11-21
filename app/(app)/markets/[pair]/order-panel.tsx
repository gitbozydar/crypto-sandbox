"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import type { MarketInfo } from "@/lib/market/markets-shared";
import { ConditionalOrderForm } from "./conditional-order-form";
import { sideColor, type Side } from "./form-parts";
import { MarketOrderForm } from "./market-order-form";
import { RecurringBuyForm } from "./recurring-buy-form";

type Props = { market: MarketInfo; balances: { base: string; quote: string }; price: number | null };

const MODES = [
  { id: "market", label: "Teraz" },
  { id: "conditional", label: "Warunkowe" },
  { id: "recurring", label: "Automatyczne" },
] as const;
type Mode = (typeof MODES)[number]["id"];

// Panel zleceń obok wykresu: teraz (rynkowe), warunkowe (stop-loss, take-profit, kup po cenie)
// i automatyczne kupowanie co jakiś czas.
export const OrderPanel = ({ market, balances, price }: Props) => {
  const [mode, setMode] = useState<Mode>("market");
  const [side, setSide] = useState<Side>("BUY");

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex gap-4 border-b border-border text-sm" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`-mb-px border-b-2 pb-2 font-medium transition-colors ${
              mode === m.id ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "market" && (
        <>
          <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
            {(["BUY", "SELL"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                  side === s ? sideColor(s) : "text-muted hover:text-foreground"
                }`}
              >
                {s === "BUY" ? "Kup" : "Sprzedaj"}
              </button>
            ))}
          </div>
          {/* key: przy zmianie kierunku formularz zaczyna od pustego pola. */}
          <MarketOrderForm key={side} market={market} side={side} balances={balances} price={price} />
        </>
      )}
      {mode === "conditional" && <ConditionalOrderForm market={market} balances={balances} price={price} />}
      {mode === "recurring" && <RecurringBuyForm market={market} balances={balances} />}
    </Card>
  );
};
