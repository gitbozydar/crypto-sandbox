import { prisma } from "../lib/db";

// Seed zawiera tylko USDT — walutę kapitału startowego; bez niej nie da się założyć portfela.
// Pozostałe monety i pary dodaje synchronizacja: npm run sync:markets
const assets = [
  { symbol: "USDT", name: "Tether", coingeckoId: "tether" },
];

const main = async () => {
  for (const asset of assets) {
    await prisma.asset.upsert({ where: { symbol: asset.symbol }, update: asset, create: asset });
  }
  console.log(`Seeded ${assets.length} asset(s)`);
};

main().finally(() => prisma.$disconnect());
