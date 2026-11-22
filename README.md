# Crypto Sandbox

Symulator handlu kryptowalutami: prawdziwe ceny z Binance, wirtualny kapitał (10 000 USDT na start).
Praca inżynierska.

## Uruchomienie

```bash
npm install
npm run db:deploy      # migracje bazy
npm run db:seed        # waluta startowa (USDT)
npm run sync:markets   # pary z Binance + nazwy i logo z CoinGecko
npm run dev            # http://localhost:3000
npm run lint           # ESLint
npm run format         # Prettier
```

Wymagane zmienne w `.env`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
Opcjonalnie `COINGECKO_API_KEY` — wyższy limit zapytań CoinGecko.

Maile (potwierdzenie e-maila, reset hasła) nie są wysyłane — link pojawia się w terminalu `npm run dev`.

Po zmianie `prisma/schema.prisma`: `npm run db:migrate`, potem restart `npm run dev`.

## Struktura

```
app/
  (auth)/              logowanie, rejestracja, kod 2FA, reset hasła
  (app)/dashboard/     wartość portfela, zysk/strata, wykresy, pozycje
  (app)/markets/       lista rynku (filtry, sortowanie) i strona pary (wykres, zlecenia, ATH)
  (app)/orders/        zlecenia warunkowe i automatyczne kupowanie
  (app)/ranking/       ranking użytkowników według ROI
  (app)/profile/       zdjęcie, dane, hasło
  (app)/settings/      2FA, sesje, prywatność, reset portfela, usunięcie konta
  api/                 Better Auth, świece do wykresu
components/            wspólne klocki UI (przyciski, tabele, strona, powiadomienia)
lib/
  actions/             akcje serwera (handel, konto)
  auth.ts, session.ts  uwierzytelnianie (Better Auth + TOTP)
  market/              Binance, CoinGecko, synchronizacja, WebSocket
  trading/             silnik zleceń, portfel, zlecenia warunkowe i DCA
  portfolio/           wycena, zysk/strata, historia wartości, ranking
  jobs/                proces w tle wykonujący zlecenia i plany (co 15 s)
prisma/                schemat bazy, migracje, seed
scripts/               synchronizacja rynków
```

## Stos

Next.js 16 (App Router, Cache Components), Prisma 7 + PostgreSQL (Neon), Better Auth,
Tailwind CSS 4, lightweight-charts.
