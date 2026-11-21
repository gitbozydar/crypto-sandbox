import Link from "next/link";
import { Suspense } from "react";
import { SectionsSkeleton } from "@/components/states";
import { Avatar, Badge, Card } from "@/components/ui";
import { formatSigned, formatUsdt } from "@/lib/format";
import { getRankingFor } from "@/lib/portfolio/ranking";
import { getCurrentUser } from "@/lib/session";

const TOP = 50;

// Ranking użytkowników według ROI — kto najlepiej pomnożył startowe 10 000 USDT.
const RankingPage = () => (
  <>
    <div>
      <h1 className="text-2xl font-semibold">Ranking</h1>
      <p className="text-sm text-muted">Kto najlepiej pomnożył startowe 10 000 USDT. Odświeżany co minutę.</p>
    </div>
    {/* Sesję czytamy w czasie żądania, więc treść musi być w <Suspense>. */}
    <Suspense fallback={<SectionsSkeleton count={2} />}>
      <Ranking />
    </Suspense>
  </>
);

export default RankingPage;

// Kolor numeru miejsca: podium wyróżnione (numer zostaje — kolor nie jest jedyną informacją).
const placeTone = (place: number) =>
  place === 1 ? "bg-primary text-primary-foreground" : place <= 3 ? "bg-primary-soft text-primary" : "text-muted";

const Ranking = async () => {
  const user = await getCurrentUser();
  const { rows: ranking, me } = await getRankingFor(user.id);
  const myPlace = me ? ranking.indexOf(me) + 1 : 0;

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        {me ? (
          <p>
            Twoje miejsce: <strong className="text-primary">#{myPlace}</strong> z {ranking.length}
          </p>
        ) : (
          <p className="text-muted">Jesteś ukryty w rankingu.</p>
        )}
        <Link href="/settings" className="text-sm text-muted underline underline-offset-2 hover:text-foreground">
          Widoczność zmienisz w ustawieniach
        </Link>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-16 px-6 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Użytkownik</th>
                <th className="px-3 py-3 text-right font-medium">ROI</th>
                <th className="px-3 py-3 text-right font-medium">Wartość portfela</th>
                <th className="px-6 py-3 text-right font-medium">Transakcji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranking.slice(0, TOP).map((r, i) => {
                const place = i + 1;
                const isMe = r.userId === user.id;
                return (
                  <tr key={r.userId} className={isMe ? "bg-primary-soft/40" : ""}>
                    <td className="px-6 py-3">
                      <span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${placeTone(place)}`}>
                        {place}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={r.name} image={r.image} size={28} />
                        <span className="font-medium">{r.name}</span>
                        {isMe && <Badge tone="primary">Ty</Badge>}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-right font-semibold tabular-nums ${r.roi >= 0 ? "text-success" : "text-danger"}`}>
                      {formatSigned(r.roi, (v) => v.toFixed(2))}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatUsdt(r.value)} USDT</td>
                    <td className="px-6 py-3 text-right text-muted tabular-nums">{r.trades}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ranking.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted">Nikt jeszcze nie jest w rankingu.</p>}
      </Card>
    </>
  );
};
