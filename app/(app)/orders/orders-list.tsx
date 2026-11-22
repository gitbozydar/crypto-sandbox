import { Table, TableCard, Td, Th } from "@/components/table";
import { Badge, PairLink } from "@/components/ui";
import { formatDateTime, formatNumber, formatPriceTick } from "@/lib/format";
import { DCA_INTERVALS, TRIGGERS } from "@/lib/trading/constants";
import type { Orders } from "@/lib/trading/orders";
import { CancelButton } from "./cancel-button";

const STATUS = {
  ACTIVE: { label: "Aktywne", tone: "primary" },
  EXECUTED: { label: "Wykonane", tone: "success" },
  CANCELLED: { label: "Anulowane", tone: "neutral" },
  FAILED: { label: "Nieudane", tone: "danger" },
} as const;

// Komponent tabel zleceń warunkowych i planów automatycznego kupowania.
export const OrdersList = ({ orders, showMarket = false }: { orders: Orders; showMarket?: boolean }) => (
  <>
    <TableCard
      title="Zlecenia warunkowe"
      empty={
        orders.conditional.length === 0 &&
        "Brak zleceń. Ustaw stop-loss lub take-profit w zakładce „Warunkowe” na stronie pary."
      }
    >
      <Table
        head={
          <>
            <Th>Typ</Th>
            {showMarket && <Th>Para</Th>}
            <Th right>Cena progowa</Th>
            <Th right>Ilość / kwota</Th>
            <Th>Status</Th>
            <Th>Data</Th>
            <Th />
          </>
        }
      >
        {orders.conditional.map((o) => {
          const trigger = TRIGGERS[o.type];
          return (
            <tr key={o.id}>
              <Td className={`font-medium ${trigger.side === "BUY" ? "text-success" : "text-danger"}`}>
                {trigger.label}
              </Td>
              {showMarket && (
                <Td>
                  <PairLink base={o.base} quote={o.quote} />
                </Td>
              )}
              <Td right>
                {trigger.when === "below" ? "≤" : "≥"} {formatPriceTick(+o.triggerPrice, o.tickSize)} {o.quote}
              </Td>
              <Td right>
                {formatNumber(+o.amount)} {trigger.side === "SELL" ? o.base : o.quote}
              </Td>
              <Td>
                <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge>
                {o.failReason && <p className="mt-1 text-xs text-danger">{o.failReason}</p>}
              </Td>
              <Td className="text-muted tabular-nums">{formatDateTime(o.executedAt ?? o.createdAt)}</Td>
              <Td right>{o.status === "ACTIVE" && <CancelButton kind="order" id={o.id} />}</Td>
            </tr>
          );
        })}
      </Table>
    </TableCard>

    <TableCard
      title="Automatyczne kupowanie"
      empty={orders.recurring.length === 0 && "Brak planów. Włączysz je w zakładce „Automatyczne” na stronie pary."}
    >
      <Table
        head={
          <>
            {showMarket && <Th>Para</Th>}
            <Th right>Kwota</Th>
            <Th>Częstotliwość</Th>
            <Th>Następny zakup</Th>
            <Th right>Zakupów</Th>
            <Th>Status</Th>
            <Th />
          </>
        }
      >
        {orders.recurring.map((p) => (
          <tr key={p.id}>
            {showMarket && (
              <Td>
                <PairLink base={p.base} quote={p.quote} />
              </Td>
            )}
            <Td right>
              {formatNumber(+p.amount, 2)} {p.quote}
            </Td>
            <Td>{DCA_INTERVALS[p.intervalHours]}</Td>
            <Td className="text-muted tabular-nums">{p.isActive ? formatDateTime(p.nextRunAt) : "—"}</Td>
            <Td right>{p.runCount}</Td>
            <Td>
              <Badge tone={p.isActive ? "primary" : "neutral"}>{p.isActive ? "Aktywny" : "Zatrzymany"}</Badge>
              {p.lastError && <p className="mt-1 text-xs text-danger">Ostatnio: {p.lastError}</p>}
            </Td>
            <Td right>{p.isActive && <CancelButton kind="plan" id={p.id} />}</Td>
          </tr>
        ))}
      </Table>
    </TableCard>
  </>
);
