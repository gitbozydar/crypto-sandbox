import { Card } from "@/components/ui";
import { formatCompact, formatDateTime, formatNumber } from "@/lib/format";
import type { CoinInfo } from "@/lib/market/coin-info";

// Funkcja formatująca kwotę w dolarach.
const usd = (v: number) => `$${formatNumber(v, v >= 1 ? 2 : 8)}`;
// Funkcja zwracająca samą datę bez godziny.
const dateOnly = (iso: string) => formatDateTime(iso).split(",")[0];

// Komponent karty z informacjami o monecie (ATH, ATL, kapitalizacja, podaż).
export const CoinInfoCard = ({ name, symbol, info }: { name: string; symbol: string; info: CoinInfo }) => {
  const atAth = info.athChangePercent >= -0.01;
  const toRecover = 100 / (1 + info.athChangePercent / 100) - 100;
  const supplyShare = info.maxSupply && info.circulatingSupply ? (100 * info.circulatingSupply) / info.maxSupply : null;

  return (
    <Card>
      <h2 className="text-lg font-semibold">O monecie {name}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Maksimum (ATH)" value={usd(info.ath)} hint={dateOnly(info.athDate)} />
        <Stat
          label="Od ATH"
          value={atAth ? "Nowe ATH!" : `${info.athChangePercent.toFixed(1)}%`}
          hint={atAth ? "cena na szczycie" : `do ATH brakuje +${toRecover.toFixed(0)}%`}
          tone={atAth ? "text-success" : "text-danger"}
        />
        <Stat label="Minimum (ATL)" value={usd(info.atl)} hint={dateOnly(info.atlDate)} />
        <Stat label="Kapitalizacja" value={`$${formatCompact(info.marketCap)}`} />
        <Stat label="Obrót 24h (cały rynek)" value={`$${formatCompact(info.volume24h)}`} />
        <Stat
          label="W obiegu"
          value={info.circulatingSupply ? `${formatCompact(info.circulatingSupply)} ${symbol}` : "—"}
          hint={supplyShare === null ? "bez limitu podaży" : `${supplyShare.toFixed(0)}% maks. podaży`}
        />
      </dl>
      <p className="mt-4 text-xs text-muted">Dane: CoinGecko (w USD), odświeżane co ok. 10 minut.</p>
    </Card>
  );
};

// Komponent pojedynczej statystyki z etykietą i podpowiedzią.
const Stat = ({ label, value, hint, tone = "" }: { label: string; value: string; hint?: string; tone?: string }) => (
  <div>
    <dt className="text-xs text-muted">{label}</dt>
    <dd className={`mt-0.5 font-semibold tabular-nums ${tone}`}>{value}</dd>
    {hint && <dd className="text-xs text-muted">{hint}</dd>}
  </div>
);
