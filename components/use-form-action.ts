"use client";

import { useState, useTransition } from "react";

// Hook obsługujący wysyłanie formularza, błąd i stan ładowania.
export const useFormAction = (action: (form: FormData) => Promise<string | null | void>) => {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => setError((await action(form)) ?? null));
  };

  return { onSubmit, error, pending };
};
