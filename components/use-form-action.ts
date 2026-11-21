"use client";

import { useState, useTransition } from "react";

// Obsługa formularza w jednym miejscu: blokuje przycisk na czas zapytania i pokazuje błąd.
// `action` dostaje dane z formularza i zwraca treść błędu albo null, gdy się udało.
export const useFormAction = (action: (form: FormData) => Promise<string | null | void>) => {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget); // odczyt przed `await` — potem event jest już nieaktualny
    setError(null);
    startTransition(async () => setError((await action(form)) ?? null));
  };

  return { onSubmit, error, pending };
};
