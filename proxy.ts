import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/markets", "/orders", "/ranking", "/profile", "/settings"];
const GUEST_ONLY = ["/login", "/register"];

// Funkcja przekierowująca niezalogowanych z chronionych stron.
export const proxy = (request: NextRequest) => {
  const loggedIn = Boolean(getSessionCookie(request));
  const { pathname } = request.nextUrl;
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (!loggedIn && PROTECTED.some((p) => pathname.startsWith(p))) return redirectTo("/login");
  if (loggedIn && GUEST_ONLY.includes(pathname)) return redirectTo("/dashboard");
  return NextResponse.next();
};

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/markets/:path*",
    "/orders/:path*",
    "/ranking/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
