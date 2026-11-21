-- DropForeignKey
ALTER TABLE "Balance" DROP CONSTRAINT "Balance_userId_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_userId_fkey";

-- DropIndex
DROP INDEX "Balance_userId_symbol_key";

-- AlterTable
ALTER TABLE "Balance" DROP COLUMN "symbol",
DROP COLUMN "userId",
ADD COLUMN     "assetSymbol" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "walletId" TEXT NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(36,18);

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "symbol",
DROP COLUMN "userId",
ADD COLUMN     "assetSymbol" TEXT NOT NULL,
ADD COLUMN     "fee" DECIMAL(36,18) NOT NULL DEFAULT 0,
ADD COLUMN     "quoteAmount" DECIMAL(36,18) NOT NULL,
ADD COLUMN     "walletId" TEXT NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(36,18),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(36,18);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "totpSecret" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Asset" (
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coingeckoId" TEXT,
    "binanceSymbol" TEXT,
    "isQuote" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initialBalance" DECIMAL(36,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "totalValue" DECIMAL(36,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_coingeckoId_key" ON "Asset"("coingeckoId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_binanceSymbol_key" ON "Asset"("binanceSymbol");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_name_key" ON "Wallet"("userId", "name");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_walletId_createdAt_idx" ON "PortfolioSnapshot"("walletId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_walletId_assetSymbol_key" ON "Balance"("walletId", "assetSymbol");

-- CreateIndex
CREATE INDEX "Trade_walletId_createdAt_idx" ON "Trade"("walletId", "createdAt");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_assetSymbol_fkey" FOREIGN KEY ("assetSymbol") REFERENCES "Asset"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_assetSymbol_fkey" FOREIGN KEY ("assetSymbol") REFERENCES "Asset"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioSnapshot" ADD CONSTRAINT "PortfolioSnapshot_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─── Ograniczenia integralności (dopisane ręcznie, Prisma nie obsługuje CHECK) ───

-- Saldo nigdy nie może być ujemne — ostatnia linia obrony przed błędem w silniku symulacji.
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_amount_non_negative" CHECK ("amount" >= 0);

-- Transakcja musi mieć dodatnią ilość i cenę, prowizja nie może być ujemna.
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_price_positive" CHECK ("price" > 0);
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_quote_amount_positive" CHECK ("quoteAmount" > 0);
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_fee_non_negative" CHECK ("fee" >= 0);

ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_initial_balance_positive" CHECK ("initialBalance" > 0);
ALTER TABLE "PortfolioSnapshot" ADD CONSTRAINT "PortfolioSnapshot_total_value_non_negative" CHECK ("totalValue" >= 0);
