import { formatDateTime, formatNumber } from "@/lib/format";
import type { TradeRow } from "@/lib/trading/queries";
import { Table, TableCard, Td, Th } from "./table";
import { PairLink } from "./ui";

// Komponent tabeli historii transakcji.
export const TradesTable = ({
  trades,
  title,
  showMarket = false,
}: {
  trades: TradeRow[];
  title: string;
  showMarket?: boolean;
}) => (
  <TableCard title={title} empty={trades.length === 0 && "Brak transakcji."}>
    <Table
      head={
        <>
          <Th>Data</Th>
          {showMarket && <Th>Para</Th>}
          <Th>Typ</Th>
          <Th right>Ilość</Th>
          <Th right>Cena</Th>
          <Th right>Wartość</Th>
          <Th right>Prowizja</Th>
        </>
      }
    >
      {trades.map((t) => (
        <tr key={t.id}>
          <Td className="text-muted tabular-nums">{formatDateTime(t.createdAt, { seconds: true })}</Td>
          {showMarket && (
            <Td>
              <PairLink base={t.base} quote={t.quote} />
            </Td>
          )}
          <Td className={`font-semibold ${t.side === "BUY" ? "text-success" : "text-danger"}`}>
            {t.side === "BUY" ? "Kupno" : "Sprzedaż"}
          </Td>
          <Td right>
            {formatNumber(+t.quantity)} {t.base}
          </Td>
          <Td right>
            {formatNumber(+t.price)} {t.quote}
          </Td>
          <Td right>
            {formatNumber(+t.value)} {t.quote}
          </Td>
          <Td right className="text-muted">
            {formatNumber(+t.fee)} {t.quote}
          </Td>
        </tr>
      ))}
    </Table>
  </TableCard>
);
