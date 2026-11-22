import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getTickers } from "@/lib/market/markets";
import { getPortfolio, usdtPriceOf } from "./portfolio";

export type RankingRow = {
  userId: string;
  name: string;
  image: string | null;
  value: number;
  roi: number;
  trades: number;
};

// Funkcja wyliczająca ranking użytkowników według ROI.
const getRanking = async (): Promise<RankingRow[]> => {
  "use cache";
  cacheTag("ranking");
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });

  const [wallets, tickers] = await Promise.all([
    prisma.wallet.findMany({
      where: { user: { showInRanking: true } },
      include: {
        user: { select: { id: true, name: true, image: true } },
        balances: { where: { amount: { gt: 0 } } },
        _count: { select: { trades: true } },
      },
    }),
    getTickers(),
  ]);

  return wallets
    .map((w) => {
      const value = w.balances.reduce(
        (sum, b) => sum + b.amount.toNumber() * (usdtPriceOf(b.assetSymbol, tickers) ?? 0),
        0,
      );
      const initial = w.initialBalance.toNumber();
      return {
        userId: w.user.id,
        name: w.user.name,
        image: w.user.image,
        value,
        roi: ((value - initial) / initial) * 100,
        trades: w._count.trades,
      };
    })
    .sort((a, b) => b.roi - a.roi);
};

// Funkcja zwracająca ranking z aktualną pozycją użytkownika.
export const getRankingFor = async (userId: string) => {
  const [ranking, user, portfolio, trades] = await Promise.all([
    getRanking(),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, image: true, showInRanking: true } }),
    getPortfolio(userId),
    prisma.trade.count({ where: { wallet: { userId } } }),
  ]);
  const others = ranking.filter((r) => r.userId !== userId);
  if (!user?.showInRanking) return { rows: others, me: null };

  const me: RankingRow = {
    userId,
    name: user.name,
    image: user.image,
    value: portfolio.total,
    roi: portfolio.roi,
    trades,
  };
  return { rows: [...others, me].sort((a, b) => b.roi - a.roi), me };
};
