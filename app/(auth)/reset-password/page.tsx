import { Suspense } from "react";
import { TextLink } from "@/components/ui";
import { ResetPasswordForm } from "./reset-password-form";

// Strona ustawiania nowego hasła.
const ResetPasswordPage = ({ searchParams }: PageProps<"/reset-password">) => (
  <>
    <h1 className="text-2xl font-semibold">Ustaw nowe hasło</h1>
    <Suspense fallback={<p className="mt-4 text-sm text-muted">Ładowanie…</p>}>
      <ResetPassword searchParams={searchParams} />
    </Suspense>
  </>
);

export default ResetPasswordPage;

// Komponent sprawdzający token z linku i wyświetlający formularz.
const ResetPassword = async ({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) => {
  const { token, error } = await searchParams;
  if (typeof token === "string" && !error) return <ResetPasswordForm token={token} />;

  return (
    <>
      <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
        Link jest nieprawidłowy albo wygasł. Poproś o nowy.
      </p>
      <p className="mt-6 text-center text-sm text-muted">
        <TextLink href="/forgot-password">Wyślij nowy link</TextLink>
      </p>
    </>
  );
};
