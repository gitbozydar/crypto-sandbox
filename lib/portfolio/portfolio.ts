// Analityka portfela: wartość w USDT, zysk/strata, ROI i historia wartości.
// Ceny bierzemy z notowań Binance z cache (odświeżane co ~15 s) — nie muszą być „na żywo”.
import { prisma } from "@/lib/db";
import type { Ticker24h } from "@/lib/market/binance";
import { getTickers } from "@/lib/market/markets";
import { getOrCreateWallet } from "@/lib/trading/wallet";
import { computeCostBasis } from "./cost-basis";

const HOUR = 60 * 60 * 1000;

// Cena monety w USDT. Prawie każda moneta ma parę z USDT; jeśli nie — liczymy przez BTC.
export const usdtPriceOf = (asset: string, tickers: Record<string, Ticker24h>) => {
  if (asset === "USDT") return 1;
  const direct = tickers[`${asset}USDT`]?.lastPrice;
  if (direct) return direct;
  const viaBtc = tickers[`${asset}BTC`]?.lastPrice;
  const btc = tickers.BTCUSDT?.lastPrice;
  return viaBtc && btc ? viaBtc * btc : null;
};

export type Holding = {
  symbol: string;
  name: string;
  imageUrl: string | null;
  amount: number;
  price: number | null; // cena w USDT
  value: number | null; // wartość w USDT
  share: number; // udział w portfelu (0–1)
  averagePrice: number | null; // średnia cena zakupu w USDT
  pnl: number | null; // niezrealizowany zysk/strata w USDT
  pnlPercent: number | null;
};

export const getPortfolio = async (userId: string) => {
  const wallet = await getOrCreateWallet(userId);
  const [balances, trades, tickers] = await Promise.all([
    prisma.balance.findMany({
      where: { walletId: wallet.id, amount: { gt: 0 } },
      include: { asset: { select: { name: true, imageUrl: true } } },
    }),
    prisma.trade.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "asc" },
      include: { market: { select: { baseSymbol: true, quoteSymbol: true } } },
    }),
    getTickers(),
  ]);

  const positions = computeCostBasis(
    trades.map((t) => ({
      base: t.market.baseSymbol,
      quote: t.market.quoteSymbol,
      side: t.side,
      quantity: t.quantity.toNumber(),
      value: t.quoteAmount.toNumber(),
      fee: t.fee.toNumber(),
      quoteRateUsdt: t.quoteRateUsdt.toNumber(),
    })),
  );

  const rows = balances.map((b) => {
    const amount = b.amount.toNumber();
    const price = usdtPriceOf(b.assetSymbol, tickers);
    const position = positions.get(b.assetSymbol);
    const averagePrice = position && position.quantity > 0 ? position.cost / position.quantity : null;
    const value = price === null ? null : amount * price;
    const cost = averagePrice === null ? null : averagePrice * amount;
    const pnl = value !== null && cost !== null ? value - cost : null;
    return {
      symbol: b.assetSymbol,
      name: b.asset.name,
      imageUrl: b.asset.imageUrl,
      amount,
      price,
      value,
      averagePrice,
      pnl,
      pnlPercent: pnl !== null && cost ? (pnl / cost) * 100 : null,
    };
  });

  const total = rows.reduce((sum, h) => sum + (h.value ?? 0), 0);
  const initial = wallet.initialBalance.toNumber();
  const holdings: Holding[] = rows
    .map((h) => ({ ...h, share: total > 0 ? (h.value ?? 0) / total : 0 }))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return {
    walletId: wallet.id,
    walletName: wallet.name,
    total,
    initial,
    pnl: total - initial,
    roi: ((total - initial) / initial) * 100, // zwrot z inwestycji w %
    cash: holdings.find((h) => h.symbol === "USDT")?.amount ?? 0,
    tradeCount: trades.length,
    holdings,
  };
};

export type Portfolio = Awaited<ReturnType<typeof getPortfolio>>;

// Zapisuje bieżącą wartość portfela jako punkt na wykresie.
export const recordSnapshot = async (walletId: string, totalValue: number) => {
  await prisma.portfolioSnapshot.create({ data: { walletId, totalValue } });
};

// Zapis „co najwyżej raz na godzinę” — żeby wykres miał punkty także bez transakcji.
export const recordSnapshotIfStale = async (walletId: string, totalValue: number) => {
  const last = await prisma.portfolioSnapshot.findFirst({ where: { walletId }, orderBy: { createdAt: "desc" } });
  if (!last || Date.now() - last.createdAt.getTime() > HOUR) await recordSnapshot(walletId, totalValue);
};

export type ValuePoint = { time: number; value: number }; // time w sekundach UNIX

// Historia wartości portfela + bieżąca wartość jako ostatni punkt.
export const getValueHistory = async (walletId: string, currentValue: number): Promise<ValuePoint[]> => {
  const rows = await prisma.portfolioSnapshot.findMany({
    where: { walletId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, totalValue: true },
  });
  const points = rows.map((r) => ({ time: r.createdAt.getTime() / 1000, value: r.totalValue.toNumber() }));
  points.push({ time: Date.now() / 1000, value: currentValue });

  // Biblioteka wykresów wymaga rosnących, unikalnych czasów (co do sekundy).
  const bySecond = new Map(points.map((p) => [Math.floor(p.time), p.value]));
  return [...bySecond].map(([time, value]) => ({ time, value }));
};
