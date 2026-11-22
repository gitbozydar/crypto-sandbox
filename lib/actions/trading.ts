"use server";

import { after } from "next/server";
import { z } from "zod";
import { getPortfolio, recordSnapshot } from "@/lib/portfolio/portfolio";
import { DCA_INTERVALS, TRIGGERS, type TriggerType } from "@/lib/trading/constants";
import { executeMarketOrder } from "@/lib/trading/engine";
import * as orders from "@/lib/trading/orders";
import { DECIMAL, runAction } from "./run-action";

const decimal = z
  .string()
  .trim()
  .transform((s) => s.replace(",", "."))
  .pipe(z.string().regex(DECIMAL));
const market = z.string().max(40);
const id = z.string().max(40);

const marketOrderSchema = z
  .object({ market, side: z.enum(["BUY", "SELL"]), amount: z.string().trim(), max: z.boolean().default(false) })
  .transform((o) => ({ ...o, amount: o.amount.replace(",", ".") }))
  .refine((o) => o.max || DECIMAL.test(o.amount));

// Akcja serwera składająca zlecenie rynkowe.
export const placeOrder = async (input: z.input<typeof marketOrderSchema>) =>
  runAction(marketOrderSchema, input, async (userId, order) => {
    const trade = await executeMarketOrder(userId, order);
    after(async () => {
      const portfolio = await getPortfolio(userId);
      await recordSnapshot(portfolio.walletId, portfolio.total);
    });
    return trade;
  });

const conditionalSchema = z.object({
  market,
  type: z.enum(Object.keys(TRIGGERS) as [TriggerType]),
  triggerPrice: decimal,
  amount: decimal,
});
// Akcja serwera tworząca zlecenie warunkowe.
export const createConditionalOrder = async (input: z.input<typeof conditionalSchema>) =>
  runAction(conditionalSchema, input, async (userId, data) => {
    await orders.createConditionalOrder(userId, data);
  });

// Akcja serwera anulująca zlecenie warunkowe.
export const cancelConditionalOrder = async (orderId: string) => runAction(id, orderId, orders.cancelConditionalOrder);

const recurringSchema = z.object({
  market,
  amount: decimal,
  intervalHours: z.coerce.number().refine((h) => h in DCA_INTERVALS),
});
// Akcja serwera tworząca plan automatycznego kupowania.
export const createRecurringBuy = async (input: z.input<typeof recurringSchema>) =>
  runAction(recurringSchema, input, async (userId, data) => {
    await orders.createRecurringBuy(userId, data);
  });

// Akcja serwera zatrzymująca plan automatycznego kupowania.
export const stopRecurringBuy = async (planId: string) => runAction(id, planId, orders.stopRecurringBuy);
