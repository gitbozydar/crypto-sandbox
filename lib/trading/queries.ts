// Odczyty portfela dla stron. Liczby oddajemy jako tekst (Decimal → string),
// bo trafiają do komponentów w przeglądarce i nie chcemy tracić precyzji.
import { prisma } from "@/lib/db";
import { getOrCreateWallet } from "./wallet";

// Salda podanych monet (brak wiersza w bazie = saldo 0).
export const getBalances = async (userId: string, assets: string[]) => {
  const wallet = await getOrCreateWallet(userId);
  const rows = await prisma.balance.findMany({ where: { walletId: wallet.id, assetSymbol: { in: assets } } });
  const amountOf = (asset: string) => rows.find((r) => r.assetSymbol === asset)?.amount.toString() ?? "0";
  return Object.fromEntries(assets.map((a) => [a, amountOf(a)]));
};

export type TradeRow = Awaited<ReturnType<typeof getRecentTrades>>[number];

// Ostatnie transakcje użytkownika (opcjonalnie tylko jednej pary).
export const getRecentTrades = async (userId: string, { market, take = 20 }: { market?: string; take?: number } = {}) => {
  const wallet = await getOrCreateWallet(userId);
  const trades = await prisma.trade.findMany({
    where: { walletId: wallet.id, marketSymbol: market },
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
