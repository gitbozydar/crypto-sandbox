import { prisma } from "@/lib/db";
import { syncMarkets } from "@/lib/market/sync-markets";

syncMarkets()
  .then((r) =>
    console.log(
      `Pary: ${r.markets}, monety: ${r.assets} (z metadanymi CoinGecko: ${r.matched}), wyłączone pary: ${r.deactivated}`,
    ),
  )
  .finally(() => prisma.$disconnect());
