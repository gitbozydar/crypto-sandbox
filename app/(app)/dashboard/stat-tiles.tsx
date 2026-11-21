import { Card } from "@/components/ui";
import { formatSigned, formatUsdt } from "@/lib/format";
import type { Portfolio } from "@/lib/portfolio/portfolio";

// Najważniejsze liczby portfela w kafelkach — tu liczba jest „wykresem”.
export const StatTiles = ({ portfolio }: { portfolio: Portfolio }) => {
  const gain = portfolio.pnl >= 0;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Tile label="Wartość portfela" value={`${formatUsdt(portfolio.total)} USDT`} hint={`Start: ${formatUsdt(portfolio.initial)} USDT`} />
      <Tile
        label="Zysk / strata"
        value={`${formatSigned(portfolio.pnl)} USDT`}
        hint={`${gain ? "▲" : "▼"} ${formatSigned(portfolio.roi, (v) => v.toFixed(2))}% ROI`}
        tone={gain ? "text-success" : "text-danger"}
      />
      <Tile label="Wolne środki" value={`${formatUsdt(portfolio.cash)} USDT`} hint={`Transakcji: ${portfolio.tradeCount}`} />
    </div>
  );
};

const Tile = ({ label, value, hint, tone = "" }: { label: string; value: string; hint: string; tone?: string }) => (
  <Card className="p-5">
    <p className="text-sm text-muted">{label}</p>
    <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
    <p className={`mt-1 text-sm tabular-nums ${tone || "text-muted"}`}>{hint}</p>
  </Card>
);
