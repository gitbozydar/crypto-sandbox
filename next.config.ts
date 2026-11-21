import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy: skąd przeglądarka może ładować skrypty, obrazki, połączenia itd.
// Blokuje m.in. wstrzyknięte skrypty z obcych domen i osadzanie strony w ramce (clickjacking).
// Bez nonce'ów — przy Cache Components nonce wymusiłby dynamiczne renderowanie każdej strony.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`, // eval tylko w trybie deweloperskim (React)
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://coin-images.coingecko.com https://assets.coingecko.com", // logo monet
  "font-src 'self'",
  "connect-src 'self' wss://stream.binance.com:9443", // ceny na żywo
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" }, // przeglądarka nie zgaduje typu pliku
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // nie wysyłamy pełnych adresów do obcych stron
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }, // nie potrzebujemy tych uprawnień
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }, // tylko HTTPS (działa po wdrożeniu)
];

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  headers: async () => [{ source: "/(.*)", headers: securityHeaders }],
};

export default nextConfig;
