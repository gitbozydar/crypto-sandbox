"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ErrorMessage, Field } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { resetPortfolio, setRankingVisibility } from "@/lib/actions/account";

// Przycisk wylogowania wszystkich innych urządzeń.
export const RevokeOtherSessions = () => {
  const router = useRouter();
  const { onSubmit, error, pending } = useFormAction(async () => {
    const { error } = await authClient.revokeOtherSessions();
    if (error) return error.message ?? "Nie udało się wylogować innych urządzeń.";
    router.refresh();
  });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <ErrorMessage message={error} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="self-start">
        Wyloguj wszystkie inne urządzenia
      </Button>
    </form>
  );
};

// Przycisk resetu portfela do kapitału startowego.
export const ResetPortfolio = () => {
  const { onSubmit, pending } = useFormAction(async () => {
    if (!confirm("Na pewno? Salda, transakcje i historia wartości zostaną usunięte.")) return;
    await resetPortfolio();
  });
  return (
    <form onSubmit={onSubmit}>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Resetuję…" : "Zresetuj portfel"}
      </Button>
    </form>
  );
};

// Formularz usunięcia konta potwierdzanego hasłem.
export const DeleteAccount = () => {
  const router = useRouter();
  const { onSubmit, error, pending } = useFormAction(async (form) => {
    if (!confirm("Konto zostanie usunięte na zawsze. Kontynuować?")) return;
    const { error } = await authClient.deleteUser({ password: String(form.get("password")) });
    if (error) return error.message ?? "Nie udało się usunąć konta.";
    router.push("/");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="Potwierdź hasłem" name="password" type="password" required autoComplete="current-password" />
      <ErrorMessage message={error} />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-danger-foreground disabled:opacity-50"
      >
        {pending ? "Usuwam…" : "Usuń konto"}
      </button>
    </form>
  );
};

// Przełącznik widoczności w rankingu.
export const RankingVisibility = ({ visible }: { visible: boolean }) => {
  const [checked, setChecked] = useState(visible);
  const [pending, startTransition] = useTransition();
  const toggle = () => {
    const next = !checked;
    setChecked(next);
    startTransition(() => setRankingVisibility(next));
  };
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={toggle}
        disabled={pending}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border-strong"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-foreground transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </button>
      Pokazuj mnie w rankingu
    </label>
  );
};
