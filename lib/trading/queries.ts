import { prisma } from "@/lib/db";

// Funkcja pobierająca salda wybranych monet.
export const getBalances = async (userId: string, assets: string[]) => {
  const rows = await prisma.balance.findMany({ where: { wallet: { userId }, assetSymbol: { in: assets } } });
  const amountOf = (asset: string) => rows.find((r) => r.assetSymbol === asset)?.amount.toString() ?? "0";
  return Object.fromEntries(assets.map((a) => [a, amountOf(a)]));
};

export type TradeRow = Awaited<ReturnType<typeof getRecentTrades>>[number];

// Funkcja pobierająca ostatnie transakcje użytkownika.
export const getRecentTrades = async (
  userId: string,
  { market, take = 20 }: { market?: string; take?: number } = {},
) => {
  const trades = await prisma.trade.findMany({
    where: { wallet: { userId }, marketSymbol: market },
    orderBy: { createdAt: "desc" },
    take,
    include: { market: { select: { baseSymbol: true, quoteSymbol: true } } },
  });
  return trades.map((t) => ({
    id: t.id,
    base: t.market.baseSymbol,
    quote: t.market.quoteSymbol,
    side: t.side,
    quantity: t.quantity.toString(),
    price: t.price.toString(),
    value: t.quoteAmount.toString(),
    fee: t.fee.toString(),
    createdAt: t.createdAt,
  }));
};
