"use client";

import { useState } from "react";
import { ErrorMessage, Field, SubmitButton, TextLink } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const [done, setDone] = useState(false);
  const { onSubmit, error, pending } = useFormAction(async (form) => {
    const newPassword = String(form.get("password"));
    if (newPassword !== form.get("confirmPassword")) return "Hasła nie są identyczne.";

    const { error } = await authClient.resetPassword({ newPassword, token });
    if (error) return authErrorMessage(error, "Link wygasł albo był już użyty. Poproś o nowy.");
    setDone(true);
  });

  if (done) {
    return (
      <>
        <p role="status" className="mt-4 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          Hasło zmienione. Ze względów bezpieczeństwa wylogowaliśmy Cię ze wszystkich urządzeń.
        </p>
        <p className="mt-6 text-center text-sm text-muted">
          <TextLink href="/login">Zaloguj się</TextLink>
        </p>
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <Field label="Nowe hasło" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <Field label="Powtórz hasło" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
      <ErrorMessage message={error} />
      <SubmitButton pending={pending}>Zapisz hasło</SubmitButton>
    </form>
  );
};
