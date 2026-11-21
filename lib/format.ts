// Formatowanie liczb po polsku: spacja między tysiącami, przecinek dziesiętny.

export const formatNumber = (value: number, maxDigits = 8) =>
  value.toLocaleString("pl-PL", { maximumFractionDigits: maxDigits });

// Duże kwoty w skrócie: 1,2 mln, 3,4 mld.
export const formatCompact = (value: number) =>
  value.toLocaleString("pl-PL", { notation: "compact", maximumFractionDigits: 1 });

// Kroki giełdy to potęgi dziesiątki, więc liczba miejsc po przecinku = −log10(krok).
// np. "0.000001" → 6, "0.01" → 2, "1" → 0
export const decimalsFromStep = (step: string) => Math.max(0, -Math.floor(Math.log10(Number(step))));

// Cena z dokładnością danej pary, np. BNB/BTC → 0,009270.
export const formatPriceTick = (value: number, tickSize: string) => {
  const digits = decimalsFromStep(tickSize);
  return value.toLocaleString("pl-PL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

// Kwota w USDT z dwoma miejscami po przecinku, np. 10 234,50.
export const formatUsdt = (value: number) =>
  value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Zysk/strata ze znakiem, np. "+123,45" albo "−67,80" (znak, nie tylko kolor, niesie informację).
export const formatSigned = (value: number, format: (v: number) => string = formatUsdt) =>
  `${value >= 0 ? "+" : "−"}${format(Math.abs(value))}`;

// Data i godzina w czasie polskim, np. "22.11.2026, 02:20" (z sekundami: "22.11.2026, 02:20:15").
// Składamy ją z samych liczb, bo gotowe formaty (dateStyle) różnią się między Node a przeglądarką
// ("…2026 o 02:20" vs "…2026, 02:20") — a różny tekst na serwerze i w przeglądarce psuje hydratację.
const dateParts = new Intl.DateTimeFormat("pl-PL", {
  timeZone: "Europe/Warsaw",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export const formatDateTime = (date: Date | number | string, { seconds = false } = {}) => {
  const parts = Object.fromEntries(dateParts.formatToParts(new Date(date)).map((p) => [p.type, p.value]));
  const time = `${parts.hour}:${parts.minute}${seconds ? `:${parts.second}` : ""}`;
  return `${parts.day}.${parts.month}.${parts.year}, ${time}`;
};

// Liczba do pola formularza: zaokrąglona w dół do `decimals` miejsc, bez zapisu 1e-7 i zbędnych zer.
export const toInputNumber = (value: number, decimals: number) =>
  value > 0 ? (Math.floor(value * 10 ** decimals + 1e-9) / 10 ** decimals).toFixed(decimals).replace(/\.?0+$/, "") : "";
