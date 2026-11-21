"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import QRCode from "react-qr-code";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { Badge, Card, ErrorMessage, Field, SubmitButton } from "@/components/ui";

type Setup = { totpURI: string; backupCodes: string[] };

// Włączanie 2FA przebiega w dwóch krokach:
// 1) potwierdzenie hasłem → serwer generuje sekret TOTP i kody zapasowe,
// 2) użytkownik skanuje QR i wpisuje pierwszy kod → dopiero wtedy 2FA jest aktywne.
export const TwoFactorSettings = ({ enabled }: { enabled: boolean }) => {
  const router = useRouter();
  const [setup, setSetup] = useState<Setup | null>(null);

  // Krok 1: hasło → serwer generuje sekret (kod QR) i kody zapasowe.
  const start = useFormAction(async (form) => {
    const { data, error } = await authClient.twoFactor.enable({ password: String(form.get("password")) });
    if (error) return error.message ?? "Nieprawidłowe hasło.";
    if (data && "totpURI" in data) setSetup(data);
  });

  // Krok 2: pierwszy kod z aplikacji → 2FA staje się aktywne.
  const confirm = useFormAction(async (form) => {
    const { error } = await authClient.twoFactor.verifyTotp({ code: String(form.get("code")).trim() });
    if (error) return error.message ?? "Nieprawidłowy kod.";
    setSetup(null);
    router.refresh();
  });

  const disable = useFormAction(async (form) => {
    const { error } = await authClient.twoFactor.disable({ password: String(form.get("password")) });
    if (error) return error.message ?? "Nieprawidłowe hasło.";
    router.refresh();
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Weryfikacja dwuetapowa (2FA)</h2>
        <Badge tone={enabled ? "success" : "neutral"}>{enabled ? "Włączona" : "Wyłączona"}</Badge>
      </div>

      <div className="mt-4 max-w-sm">
        {enabled ? (
          <form onSubmit={disable.onSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-muted">Aby wyłączyć 2FA, potwierdź hasłem.</p>
            <Field label="Hasło" name="password" type="password" required autoComplete="current-password" />
            <ErrorMessage message={disable.error} />
            <SubmitButton pending={disable.pending}>Wyłącz 2FA</SubmitButton>
          </form>
        ) : setup ? (
          <form onSubmit={confirm.onSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Zeskanuj kod w Google Authenticator (lub innej aplikacji TOTP), a następnie wpisz wygenerowany kod.
            </p>
            <div className="self-start rounded-lg bg-white p-3">
              <QRCode value={setup.totpURI} size={176} />
            </div>
            <div>
              <p className="text-sm font-medium">Kody zapasowe</p>
              <p className="text-xs text-muted">Zapisz je w bezpiecznym miejscu — każdy działa jednorazowo.</p>
              <ul className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-3 font-mono text-sm">
                {setup.backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <Field
              label="Kod z aplikacji"
              name="code"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
            />
            <ErrorMessage message={confirm.error} />
            <SubmitButton pending={confirm.pending}>Aktywuj 2FA</SubmitButton>
          </form>
        ) : (
          <form onSubmit={start.onSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Zabezpiecz konto kodem jednorazowym z aplikacji uwierzytelniającej. Potwierdź hasłem, aby zacząć.
            </p>
            <Field label="Hasło" name="password" type="password" required autoComplete="current-password" />
            <ErrorMessage message={start.error} />
            <SubmitButton pending={start.pending}>Włącz 2FA</SubmitButton>
          </form>
        )}
      </div>
    </Card>
  );
};
