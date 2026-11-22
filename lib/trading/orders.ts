import { prisma } from "@/lib/db";
import { getBookTicker } from "@/lib/market/binance";
import { Prisma } from "@/src/generated/prisma/client";
import {
  DCA_INTERVALS,
  MAX_ACTIVE_ORDERS,
  MAX_ACTIVE_PLANS,
  TRIGGERS,
  type DcaInterval,
  type TriggerType,
} from "./constants";
import { TradeError } from "./engine";
import { balanceOf, getOrCreateWallet } from "./wallet";

const Decimal = Prisma.Decimal;

// Funkcja zwracająca aktywną parę albo zgłaszająca błąd.
const activeMarket = async (symbol: string) => {
  const market = await prisma.market.findFirst({ where: { symbol, isActive: true } });
  if (!market) throw new TradeError("Ta para nie jest dostępna do handlu.");
  return market;
};

// Funkcja pobierająca bieżącą cenę pary.
const midPrice = async (symbol: string) => {
  const { bid, ask } = await getBookTicker(symbol);
  return new Decimal(bid).add(ask).div(2);
};

// Funkcja walidująca i tworząca zlecenie warunkowe.
export const createConditionalOrder = async (
  userId: string,
  input: { market: string; type: TriggerType; triggerPrice: string; amount: string },
) => {
  const market = await activeMarket(input.market);
  const wallet = await getOrCreateWallet(userId);
  const trigger = TRIGGERS[input.type];
  const triggerPrice = new Decimal(input.triggerPrice);
  const amount = new Decimal(input.amount);
  if (triggerPrice.lte(0) || amount.lte(0)) throw new TradeError("Cena i kwota muszą być większe od zera.");

  const active = await prisma.conditionalOrder.count({ where: { walletId: wallet.id, status: "ACTIVE" } });
  if (active >= MAX_ACTIVE_ORDERS) throw new TradeError(`Możesz mieć najwyżej ${MAX_ACTIVE_ORDERS} aktywnych zleceń.`);

  const price = await midPrice(market.symbol);
  const wrongSide = trigger.when === "below" ? triggerPrice.gte(price) : triggerPrice.lte(price);
  if (wrongSide) {
    const where = trigger.when === "below" ? "poniżej" : "powyżej";
    throw new TradeError(
      `${trigger.label}: cena musi być ${where} obecnej (${price.toSignificantDigits(8)} ${market.quoteSymbol}).`,
    );
  }

  const payAsset = trigger.side === "SELL" ? market.baseSymbol : market.quoteSymbol;
  const balance = await balanceOf(wallet.id, payAsset);
  if (amount.gt(balance)) throw new TradeError(`Masz tylko ${balance.toSignificantDigits(8)} ${payAsset}.`);

  return prisma.conditionalOrder.create({
    data: { walletId: wallet.id, marketSymbol: market.symbol, type: input.type, triggerPrice, amount },
  });
};

// Funkcja anulująca zlecenie warunkowe użytkownika.
export const cancelConditionalOrder = async (userId: string, orderId: string) => {
  const { count } = await prisma.conditionalOrder.updateMany({
    where: { id: orderId, status: "ACTIVE", wallet: { userId } },
    data: { status: "CANCELLED" },
  });
  if (count === 0) throw new TradeError("Tego zlecenia nie da się już anulować.");
};

// Funkcja walidująca i tworząca plan automatycznego kupowania.
export const createRecurringBuy = async (
  userId: string,
  input: { market: string; amount: string; intervalHours: number },
) => {
  const market = await activeMarket(input.market);
  const wallet = await getOrCreateWallet(userId);
  if (!(input.intervalHours in DCA_INTERVALS)) throw new TradeError("Nieprawidłowa częstotliwość.");

  const amount = new Decimal(input.amount);
  if (amount.lt(market.minNotional)) {
    throw new TradeError(`Minimalna kwota zakupu to ${market.minNotional} ${market.quoteSymbol}.`);
  }
  const active = await prisma.recurringBuy.count({ where: { walletId: wallet.id, isActive: true } });
  if (active >= MAX_ACTIVE_PLANS) throw new TradeError(`Możesz mieć najwyżej ${MAX_ACTIVE_PLANS} aktywnych planów.`);

  return prisma.recurringBuy.create({
    data: {
      walletId: wallet.id,
      marketSymbol: market.symbol,
      amount,
      intervalHours: input.intervalHours,
      nextRunAt: new Date(),
    },
  });
};

// Funkcja zatrzymująca plan automatycznego kupowania.
export const stopRecurringBuy = async (userId: string, planId: string) => {
  const { count } = await prisma.recurringBuy.updateMany({
    where: { id: planId, isActive: true, wallet: { userId } },
    data: { isActive: false },
  });
  if (count === 0) throw new TradeError("Ten plan jest już zatrzymany.");
};

// Funkcja pobierająca zlecenia i plany użytkownika.
export const getOrders = async (userId: string, market?: string) => {
  const where = { wallet: { userId }, marketSymbol: market };
  const pair = { market: { select: { baseSymbol: true, quoteSymbol: true, tickSize: true } } };

  const [conditional, recurring] = await Promise.all([
    prisma.conditionalOrder.findMany({ where, include: pair, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.recurringBuy.findMany({ where, include: pair, orderBy: { createdAt: "desc" } }),
  ]);

  return {
    conditional: conditional.map((o) => ({
      id: o.id,
      base: o.market.baseSymbol,
      quote: o.market.quoteSymbol,
      tickSize: o.market.tickSize.toString(),
      type: o.type,
      triggerPrice: o.triggerPrice.toString(),
      amount: o.amount.toString(),
      status: o.status,
      failReason: o.failReason,
      createdAt: o.createdAt,
      executedAt: o.executedAt,
    })),
    recurring: recurring.map((p) => ({
      id: p.id,
      base: p.market.baseSymbol,
      quote: p.market.quoteSymbol,
      amount: p.amount.toString(),
      intervalHours: p.intervalHours as DcaInterval,
      isActive: p.isActive,
      runCount: p.runCount,
      nextRunAt: p.nextRunAt,
      lastError: p.lastError,
    })),
  };
};

export type Orders = Awaited<ReturnType<typeof getOrders>>;
