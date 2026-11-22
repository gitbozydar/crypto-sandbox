// Funkcja formatująca liczbę po polsku.
export const formatNumber = (value: number, maxDigits = 8) =>
  value.toLocaleString("pl-PL", { maximumFractionDigits: maxDigits });

// Funkcja formatująca dużą liczbę w skrócie (np. 1,2 mln).
export const formatCompact = (value: number) =>
  value.toLocaleString("pl-PL", { notation: "compact", maximumFractionDigits: 1 });

// Funkcja wyliczająca liczbę miejsc po przecinku z kroku giełdy.
export const decimalsFromStep = (step: string) => Math.max(0, -Math.floor(Math.log10(Number(step))));

// Funkcja formatująca cenę z dokładnością pary.
export const formatPriceTick = (value: number, tickSize: string) => {
  const digits = decimalsFromStep(tickSize);
  return value.toLocaleString("pl-PL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

// Funkcja formatująca kwotę z dwoma miejscami po przecinku.
export const formatUsdt = (value: number) =>
  value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Funkcja formatująca wartość ze znakiem + lub −.
export const formatSigned = (value: number, format: (v: number) => string = formatUsdt) =>
  `${value >= 0 ? "+" : "−"}${format(Math.abs(value))}`;

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

// Funkcja formatująca datę i godzinę w czasie polskim.
export const formatDateTime = (date: Date | number | string, { seconds = false } = {}) => {
  const parts = Object.fromEntries(dateParts.formatToParts(new Date(date)).map((p) => [p.type, p.value]));
  const time = `${parts.hour}:${parts.minute}${seconds ? `:${parts.second}` : ""}`;
  return `${parts.day}.${parts.month}.${parts.year}, ${time}`;
};

// Funkcja zamieniająca liczbę na tekst do pola formularza.
export const toInputNumber = (value: number, decimals: number) =>
  value > 0 ? (Math.floor(value * 10 ** decimals + 1e-9) / 10 ** decimals).toFixed(decimals).replace(/\.?0+$/, "") : "";

// Funkcja zamieniająca tekst z pola formularza na liczbę.
export const parseInputNumber = (text: string) => Number(text.trim().replace(",", "."));
