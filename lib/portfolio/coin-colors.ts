// Kolory monet na wykresach. Bierzemy je ze sprawdzonej palety (--chart-1…8 w app/globals.css),
// a znanym monetom przypisujemy odcień najbliższy ich marce (BTC pomarańczowy, ETH niebieski…).
// Oryginalne kolory marek nie nadają się wprost: BTC, BNB i DOGE są prawie identyczne.

const SLOTS = ["blue", "orange", "aqua", "yellow", "magenta", "green", "violet", "red"] as const;
type Slot = (typeof SLOTS)[number];

const BRAND: Record<string, Slot> = {
  BTC: "orange",
  ETH: "blue",
  USDT: "aqua",
  BNB: "yellow",
  SOL: "violet",
  XRP: "magenta",
  USDC: "blue",
  DOGE: "yellow",
  ADA: "blue",
  TRX: "red",
  AVAX: "red",
  DOT: "magenta",
  LINK: "blue",
  SHIB: "orange",
  PEPE: "green",
  TON: "blue",
  LTC: "violet",
};

const cssVar = (slot: Slot) => `var(--chart-${SLOTS.indexOf(slot) + 1})`;
export const OTHER_COLOR = "var(--chart-other)";

// Każda moneta dostaje inny kolor: najpierw kolor marki (jeśli wolny), potem kolejne wolne.
export const assignCoinColors = (symbols: string[]) => {
  const colors = new Map<string, string>();
  const used = new Set<Slot>();
  const take = (symbol: string, slot: Slot) => {
    colors.set(symbol, cssVar(slot));
    used.add(slot);
  };

  for (const s of symbols) {
    const preferred = BRAND[s];
    if (preferred && !used.has(preferred)) take(s, preferred);
  }
  for (const s of symbols) {
    const free = SLOTS.find((slot) => !used.has(slot));
    if (!colors.has(s)) take(s, free ?? "blue");
  }
  return colors;
};
