// Portfel użytkownika: tworzenie i reset do stanu początkowego.
import { prisma } from "@/lib/db";
import { STARTING_BALANCE } from "./constants";

const WALLET_NAME = "Główny";

// Stan początkowy: tylko kapitał startowy w USDT + pierwszy punkt na wykresie wartości.
const startingState = {
  initialBalance: STARTING_BALANCE,
  balances: { create: { assetSymbol: "USDT", amount: STARTING_BALANCE } },
  snapshots: { create: { totalValue: STARTING_BALANCE } },
};

// Domyślny portfel użytkownika. Tworzony przy rejestracji (albo tutaj, gdyby wtedy się nie udało).
export const getOrCreateWallet = (userId: string) =>
  prisma.wallet.upsert({
    where: { userId_name: { userId, name: WALLET_NAME } },
    update: {},
    create: { userId, name: WALLET_NAME, ...startingState },
  });

// „Zacznij od nowa”: usuwa portfel razem z saldami, transakcjami i historią (kaskadowo)
// i zakłada nowy z kapitałem startowym. Jedna transakcja bazodanowa — wszystko albo nic.
export const resetWallet = (userId: string) =>
  prisma.$transaction([
    prisma.wallet.deleteMany({ where: { userId, name: WALLET_NAME } }),
    prisma.wallet.create({ data: { userId, name: WALLET_NAME, ...startingState } }),
  ]);
