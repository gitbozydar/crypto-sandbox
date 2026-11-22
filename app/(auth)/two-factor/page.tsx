"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { ErrorMessage, Field, SubmitButton } from "@/components/ui";

// Strona podawania kodu 2FA przy logowaniu.
const TwoFactorPage = () => {
  const router = useRouter();
  const [useBackup, setUseBackup] = useState(false);
  const { onSubmit, error, pending } = useFormAction(async (form) => {
    const code = String(form.get("code")).trim();
    const { error } = useBackup
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code });
    if (error) return authErrorMessage(error, "Nieprawidłowy kod.");

    router.push("/dashboard");
    router.refresh();
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Weryfikacja dwuetapowa</h1>
      <p className="mt-1 text-sm text-muted">
        {useBackup
          ? "Wpisz jeden z kodów zapasowych zapisanych przy włączaniu 2FA."
          : "Wpisz 6-cyfrowy kod z aplikacji uwierzytelniającej."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        {useBackup ? (
          <Field key="backup" label="Kod zapasowy" name="code" required autoComplete="off" />
        ) : (
          <Field
            key="totp"
            label="Kod"
            name="code"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
          />
        )}
        <ErrorMessage message={error} />
        <SubmitButton pending={pending}>Potwierdź</SubmitButton>
      </form>

      <button
        type="button"
        onClick={() => setUseBackup(!useBackup)}
        className="mt-4 w-full text-center text-sm text-muted underline hover:text-foreground"
      >
        {useBackup ? "Użyj kodu z aplikacji" : "Nie masz dostępu do aplikacji? Użyj kodu zapasowego"}
      </button>
    </>
  );
};

export default TwoFactorPage;
