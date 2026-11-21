-- Kurs waluty kwotowania w USDT w chwili transakcji (do liczenia zysku/straty w USDT).
-- Dotychczasowe transakcje były tylko w parach z USDT, więc kurs = 1.
ALTER TABLE "Trade" ADD COLUMN "quoteRateUsdt" DECIMAL(36,18) NOT NULL DEFAULT 1;
ALTER TABLE "Trade" ALTER COLUMN "quoteRateUsdt" DROP DEFAULT;
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_quote_rate_positive" CHECK ("quoteRateUsdt" > 0);

-- Punkt startowy wykresu wartości portfela: kapitał początkowy w chwili założenia portfela.
INSERT INTO "PortfolioSnapshot" ("id", "walletId", "totalValue", "createdAt")
SELECT gen_random_uuid()::text, "id", "initialBalance", "createdAt" FROM "Wallet";
