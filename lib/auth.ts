import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { getOrCreateWallet } from "@/lib/trading/wallet";

const APP_NAME = "Crypto Sandbox";
const MAX_AVATAR_LENGTH = 200_000;

export const auth = betterAuth({
  appName: APP_NAME,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) =>
      sendMail({
        to: user.email,
        subject: "Reset hasła — Crypto Sandbox",
        heading: "Reset hasła",
        text: "Kliknij przycisk, aby ustawić nowe hasło. Link jest ważny przez godzinę.",
        button: "Ustaw nowe hasło",
        url,
      }),
    revokeSessionsOnPasswordReset: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) =>
      sendMail({
        to: user.email,
        subject: "Potwierdź adres e-mail — Crypto Sandbox",
        heading: "Potwierdź adres e-mail",
        text: `Cześć ${user.name}! Kliknij przycisk, aby potwierdzić adres ${user.email}.`,
        button: "Potwierdź e-mail",
        url,
      }),
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
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
    changeEmail: { enabled: true, updateEmailWithoutVerification: true },
    deleteUser: { enabled: true },
  },

  plugins: [twoFactor({ issuer: APP_NAME }), nextCookies()],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await getOrCreateWallet(user.id);
        },
      },
      update: {
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
