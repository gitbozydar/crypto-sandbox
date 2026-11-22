"use client";

import { useState } from "react";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

// Komponent przypomnienia o potwierdzeniu e-maila z ponownym wysłaniem linku.
export const VerifyEmailBanner = ({ email }: { email: string }) => {
  const [sent, setSent] = useState(false);
  const { onSubmit, error, pending } = useFormAction(async () => {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/dashboard?notice=email-verified",
    });
    if (error) return authErrorMessage(error, "Nie udało się wysłać linku.");
    setSent(true);
  });

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-primary/30 bg-primary-soft px-4 py-2.5 text-sm"
    >
      <span>
        Potwierdź adres <strong>{email}</strong> — link wysłaliśmy przy rejestracji.
      </span>
      {sent ? (
        <span className="text-success">✓ Wysłano nowy link</span>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="font-medium text-primary underline underline-offset-2 disabled:opacity-50"
        >
          {pending ? "Wysyłam…" : "Wyślij link ponownie"}
        </button>
      )}
      {error && <span className="text-danger">{error}</span>}
    </form>
  );
};
