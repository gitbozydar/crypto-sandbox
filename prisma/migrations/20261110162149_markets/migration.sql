-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_assetSymbol_fkey";

-- DropIndex
DROP INDEX "Asset_binanceSymbol_key";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "binanceSymbol",
DROP COLUMN "isQuote";

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "assetSymbol",
ADD COLUMN     "marketSymbol" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Market" (
    "symbol" TEXT NOT NULL,
    "baseSymbol" TEXT NOT NULL,
    "quoteSymbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tickSize" DECIMAL(36,18) NOT NULL,
    "stepSize" DECIMAL(36,18) NOT NULL,
    "minQty" DECIMAL(36,18) NOT NULL,
    "minNotional" DECIMAL(36,18) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("symbol")
);

-- CreateIndex
CREATE INDEX "Market_quoteSymbol_idx" ON "Market"("quoteSymbol");

-- CreateIndex
CREATE UNIQUE INDEX "Market_baseSymbol_quoteSymbol_key" ON "Market"("baseSymbol", "quoteSymbol");

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_baseSymbol_fkey" FOREIGN KEY ("baseSymbol") REFERENCES "Asset"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_quoteSymbol_fkey" FOREIGN KEY ("quoteSymbol") REFERENCES "Asset"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_marketSymbol_fkey" FOREIGN KEY ("marketSymbol") REFERENCES "Market"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Para musi łączyć dwie różne monety, a filtry giełdy muszą być dodatnie (dopisane ręcznie).
ALTER TABLE "Market" ADD CONSTRAINT "Market_distinct_assets" CHECK ("baseSymbol" <> "quoteSymbol");
ALTER TABLE "Market" ADD CONSTRAINT "Market_filters_positive" CHECK ("tickSize" > 0 AND "stepSize" > 0 AND "minQty" >= 0 AND "minNotional" >= 0);
