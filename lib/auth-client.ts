import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

// Klient używany w komponentach "use client" — wywołuje endpointy /api/auth/*.
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});
