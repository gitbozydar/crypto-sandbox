// Proces w tle: co kilkanaście sekund sprawdza zlecenia warunkowe i plany automatycznego kupowania.
// Każde zlecenie najpierw „rezerwujemy” warunkowym UPDATE (WHERE status = 'ACTIVE'), a dopiero potem
// wykonujemy — dzięki temu nawet przy kilku instancjach serwera nic nie wykona się dwa razy.
import { prisma } from "@/lib/db";
import { getPrices } from "@/lib/market/binance";
import { TRIGGERS } from "@/lib/trading/constants";
import { executeMarketOrder, TradeError } from "@/lib/trading/engine";

const HOUR = 60 * 60 * 1000;
const errorText = (e: unknown) => (e instanceof TradeError ? e.message : "Nieoczekiwany błąd przy wykonaniu.");

// Zlecenia warunkowe, których próg został osiągnięty, wykonujemy jak zwykłe zlecenie rynkowe.
const runConditionalOrders = async () => {
  const orders = await prisma.conditionalOrder.findMany({
    where: { status: "ACTIVE" },
    include: { wallet: { select: { userId: true } } },
  });
  if (orders.length === 0) return 0;

  const prices = await getPrices([...new Set(orders.map((o) => o.marketSymbol))]);
  let executed = 0;

  for (const order of orders) {
    const price = prices.get(order.marketSymbol);
    const trigger = TRIGGERS[order.type];
    const threshold = order.triggerPrice.toNumber();
    const reached = price !== undefined && (trigger.when === "below" ? price <= threshold : price >= threshold);
    if (!reached) continue;

    const claimed = await prisma.conditionalOrder.updateMany({
      where: { id: order.id, status: "ACTIVE" },
      data: { status: "EXECUTED", executedAt: new Date() },
    });
    if (claimed.count === 0) continue; // ktoś (inna instancja / anulowanie) był pierwszy

    try {
      const trade = await executeMarketOrder(order.wallet.userId, {
        market: order.marketSymbol,
        side: trigger.side,
        amount: order.amount.toFixed(),
      });
      await prisma.conditionalOrder.update({ where: { id: order.id }, data: { tradeId: trade.id } });
      executed++;
    } catch (e) {
      await prisma.conditionalOrder.update({ where: { id: order.id }, data: { status: "FAILED", failReason: errorText(e) } });
    }
  }
  return executed;
};

// Plany automatycznego kupowania, których termin minął.
const runRecurringBuys = async () => {
  const now = new Date();
  const plans = await prisma.recurringBuy.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
    include: { wallet: { select: { userId: true } } },
  });
  let executed = 0;

  for (const plan of plans) {
    // Rezerwacja: przesuwamy termin tylko, jeśli nikt tego jeszcze nie zrobił.
    const claimed = await prisma.recurringBuy.updateMany({
      where: { id: plan.id, isActive: true, nextRunAt: plan.nextRunAt },
      data: { nextRunAt: new Date(now.getTime() + plan.intervalHours * HOUR) },
    });
    if (claimed.count === 0) continue;

    try {
      await executeMarketOrder(plan.wallet.userId, { market: plan.marketSymbol, side: "BUY", amount: plan.amount.toFixed() });
      await prisma.recurringBuy.update({
        where: { id: plan.id },
        data: { runCount: { increment: 1 }, lastRunAt: now, lastError: null },
      });
      executed++;
    } catch (e) {
      // Plan działa dalej — np. po doładowaniu salda następny zakup się uda.
      await prisma.recurringBuy.update({ where: { id: plan.id }, data: { lastRunAt: now, lastError: errorText(e) } });
    }
  }
  return executed;
};

export const runJobs = async () => {
  const [orders, recurring] = await Promise.all([runConditionalOrders(), runRecurringBuys()]);
  return { orders, recurring };
};
