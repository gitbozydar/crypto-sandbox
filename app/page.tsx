import { ButtonLink } from "@/components/ui";

// Strona powitalna.
const Home = () => (
  <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
    <h1 className="text-4xl font-semibold tracking-tight">Crypto Sandbox</h1>
    <p className="max-w-md text-muted">
      Handluj kryptowalutami po prawdziwych cenach rynkowych — bez ryzyka, na wirtualnym kapitale.
    </p>
    <div className="flex flex-wrap justify-center gap-3">
      <ButtonLink href="/register">Załóż konto</ButtonLink>
      <ButtonLink href="/login" variant="outline">
        Zaloguj się
      </ButtonLink>
    </div>
  </main>
);

export default Home;
