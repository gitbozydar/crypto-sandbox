import { prisma } from "@/lib/db";
import { Prisma } from "@/src/generated/prisma/client";
import { STARTING_BALANCE } from "./constants";

const WALLET_NAME = "Główny";

const startingState = {
  initialBalance: STARTING_BALANCE,
  balances: { create: { assetSymbol: "USDT", amount: STARTING_BALANCE } },
  snapshots: { create: { totalValue: STARTING_BALANCE } },
};

// Funkcja zwracająca portfel użytkownika albo tworząca nowy.
export const getOrCreateWallet = (userId: string) =>
  prisma.wallet.upsert({
    where: { userId_name: { userId, name: WALLET_NAME } },
    update: {},
    create: { userId, name: WALLET_NAME, ...startingState },
  });

// Funkcja resetująca portfel do kapitału startowego.
export const resetWallet = (userId: string) =>
  prisma.$transaction([
    prisma.wallet.deleteMany({ where: { userId, name: WALLET_NAME } }),
    prisma.wallet.create({ data: { userId, name: WALLET_NAME, ...startingState } }),
  ]);

// Funkcja zwracająca saldo jednej monety.
export const balanceOf = async (walletId: string, asset: string) => {
  const row = await prisma.balance.findUnique({ where: { walletId_assetSymbol: { walletId, assetSymbol: asset } } });
  return row?.amount ?? new Prisma.Decimal(0);
};
