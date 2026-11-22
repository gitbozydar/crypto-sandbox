"use client";

import { useRouter } from "next/navigation";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { ErrorMessage, Field, SubmitButton, TextLink } from "@/components/ui";

// Strona rejestracji.
const RegisterPage = () => {
  const router = useRouter();
  const { onSubmit, error, pending } = useFormAction(async (form) => {
    const password = String(form.get("password"));
    if (password !== form.get("confirmPassword")) return "Hasła nie są identyczne.";

    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password,
      callbackURL: "/dashboard?notice=email-verified",
    });
    if (error) return authErrorMessage(error, "Nie udało się utworzyć konta.");

    router.push("/dashboard");
    router.refresh();
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Załóż konto</h1>
      <p className="mt-1 text-sm text-muted">Na start dostaniesz 10 000 USDT wirtualnego kapitału.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="Imię" name="name" required autoComplete="name" />
        <Field label="E-mail" name="email" type="email" required autoComplete="email" />
        <Field label="Hasło" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <Field
          label="Powtórz hasło"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <ErrorMessage message={error} />
        <SubmitButton pending={pending}>Zarejestruj się</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Masz już konto? <TextLink href="/login">Zaloguj się</TextLink>
      </p>
    </>
  );
};

export default RegisterPage;
