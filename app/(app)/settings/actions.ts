"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resetWallet } from "@/lib/trading/wallet";

// Reset portfela do 10 000 USDT. Usuwa salda, transakcje i historię wartości.
export const resetPortfolio = async () => {
  const user = await getCurrentUser();
  await resetWallet(user.id);
  redirect("/dashboard");
};
