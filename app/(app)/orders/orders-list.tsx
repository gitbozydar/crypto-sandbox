"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useToast } from "@/components/toast";
import { Badge, Card } from "@/components/ui";
import { formatDateTime, formatNumber, formatPriceTick } from "@/lib/format";
import { marketHref } from "@/lib/market/markets-shared";
import { DCA_INTERVALS, TRIGGERS } from "@/lib/trading/constants";
import type { Orders } from "@/lib/trading/orders";
import { cancelConditionalOrderAction, stopRecurringBuyAction, type ActionResult } from "./actions";

const STATUS = {
  ACTIVE: { label: "Aktywne", tone: "primary" },
  EXECUTED: { label: "Wykonane", tone: "success" },
  CANCELLED: { label: "Anulowane", tone: "neutral" },
  FAILED: { label: "Nieudane", tone: "danger" },
} as const;

type Props = { orders: Orders; showMarket?: boolean };

// Zlecenia warunkowe i plany automatycznego kupowania — tabele z przyciskiem anulowania.
export const OrdersList = ({ orders, showMarket = false }: Props) => (
  <>
    <ConditionalTable orders={orders.conditional} showMarket={showMarket} />
    <RecurringTable plans={orders.recurring} showMarket={showMarket} />
  </>
);

const Pair = ({ base, quote }: { base: string; quote: string }) => (
  <Link href={marketHref({ base, quote })} className="font-medium hover:text-primary">
    {base}
    <span className="text-muted">/{quote}</span>
  </Link>
);

const th = "px-3 py-2 font-medium first:pl-6 last:pr-6";
const td = "px-3 py-2.5 first:pl-6 last:pr-6";

const ConditionalTable = ({ orders, showMarket }: { orders: Orders["conditional"]; showMarket: boolean }) => (
  <Card className="p-0">
    <h2 className="px-6 pt-5 pb-3 text-lg font-semibold">Zlecenia warunkowe</h2>
    {orders.length === 0 ? (
      <p className="px-6 pb-6 text-sm text-muted">Brak zleceń. Ustaw stop-loss lub take-profit w zakładce „Warunkowe” na stronie pary.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className={th}>Typ</th>
              {showMarket && <th className={th}>Para</th>}
              <th className={`${th} text-right`}>Cena progowa</th>
              <th className={`${th} text-right`}>Ilość / kwota</th>
              <th className={th}>Status</th>
              <th className={th}>Utworzono</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => {
              const trigger = TRIGGERS[o.type];
              return (
                <tr key={o.id}>
                  <td className={`${td} font-medium ${trigger.side === "BUY" ? "text-success" : "text-danger"}`}>{trigger.label}</td>
                  {showMarket && (
                    <td className={td}>
                      <Pair base={o.base} quote={o.quote} />
                    </td>
                  )}
                  <td className={`${td} text-right tabular-nums`}>
                    {trigger.when === "below" ? "≤ " : "≥ "}
                    {formatPriceTick(+o.triggerPrice, o.tickSize)} {o.quote}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {formatNumber(+o.amount)} {trigger.side === "SELL" ? o.base : o.quote}
                  </td>
                  <td className={td}>
                    <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge>
                    {o.failReason && <p className="mt-1 text-xs text-danger">{o.failReason}</p>}
                  </td>
                  <td className={`${td} text-muted tabular-nums`}>{formatDateTime(o.executedAt ?? o.createdAt)}</td>
                  <td className={`${td} text-right`}>
                    {o.status === "ACTIVE" && (
                      <CancelButton label="Anuluj" done="Anulowano zlecenie" action={() => cancelConditionalOrderAction(o.id)} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </Card>
);

const RecurringTable = ({ plans, showMarket }: { plans: Orders["recurring"]; showMarket: boolean }) => (
  <Card className="p-0">
    <h2 className="px-6 pt-5 pb-3 text-lg font-semibold">Automatyczne kupowanie</h2>
    {plans.length === 0 ? (
      <p className="px-6 pb-6 text-sm text-muted">Brak planów. Włączysz je w zakładce „Automatyczne” na stronie pary.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted">
              {showMarket && <th className={th}>Para</th>}
              <th className={`${th} text-right`}>Kwota</th>
              <th className={th}>Częstotliwość</th>
              <th className={th}>Następny zakup</th>
              <th className={`${th} text-right`}>Zakupów</th>
              <th className={th}>Status</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plans.map((p) => (
              <tr key={p.id}>
                {showMarket && (
                  <td className={td}>
                    <Pair base={p.base} quote={p.quote} />
                  </td>
                )}
                <td className={`${td} text-right tabular-nums`}>
                  {formatNumber(+p.amount, 2)} {p.quote}
                </td>
                <td className={td}>{DCA_INTERVALS[p.intervalHours]}</td>
                <td className={`${td} text-muted tabular-nums`}>{p.isActive ? formatDateTime(p.nextRunAt) : "—"}</td>
                <td className={`${td} text-right tabular-nums`}>{p.runCount}</td>
                <td className={td}>
                  <Badge tone={p.isActive ? "primary" : "neutral"}>{p.isActive ? "Aktywny" : "Zatrzymany"}</Badge>
                  {p.lastError && <p className="mt-1 text-xs text-danger">Ostatnio: {p.lastError}</p>}
                </td>
                <td className={`${td} text-right`}>
                  {p.isActive && <CancelButton label="Zatrzymaj" done="Zatrzymano plan" action={() => stopRecurringBuyAction(p.id)} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Card>
);

const CancelButton = ({ label, done, action }: { label: string; done: string; action: () => Promise<ActionResult> }) => {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const click = () =>
    startTransition(async () => {
      const res = await action();
      toast(res.ok ? { title: done } : { tone: "error", title: "Nie udało się", text: res.error });
    });
  return (
    <button onClick={click} disabled={pending} className="text-sm font-medium text-danger hover:underline disabled:opacity-50">
      {pending ? "…" : label}
    </button>
  );
};
