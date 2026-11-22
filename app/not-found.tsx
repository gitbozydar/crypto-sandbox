import { PageMessage } from "@/components/states";
import { ButtonLink } from "@/components/ui";

// Strona 404.
const NotFound = () => (
  <PageMessage code="404" title="Nie ma takiej strony" text="Adres jest nieprawidłowy albo ta strona już nie istnieje.">
    <ButtonLink href="/dashboard">Wróć do portfela</ButtonLink>
    <ButtonLink href="/markets" variant="outline">
      Przejdź do rynku
    </ButtonLink>
  </PageMessage>
);

export default NotFound;
