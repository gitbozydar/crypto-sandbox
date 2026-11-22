import Link from "next/link";
import { Page } from "@/components/page";
import { SectionsSkeleton } from "@/components/states";
import { Table, TableCard, Td, Th } from "@/components/table";
import { Avatar, Badge, Card, Signed } from "@/components/ui";
import { formatUsdt } from "@/lib/format";
import { getRankingFor } from "@/lib/portfolio/ranking";
import { getCurrentUser } from "@/lib/session";

const TOP = 50;

// Strona rankingu użytkowników.
const RankingPage = () => (
  <Page
    title="Ranking"
    description="Kto najlepiej pomnożył startowe 10 000 USDT. Odświeżany co minutę."
    fallback={<SectionsSkeleton count={2} />}
  >
    <Ranking />
  </Page>
);

export default RankingPage;

// Funkcja zwracająca kolor numeru miejsca (podium wyróżnione).
const placeTone = (place: number) =>
  place === 1 ? "bg-primary text-primary-foreground" : place <= 3 ? "bg-primary-soft text-primary" : "text-muted";

// Komponent tabeli rankingu z pozycją bieżącego użytkownika.
const Ranking = async () => {
  const user = await getCurrentUser();
  const { rows, me } = await getRankingFor(user.id);

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        {me ? (
          <p>
            Twoje miejsce: <strong className="text-primary">#{rows.indexOf(me) + 1}</strong> z {rows.length}
          </p>
        ) : (
          <p className="text-muted">Jesteś ukryty w rankingu.</p>
        )}
        <Link href="/settings" className="text-sm text-muted underline underline-offset-2 hover:text-foreground">
          Widoczność zmienisz w ustawieniach
        </Link>
      </Card>

      <TableCard title={`Top ${TOP}`} empty={rows.length === 0 && "Nikt jeszcze nie jest w rankingu."}>
        <Table
          minWidth={560}
          head={
            <>
              <Th className="w-16">#</Th>
              <Th>Użytkownik</Th>
              <Th right>ROI</Th>
              <Th right>Wartość portfela</Th>
              <Th right>Transakcji</Th>
            </>
          }
        >
          {rows.slice(0, TOP).map((r, i) => (
            <tr key={r.userId} className={r === me ? "bg-primary-soft/40" : ""}>
              <Td>
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${placeTone(i + 1)}`}
                >
                  {i + 1}
                </span>
              </Td>
              <Td>
                <span className="flex items-center gap-3">
                  <Avatar name={r.name} image={r.image} size={28} />
                  <span className="font-medium">{r.name}</span>
                  {r === me && <Badge tone="primary">Ty</Badge>}
                </span>
              </Td>
              <Td right className="font-semibold">
                <Signed value={r.roi} format={(v) => v.toFixed(2)} suffix="%" />
              </Td>
              <Td right>{formatUsdt(r.value)} USDT</Td>
              <Td right className="text-muted">
                {r.trades}
              </Td>
            </tr>
          ))}
        </Table>
      </TableCard>
    </>
  );
};
