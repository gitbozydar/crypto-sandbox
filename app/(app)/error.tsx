"use client"; // granice błędów muszą być komponentami klienckimi

import { useEffect } from "react";
import { PageMessage } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui";

// Błąd w zalogowanej części — pasek nawigacji zostaje, komunikat pojawia się w miejscu treści.
// `retry` pobiera i renderuje stronę od nowa — przy chwilowej awarii zwykle wystarcza.
const ErrorPage = ({ error, retry }: { error: unknown; retry: () => void }) => {
  useEffect(() => console.error(error), [error]);

  return (
    <PageMessage code="Błąd" title="Coś poszło nie tak" text="Nie udało się wczytać tej strony. Spróbuj ponownie za chwilę.">
      <Button onClick={() => retry()}>Spróbuj ponownie</Button>
      <ButtonLink href="/dashboard" variant="outline">
        Wróć do portfela
      </ButtonLink>
    </PageMessage>
  );
};

export default ErrorPage;
