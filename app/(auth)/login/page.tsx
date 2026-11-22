"use client";

import { useRouter } from "next/navigation";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { ErrorMessage, Field, SubmitButton, TextLink } from "@/components/ui";

// Strona logowania.
const LoginPage = () => {
  const router = useRouter();
  const { onSubmit, error, pending } = useFormAction(async (form) => {
    const { data, error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error)
      return error.status === 401 ? "Nieprawidłowy e-mail lub hasło." : authErrorMessage(error, "Błąd logowania.");

    const needsCode = data && "twoFactorRedirect" in data && data.twoFactorRedirect;
    router.push(needsCode ? "/two-factor" : "/dashboard");
    router.refresh();
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Zaloguj się</h1>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="E-mail" name="email" type="email" required autoComplete="email" />
        <Field label="Hasło" name="password" type="password" required autoComplete="current-password" />
        <TextLink href="/forgot-password" className="-mt-2 self-end text-sm">
          Nie pamiętasz hasła?
        </TextLink>
        <ErrorMessage message={error} />
        <SubmitButton pending={pending}>Zaloguj</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Nie masz konta? <TextLink href="/register">Zarejestruj się</TextLink>
      </p>
    </>
  );
};

export default LoginPage;
