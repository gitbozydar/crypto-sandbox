const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];
const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad/, "iOS"],
  [/Android/, "Android"],
  [/Mac OS X/, "macOS"],
  [/Windows/, "Windows"],
  [/Linux/, "Linux"],
];

// Funkcja zwracająca nazwę pierwszego pasującego wzorca.
const firstMatch = (userAgent: string, patterns: [RegExp, string][], fallback: string) =>
  patterns.find(([pattern]) => pattern.test(userAgent))?.[1] ?? fallback;

// Funkcja opisująca przeglądarkę i system na podstawie User-Agent.
export const describeDevice = (userAgent?: string | null) =>
  `${firstMatch(userAgent ?? "", BROWSERS, "Przeglądarka")} · ${firstMatch(userAgent ?? "", SYSTEMS, "nieznany system")}`;
