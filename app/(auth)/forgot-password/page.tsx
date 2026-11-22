"use client";

import { useState } from "react";
import { ErrorMessage, Field, SubmitButton, TextLink } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

// Strona prośby o link do resetu hasła.
const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const { onSubmit, error, pending } = useFormAction(async (form) => {
    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/reset-password",
    });
    if (error) return authErrorMessage(error, "Nie udało się wysłać linku.");
    setSent(true);
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Nie pamiętasz hasła?</h1>
      {sent ? (
        <p role="status" className="mt-4 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          Jeśli konto z tym adresem istnieje, wysłaliśmy na nie link do ustawienia nowego hasła.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">Podaj e-mail — wyślemy link do ustawienia nowego hasła.</p>
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <Field label="E-mail" name="email" type="email" required autoComplete="email" />
            <ErrorMessage message={error} />
            <SubmitButton pending={pending}>Wyślij link</SubmitButton>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <TextLink href="/login">Wróć do logowania</TextLink>
      </p>
    </>
  );
};

export default ForgotPasswordPage;
