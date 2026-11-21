import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { getOrCreateWallet } from "@/lib/trading/wallet";

const APP_NAME = "Crypto Sandbox";
const MAX_AVATAR_LENGTH = 200_000; // ~150 KB po zakodowaniu base64 (zdjęcie 256×256 ma ok. 20–40 KB)

export const auth = betterAuth({
  appName: APP_NAME,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // „Nie pamiętasz hasła?” — link ważny 1 h. Po zmianie hasła wylogowujemy wszystkie urządzenia.
    sendResetPassword: async ({ user, url }) =>
      sendMail({ to: user.email, subject: "Reset hasła", url }),
    revokeSessionsOnPasswordReset: true,
  },

  // Potwierdzenie adresu e-mail: link wysyłany po rejestracji. Bez potwierdzenia można korzystać
  // z aplikacji, ale widać przypomnienie. Kliknięcie linku od razu loguje.
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) =>
      sendMail({ to: user.email, subject: "Potwierdź adres e-mail", url }),
  },

  // Limit prób: chroni przed zgadywaniem haseł i kodów 2FA oraz przed zalewaniem maili.
  // Domyślnie Better Auth włącza go tylko na produkcji; liczniki trzymamy w bazie (tabela RateLimit),
  // bo w pamięci każda instancja serwera liczyłaby osobno.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60, // sekundy
    max: 100, // ogólny limit na ścieżkę w oknie
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/two-factor/verify-totp": { window: 60, max: 5 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
      "/change-password": { window: 60, max: 5 },
      "/delete-user": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/send-verification-email": { window: 300, max: 3 },
    },
  },

  user: {
    // Zmiana e-maila: niepotwierdzony adres zmienia się od razu (i idzie link na nowy),
    // potwierdzony — dopiero po kliknięciu linku wysłanego na nowy adres.
    changeEmail: { enabled: true, updateEmailWithoutVerification: true },
    // Usunięcie konta (potwierdzone hasłem). Portfel i transakcje usuwa baza kaskadowo.
    deleteUser: { enabled: true },
  },

  plugins: [
    // TOTP (Google Authenticator, Authy itp.) + kody zapasowe.
    // `issuer` to nazwa, którą aplikacja uwierzytelniająca pokaże przy kodzie.
    twoFactor({ issuer: APP_NAME }),
    // Pozwala ustawiać ciasteczka sesji z Server Actions. Musi być ostatni.
    nextCookies(),
  ],

  databaseHooks: {
    user: {
      create: {
        // Po rejestracji zakładamy domyślny portfel z kapitałem startowym.
        after: async (user) => {
          await getOrCreateWallet(user.id);
        },
      },
      update: {
        // Zdjęcie profilowe trzymamy w bazie jako mały obrazek (data URL), zmniejszony w przeglądarce.
        // Serwer i tak pilnuje formatu i rozmiaru — API można wywołać z pominięciem formularza.
        before: async (data) => {
          const image = data.image;
          if (typeof image !== "string") return;
          if (!/^data:image\/(png|jpeg|webp);base64,/.test(image) || image.length > MAX_AVATAR_LENGTH) {
            throw new APIError("BAD_REQUEST", { message: "Nieprawidłowe zdjęcie profilowe." });
          }
        },
      },
    },
  },
});

