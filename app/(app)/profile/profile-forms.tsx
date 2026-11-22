"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Button, ErrorMessage, Field, SubmitButton } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { resizeToAvatar } from "@/lib/image";

// Funkcja odczytująca przycięty tekst z pola formularza.
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

// Komponent komunikatu „Zapisano”.
const Saved = ({ show }: { show: boolean }) =>
  show ? (
    <p role="status" className="text-sm text-success">
      ✓ Zapisano
    </p>
  ) : null;

const MAX_FILE_MB = 10;

// Formularz dodawania, zmiany i usuwania zdjęcia profilowego.
export const AvatarForm = ({ name, image }: { name: string; image: string | null }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const save = async (newImage: string | null) => {
    setPending(true);
    setError(null);
    const { error } = await authClient.updateUser({ image: newImage });
    setPending(false);
    if (error) return setError(error.message ?? "Nie udało się zapisać zdjęcia.");
    router.refresh();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Wybierz plik graficzny (JPG, PNG, WebP).");
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setError(`Plik jest za duży (maks. ${MAX_FILE_MB} MB).`);
    try {
      await save(await resizeToAvatar(file));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Avatar name={name} image={image} size={88} />
        <div className="flex flex-wrap gap-2">
          <label
            className={`cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover ${pending ? "pointer-events-none opacity-50" : ""}`}
          >
            {pending ? "Zapisuję…" : image ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} className="sr-only" />
          </label>
          {image && (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => save(null)}>
              Usuń
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted">JPG, PNG lub WebP. Zdjęcie zostanie przycięte do kwadratu.</p>
      <ErrorMessage message={error} />
    </div>
  );
};

// Formularz zmiany imienia i adresu e-mail.
export const ProfileForm = ({
  name,
  email,
  emailVerified,
}: {
  name: string;
  email: string;
  emailVerified: boolean;
}) => {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(null);
  const { onSubmit, error, pending } = useFormAction(async (form) => {
    setSaved(null);
    const newName = text(form, "name");
    const newEmail = text(form, "email").toLowerCase();

    if (newName !== name) {
      const { error } = await authClient.updateUser({ name: newName });
      if (error) return authErrorMessage(error, "Nie udało się zmienić imienia.");
    }
    if (newEmail !== email) {
      const { error } = await authClient.changeEmail({ newEmail, callbackURL: "/profile?notice=email-changed" });
      if (error) return authErrorMessage(error, "Nie udało się zmienić e-maila.");
      if (emailVerified) {
        setSaved(
          `Jeśli adres ${newEmail} jest wolny, wysłaliśmy na niego link — e-mail zmieni się po jego kliknięciu.`,
        );
        return;
      }
    }
    setSaved("✓ Zapisano");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="Imię" name="name" defaultValue={name} required autoComplete="name" />
      <Field label="E-mail" name="email" type="email" defaultValue={email} required autoComplete="email" />
      <ErrorMessage message={error} />
      {saved && (
        <p role="status" className="text-sm text-success">
          {saved}
        </p>
      )}
      <SubmitButton pending={pending}>Zapisz</SubmitButton>
    </form>
  );
};

// Formularz zmiany hasła.
export const PasswordForm = () => {
  const [saved, setSaved] = useState(false);
  const { onSubmit, error, pending } = useFormAction(async (form) => {
    setSaved(false);
    const newPassword = String(form.get("newPassword"));
    if (newPassword !== form.get("confirmPassword")) return "Nowe hasła nie są identyczne.";

    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("currentPassword")),
      newPassword,
      revokeOtherSessions: true,
    });
    if (error)
      return error.status === 400
        ? "Nieprawidłowe obecne hasło."
        : authErrorMessage(error, "Nie udało się zmienić hasła.");
    setSaved(true);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="Obecne hasło" name="currentPassword" type="password" required autoComplete="current-password" />
      <Field label="Nowe hasło" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
      <Field
        label="Powtórz nowe hasło"
        name="confirmPassword"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
      />
      <ErrorMessage message={error} />
      <Saved show={saved} />
      <SubmitButton pending={pending}>Zmień hasło</SubmitButton>
    </form>
  );
};
