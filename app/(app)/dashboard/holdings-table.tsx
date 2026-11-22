import Link from "next/link";
import { Table, TableCard, Td, Th } from "@/components/table";
import { CoinIcon, Signed } from "@/components/ui";
import { formatNumber, formatUsdt } from "@/lib/format";
import type { Holding } from "@/lib/portfolio/portfolio";

// Funkcja formatująca wartość albo zwracająca „—”, gdy jej brak.
const orDash = (value: number | null, format: (v: number) => string) => (value === null ? "—" : format(value));
// Funkcja formatująca cenę z dokładnością do 6 miejsc.
const price = (v: number) => formatNumber(v, 6);

// Komponent tabeli pozycji w portfelu z zyskiem/stratą każdej monety.
export const HoldingsTable = ({ holdings }: { holdings: Holding[] }) => (
  <TableCard title="Pozycje">
    <Table
      minWidth={720}
      head={
        <>
          <Th>Moneta</Th>
          <Th right>Ilość</Th>
          <Th right>Cena (USDT)</Th>
          <Th right>Wartość (USDT)</Th>
          <Th right>Udział</Th>
          <Th right>Śr. cena zakupu</Th>
          <Th right>Zysk / strata</Th>
        </>
      }
    >
      {holdings.map((h) => (
        <tr key={h.symbol}>
          <Td>
            <Link
              href={`/markets/${h.symbol}`}
              className={`flex items-center gap-3 ${h.symbol === "USDT" ? "pointer-events-none" : "hover:text-primary"}`}
            >
              <CoinIcon src={h.imageUrl} symbol={h.symbol} />
              <span className="font-medium">{h.symbol}</span>
              {h.name !== h.symbol && <span className="hidden text-muted sm:inline">{h.name}</span>}
            </Link>
          </Td>
          <Td right>{formatNumber(h.amount)}</Td>
          <Td right>{orDash(h.price, price)}</Td>
          <Td right className="font-medium">
            {orDash(h.value, formatUsdt)}
          </Td>
          <Td right className="text-muted">
            {(h.share * 100).toFixed(1)}%
          </Td>
          <Td right className="text-muted">
            {orDash(h.averagePrice, price)}
          </Td>
          <Td right>
            {h.pnl === null ? (
              <span className="text-muted">—</span>
            ) : (
              <>
                <Signed value={h.pnl} />{" "}
                <Signed value={h.pnlPercent ?? 0} format={(v) => v.toFixed(2)} suffix="%" className="text-xs" />
              </>
            )}
          </Td>
        </tr>
      ))}
    </Table>
  </TableCard>
);
