"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { DCA_INTERVALS, TRIGGERS } from "@/lib/trading/constants";
import { TradeError } from "@/lib/trading/engine";
import { cancelConditionalOrder, createConditionalOrder, createRecurringBuy, stopRecurringBuy } from "@/lib/trading/orders";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Liczba dziesiętna z formularza (polski przecinek → kropka, bez zapisu "1e5").
const decimal = z
  .string()
  .trim()
  .transform((s) => s.replace(",", "."))
  .pipe(z.string().regex(/^\d{1,18}(\.\d{1,18})?$/));

// Wspólna obsługa: sesja → walidacja → akcja → odświeżenie strony. Błędy biznesowe (TradeError) trafiają do formularza.
const run = async <T,>(schema: z.ZodType<T>, input: unknown, action: (userId: string, data: T) => Promise<unknown>): Promise<ActionResult> => {
  const user = await getCurrentUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sprawdź wpisane wartości." };
  try {
    await action(user.id, parsed.data);
    refresh();
    return { ok: true };
  } catch (e) {
    if (e instanceof TradeError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Coś poszło nie tak. Spróbuj ponownie." };
  }
};

const conditionalSchema = z.object({
  market: z.string().max(40),
  type: z.enum(Object.keys(TRIGGERS) as [keyof typeof TRIGGERS]),
  triggerPrice: decimal,
  amount: decimal,
});
export const createConditionalOrderAction = async (input: z.input<typeof conditionalSchema>) =>
  run(conditionalSchema, input, createConditionalOrder);

const planSchema = z.object({
  market: z.string().max(40),
  amount: decimal,
  intervalHours: z.coerce.number().refine((h) => h in DCA_INTERVALS),
});
export const createRecurringBuyAction = async (input: z.input<typeof planSchema>) => run(planSchema, input, createRecurringBuy);

const idSchema = z.string().max(40);
export const cancelConditionalOrderAction = async (orderId: string) => run(idSchema, orderId, cancelConditionalOrder);
export const stopRecurringBuyAction = async (planId: string) => run(idSchema, planId, stopRecurringBuy);
