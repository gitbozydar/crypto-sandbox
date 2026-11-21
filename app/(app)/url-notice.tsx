"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/toast";

// Powiadomienia po powrocie z linku w mailu. Link prowadzi np. na /dashboard?notice=email-verified,
// a gdy był zły lub wygasły, Better Auth dokleja jeszcze &error=TOKEN_EXPIRED.
const NOTICES: Record<string, { title: string; text: string }> = {
  "email-verified": { title: "Konto aktywowane", text: "Adres e-mail został potwierdzony. Miłego handlowania!" },
  "email-changed": { title: "E-mail zmieniony", text: "Nowy adres e-mail jest już aktywny." },
};

const readNotice = (params: URLSearchParams) => {
  const notice = NOTICES[params.get("notice") ?? ""];
  if (!notice) return null;
  if (params.get("error")) return { tone: "error" as const, title: "Link nie zadziałał", text: "Wygasł albo był już użyty. Poproś o nowy link." };
  return { tone: "success" as const, ...notice };
};

export const UrlNotice = () => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  useEffect(() => {
    const message = readNotice(params);
    if (!message) return;
    toast(message);
    // Usuwamy ?notice=… z adresu, żeby odświeżenie strony nie pokazało powiadomienia drugi raz.
    router.replace(pathname, { scroll: false });
  }, [params, toast, router, pathname]);

  return null;
};
