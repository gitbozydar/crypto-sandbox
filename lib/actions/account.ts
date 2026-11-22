"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { resetWallet } from "@/lib/trading/wallet";

// Akcja serwera resetująca portfel do kapitału startowego.
export const resetPortfolio = async () => {
  const user = await getCurrentUser();
  await resetWallet(user.id);
  redirect("/dashboard");
};

// Akcja serwera zmieniająca widoczność w rankingu.
export const setRankingVisibility = async (visible: boolean) => {
  const user = await getCurrentUser();
  await prisma.user.update({ where: { id: user.id }, data: { showInRanking: visible } });
  updateTag("ranking");
};
