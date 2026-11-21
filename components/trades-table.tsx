import Link from "next/link";
import { marketHref } from "@/lib/market/markets-shared";
import type { TradeRow } from "@/lib/trading/queries";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Card } from "./ui";


// Historia transakcji użytkownika. `showMarket` — kolumna z parą (na dashboardzie),
// na stronie pary jest zbędna.
export const TradesTable = ({ trades, title, showMarket = false }: { trades: TradeRow[]; title: string; showMarket?: boolean }) => (
  <Card className="p-0">
    <h2 className="px-6 pt-5 pb-3 text-lg font-semibold">{title}</h2>
    {trades.length === 0 ? (
      <p className="px-6 pb-6 text-sm text-muted">Brak transakcji.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-6 py-2 font-medium">Data</th>
              {showMarket && <th className="px-3 py-2 font-medium">Para</th>}
              <th className="px-3 py-2 font-medium">Typ</th>
              <th className="px-3 py-2 text-right font-medium">Ilość</th>
              <th className="px-3 py-2 text-right font-medium">Cena</th>
              <th className="px-3 py-2 text-right font-medium">Wartość</th>
              <th className="px-6 py-2 text-right font-medium">Prowizja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trades.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-2 text-muted tabular-nums">{formatDateTime(t.createdAt, { seconds: true })}</td>
                {showMarket && (
                  <td className="px-3 py-2 font-medium">
                    <Link href={marketHref(t)} className="hover:text-primary">
                      {t.base}
                      <span className="text-muted">/{t.quote}</span>
                    </Link>
                  </td>
                )}
                <td className={`px-3 py-2 font-semibold ${t.side === "BUY" ? "text-success" : "text-danger"}`}>
                  {t.side === "BUY" ? "Kupno" : "Sprzedaż"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatNumber(+t.quantity)} {t.base}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatNumber(+t.price)} {t.quote}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatNumber(+t.value)} {t.quote}
                </td>
                <td className="px-6 py-2 text-right text-muted tabular-nums">
                  {formatNumber(+t.fee)} {t.quote}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Card>
);
