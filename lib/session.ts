import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

// Funkcja zwracająca sesję albo przekierowująca na logowanie.
export const getCurrentSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
};

// Funkcja zwracająca zalogowanego użytkownika.
export const getCurrentUser = async () => {
  const { id, name, email, emailVerified, image, twoFactorEnabled } = (await getCurrentSession()).user;
  return { id, name, email, emailVerified, image: image ?? null, twoFactorEnabled: Boolean(twoFactorEnabled) };
};
