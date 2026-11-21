"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getPortfolio, recordSnapshot } from "@/lib/portfolio/portfolio";
import { getCurrentUser } from "@/lib/session";
import { executeMarketOrder, TradeError, type TradeResult } from "@/lib/trading/engine";

// Dane z przeglądarki są niezaufane: sprawdzamy tylko ich kształt.
// Cenę, saldo i właściciela portfela silnik ustala sam po stronie serwera.
const orderSchema = z
  .object({
    market: z.string().max(40),
    side: z.enum(["BUY", "SELL"]),
    amount: z.string().trim().transform((s) => s.replace(",", ".")), // polski przecinek → kropka
    max: z.boolean().default(false),
  })
  // Przy „100%” kwota jest ignorowana, w innym wypadku musi być zwykłą liczbą (bez np. "1e5").
  .refine((o) => o.max || /^\d{1,18}(\.\d{1,18})?$/.test(o.amount));

export type PlaceOrderResult = { ok: true; trade: TradeResult } | { ok: false; error: string };

export const placeOrder = async (input: z.input<typeof orderSchema>): Promise<PlaceOrderResult> => {
  const user = await getCurrentUser(); // bez sesji → przekierowanie na /login

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Podaj poprawną kwotę." };

  try {
    const trade = await executeMarketOrder(user.id, parsed.data);
    // Nowy punkt na wykresie wartości portfela — zapisujemy już po wysłaniu odpowiedzi.
    after(async () => {
      const portfolio = await getPortfolio(user.id);
      await recordSnapshot(portfolio.walletId, portfolio.total);
    });
    refresh(); // odśwież stronę (salda, historia) w tej samej odpowiedzi
    return { ok: true, trade };
  } catch (e) {
    if (e instanceof TradeError) return { ok: false, error: e.message };
    console.error("placeOrder", e);
    return { ok: false, error: "Nie udało się złożyć zlecenia. Spróbuj ponownie." };
  }
};
