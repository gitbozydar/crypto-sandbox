"use client";

// Ustawienia konta: wylogowanie innych urządzeń, reset portfela, usunięcie konta.
// Każdy formularz = jedno wywołanie useFormAction (błąd + blokada przycisku w jednym miejscu).
import { useRouter } from "next/navigation";
import { Button, ErrorMessage, Field } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { resetPortfolio } from "./actions";

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
