import { prisma } from "../lib/db";

const assets = [{ symbol: "USDT", name: "Tether", coingeckoId: "tether" }];

// Funkcja wypełniająca bazę danymi startowymi.
const main = async () => {
  for (const asset of assets) {
    await prisma.asset.upsert({ where: { symbol: asset.symbol }, update: asset, create: asset });
  }
  console.log(`Seeded ${assets.length} asset(s)`);
};

main().finally(() => prisma.$disconnect());
