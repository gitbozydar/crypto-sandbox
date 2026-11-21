import Link from "next/link";
import { Card, CoinIcon } from "@/components/ui";
import { formatNumber, formatSigned, formatUsdt } from "@/lib/format";
import type { Holding } from "@/lib/portfolio/portfolio";

const usdt = (v: number | null) => (v === null ? "—" : formatUsdt(v));

// Pozycje w portfelu z wynikiem każdej monety (średnia cena zakupu → zysk/strata).
export const HoldingsTable = ({ holdings }: { holdings: Holding[] }) => (
  <Card className="p-0">
    <h2 className="px-6 pt-5 pb-3 text-lg font-semibold">Pozycje</h2>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-6 py-2 font-medium">Moneta</th>
            <th className="px-3 py-2 text-right font-medium">Ilość</th>
            <th className="px-3 py-2 text-right font-medium">Cena (USDT)</th>
            <th className="px-3 py-2 text-right font-medium">Wartość (USDT)</th>
            <th className="px-3 py-2 text-right font-medium">Udział</th>
            <th className="px-3 py-2 text-right font-medium">Śr. cena zakupu</th>
            <th className="px-6 py-2 text-right font-medium">Zysk / strata</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {holdings.map((h) => (
            <tr key={h.symbol}>
              <td className="px-6 py-2.5">
                {/* USDT to waluta rozliczeniowa — nie ma własnej strony pary. */}
                <Link
                  href={`/markets/${h.symbol}`}
                  className={`flex items-center gap-3 ${h.symbol === "USDT" ? "pointer-events-none" : "hover:text-primary"}`}
                >
                  <CoinIcon src={h.imageUrl} symbol={h.symbol} />
                  <span className="font-medium">{h.symbol}</span>
                  {h.name !== h.symbol && <span className="hidden text-muted sm:inline">{h.name}</span>}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(h.amount)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{h.price === null ? "—" : formatNumber(h.price, 6)}</td>
              <td className="px-3 py-2.5 text-right font-medium tabular-nums">{usdt(h.value)}</td>
              <td className="px-3 py-2.5 text-right text-muted tabular-nums">{(h.share * 100).toFixed(1)}%</td>
              <td className="px-3 py-2.5 text-right text-muted tabular-nums">
                {h.averagePrice === null ? "—" : formatNumber(h.averagePrice, 6)}
              </td>
              <td className="px-6 py-2.5 text-right tabular-nums">
                {h.pnl === null ? (
                  <span className="text-muted">—</span>
                ) : (
                  <span className={h.pnl >= 0 ? "text-success" : "text-danger"}>
                    {formatSigned(h.pnl)}{" "}
                    <span className="text-xs">({formatSigned(h.pnlPercent ?? 0, (v) => v.toFixed(2))}%)</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);
