"use client"; // granice błędów muszą być komponentami klienckimi

import "./globals.css";

// Ostatnia deska ratunku: błąd w samym głównym układzie (app/layout.tsx).
// Zastępuje cały dokument, dlatego ma własne <html> i <body>.
const GlobalError = ({ retry }: { error: unknown; retry: () => void }) => (
  <html lang="pl">
    <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <title>Błąd — Crypto Sandbox</title>
      <p className="font-mono text-5xl font-semibold text-primary">Błąd</p>
      <h1 className="text-2xl font-semibold">Aplikacja napotkała problem</h1>
      <p className="max-w-md text-muted">Spróbuj odświeżyć stronę za chwilę.</p>
      <button onClick={() => retry()} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
        Spróbuj ponownie
      </button>
    </body>
  </html>
);

export default GlobalError;
