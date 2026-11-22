"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/toast";

const NOTICES: Record<string, { title: string; text: string }> = {
  "email-verified": { title: "Konto aktywowane", text: "Adres e-mail został potwierdzony. Miłego handlowania!" },
  "email-changed": { title: "E-mail zmieniony", text: "Nowy adres e-mail jest już aktywny." },
};

const LINK_ERROR = {
  tone: "error",
  title: "Link nie zadziałał",
  text: "Wygasł albo był już użyty. Poproś o nowy link.",
} as const;

// Funkcja odczytująca z adresu, jakie powiadomienie pokazać.
const readNotice = (params: URLSearchParams) => {
  const notice = NOTICES[params.get("notice") ?? ""];
  if (!notice) return null;
  return params.get("error") ? LINK_ERROR : { tone: "success" as const, ...notice };
};

// Komponent pokazujący powiadomienie po powrocie z linku w mailu.
export const UrlNotice = () => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  useEffect(() => {
    const message = readNotice(params);
    if (!message) return;
    toast(message);
    router.replace(pathname, { scroll: false });
  }, [params, toast, router, pathname]);

  return null;
};
