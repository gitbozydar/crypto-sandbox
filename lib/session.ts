import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

// Data Access Layer: jedyne miejsce, w którym serwer odczytuje sesję.
// Sprawdza sesję w bazie (a nie tylko to, czy jest ciasteczko). Bez sesji → /login.
export const getCurrentSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
};

export const getCurrentUser = async () => {
  const { id, name, email, emailVerified, image, twoFactorEnabled } = (await getCurrentSession()).user;
  return { id, name, email, emailVerified, image: image ?? null, twoFactorEnabled: Boolean(twoFactorEnabled) };
};
