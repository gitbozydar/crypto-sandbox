import { refresh } from "next/cache";
import type { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { TradeError } from "@/lib/trading/engine";

export type ActionResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

export const DECIMAL = /^\d{1,18}(\.\d{1,18})?$/;

// Funkcja sprawdzająca sesję, walidująca dane i wykonująca akcję serwera.
export const runAction = async <Input, Output>(
  schema: z.ZodType<Input>,
  input: unknown,
  action: (userId: string, data: Input) => Promise<Output>,
): Promise<ActionResult<Output>> => {
  const user = await getCurrentUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sprawdź wpisane wartości." };
  try {
    const data = await action(user.id, parsed.data);
    refresh();
    return { ok: true, data };
  } catch (e) {
    if (e instanceof TradeError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Coś poszło nie tak. Spróbuj ponownie." };
  }
};
