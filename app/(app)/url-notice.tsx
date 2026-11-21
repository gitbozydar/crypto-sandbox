"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Toast } from "@/components/toast";

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
  // Treść czytamy raz, przy pierwszym renderze — zaraz potem adres jest czyszczony.
  const [message] = useState(() => readNotice(params));
  const [visible, setVisible] = useState(message !== null);
  const close = useCallback(() => setVisible(false), []);

  // Usuwamy ?notice=… z paska adresu, żeby odświeżenie strony nie pokazało powiadomienia drugi raz.
  useEffect(() => {
    if (message) router.replace(pathname, { scroll: false });
  }, [message, router, pathname]);

  if (!message || !visible) return null;
  return <Toast tone={message.tone} title={message.title} text={message.text} onClose={close} />;
};
