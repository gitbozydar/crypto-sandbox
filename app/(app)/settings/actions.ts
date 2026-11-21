"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { resetWallet } from "@/lib/trading/wallet";

// Reset portfela do 10 000 USDT. Usuwa salda, transakcje i historię wartości.
export const resetPortfolio = async () => {
  const user = await getCurrentUser();
  await resetWallet(user.id);
  redirect("/dashboard");
};

// Widoczność w publicznym rankingu ROI.
export const setRankingVisibility = async (visible: boolean) => {
  const user = await getCurrentUser();
  await prisma.user.update({ where: { id: user.id }, data: { showInRanking: visible } });
  updateTag("ranking"); // ranking jest w cache — odśwież go od razu, nie za minutę
};
