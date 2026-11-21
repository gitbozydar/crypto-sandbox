import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Wszystkie endpointy Better Auth: /api/auth/sign-up/email, /api/auth/sign-in/email,
// /api/auth/two-factor/*, /api/auth/get-session, /api/auth/sign-out itd.
export const { GET, POST } = toNextJsHandler(auth);
