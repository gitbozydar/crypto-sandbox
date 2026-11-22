"use client";

import { useTransition } from "react";
import { useToast } from "@/components/toast";
import type { ActionResult } from "@/lib/actions/run-action";
import { cancelConditionalOrder, stopRecurringBuy } from "@/lib/actions/trading";

const ACTIONS = {
  order: { run: cancelConditionalOrder, label: "Anuluj", done: "Anulowano zlecenie" },
  plan: { run: stopRecurringBuy, label: "Zatrzymaj", done: "Zatrzymano plan" },
} satisfies Record<string, { run: (id: string) => Promise<ActionResult>; label: string; done: string }>;

// Przycisk anulowania zlecenia lub zatrzymania planu.
export const CancelButton = ({ kind, id }: { kind: keyof typeof ACTIONS; id: string }) => {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const { run, label, done } = ACTIONS[kind];

  const click = () =>
    startTransition(async () => {
      const res = await run(id);
      toast(res.ok ? { title: done } : { tone: "error", title: "Nie udało się", text: res.error });
    });

  return (
    <button
      onClick={click}
      disabled={pending}
      className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
};
