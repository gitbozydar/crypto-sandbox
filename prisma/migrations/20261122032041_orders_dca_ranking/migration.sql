-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('STOP_LOSS', 'TAKE_PROFIT', 'LIMIT_BUY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ACTIVE', 'EXECUTED', 'CANCELLED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showInRanking" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ConditionalOrder" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "marketSymbol" TEXT NOT NULL,
    "type" "TriggerType" NOT NULL,
    "triggerPrice" DECIMAL(36,18) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'ACTIVE',
    "failReason" TEXT,
    "tradeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "ConditionalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringBuy" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "marketSymbol" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "intervalHours" INTEGER NOT NULL,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringBuy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConditionalOrder_tradeId_key" ON "ConditionalOrder"("tradeId");

-- CreateIndex
CREATE INDEX "ConditionalOrder_status_marketSymbol_idx" ON "ConditionalOrder"("status", "marketSymbol");

-- CreateIndex
CREATE INDEX "ConditionalOrder_walletId_status_idx" ON "ConditionalOrder"("walletId", "status");

-- CreateIndex
CREATE INDEX "RecurringBuy_isActive_nextRunAt_idx" ON "RecurringBuy"("isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "RecurringBuy_walletId_idx" ON "RecurringBuy"("walletId");

-- AddForeignKey
ALTER TABLE "ConditionalOrder" ADD CONSTRAINT "ConditionalOrder_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionalOrder" ADD CONSTRAINT "ConditionalOrder_marketSymbol_fkey" FOREIGN KEY ("marketSymbol") REFERENCES "Market"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionalOrder" ADD CONSTRAINT "ConditionalOrder_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBuy" ADD CONSTRAINT "RecurringBuy_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBuy" ADD CONSTRAINT "RecurringBuy_marketSymbol_fkey" FOREIGN KEY ("marketSymbol") REFERENCES "Market"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Ograniczenia (dopisane ręcznie): próg, kwota i interwał muszą być dodatnie.
ALTER TABLE "ConditionalOrder" ADD CONSTRAINT "ConditionalOrder_positive" CHECK ("triggerPrice" > 0 AND "amount" > 0);
ALTER TABLE "RecurringBuy" ADD CONSTRAINT "RecurringBuy_positive" CHECK ("amount" > 0 AND "intervalHours" > 0);
