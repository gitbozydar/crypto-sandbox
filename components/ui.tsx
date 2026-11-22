import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { formatSigned, formatUsdt } from "@/lib/format";
import { marketHref } from "@/lib/market/markets-shared";

// Funkcja łącząca klasy CSS (pomija puste).
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

const buttonVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-glow",
  outline: "border border-border-strong text-foreground hover:bg-surface-muted",
};
const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

type ButtonStyle = { variant?: keyof typeof buttonVariants; size?: keyof typeof buttonSizes };

// Funkcja zwracająca klasy przycisku dla wariantu i rozmiaru.
const buttonClass = ({ variant = "primary", size = "md" }: ButtonStyle = {}) => {
  return cx(
    "inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
  );
};

// Komponent przycisku.
export const Button = ({ variant, size, className, ...props }: ButtonStyle & ComponentProps<"button">) => (
  <button {...props} className={cx(buttonClass({ variant, size }), className)} />
);

// Komponent linku wyglądającego jak przycisk.
export const ButtonLink = ({ variant, size, className, ...props }: ButtonStyle & ComponentProps<typeof Link>) => (
  <Link {...props} className={cx(buttonClass({ variant, size }), className)} />
);

// Przycisk wysyłania formularza z blokadą na czas zapytania.
export const SubmitButton = ({ pending, children }: { pending: boolean; children: ReactNode }) => (
  <Button type="submit" disabled={pending} className="mt-2">
    {pending ? "Proszę czekać…" : children}
  </Button>
);

export const inputClass =
  "rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25";

// Komponent pola formularza z etykietą.
export const Field = ({ label, ...props }: { label: string } & ComponentProps<"input">) => (
  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
    {label}
    <input {...props} className={cx(inputClass, "font-normal")} />
  </label>
);

// Komponent komunikatu błędu.
export const ErrorMessage = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
};

// Komponent karty.
export const Card = ({ className, ...props }: ComponentProps<"section">) => (
  <section {...props} className={cx("rounded-2xl border border-border bg-surface p-6", className)} />
);

// Komponent etykiety statusu.
export const Badge = ({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "primary" | "danger";
  children: ReactNode;
}) => {
  const tones = {
    neutral: "bg-surface-muted text-muted",
    success: "bg-success-soft text-success",
    primary: "bg-primary-soft text-primary",
    danger: "bg-danger-soft text-danger",
  };
  return <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
};

// Komponent zmiany procentowej ze znakiem i kolorem.
export const PercentChange = ({ value, className }: { value: number | null | undefined; className?: string }) =>
  value == null || Number.isNaN(value) ? (
    <span className={cx("text-muted", className)}>—</span>
  ) : (
    <Signed value={value} format={(v) => v.toFixed(2)} suffix="%" className={cx("tabular-nums", className)} />
  );

// Komponent logo monety albo inicjałów symbolu.
export const CoinIcon = ({ src, symbol, size = 24 }: { src: string | null; symbol: string; size?: number }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className="rounded-full" loading="lazy" />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold text-muted"
    >
      {symbol.slice(0, 2)}
    </span>
  );

// Komponent awatara: zdjęcie albo inicjały.
export const Avatar = ({ name, image, size = 32 }: { name: string; image?: string | null; size?: number }) => {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- zdjęcie to data URL z bazy, next/image nic tu nie zoptymalizuje
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary"
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
};

// Komponent sekcji z tytułem i opisem.
export const Section = ({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}) => (
  <Card className={cx("flex flex-col gap-4", danger && "border-danger/40")}>
    <div>
      <h2 className={cx("text-lg font-semibold", danger && "text-danger")}>{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
    {children}
  </Card>
);

// Komponent linku w tekście.
export const TextLink = ({ className, ...props }: ComponentProps<typeof Link>) => (
  <Link
    {...props}
    className={cx(
      "font-medium text-foreground underline decoration-primary decoration-2 underline-offset-2",
      className,
    )}
  />
);

// Komponent linku do strony pary.
export const PairLink = ({ base, quote }: { base: string; quote: string }) => (
  <Link href={marketHref({ base, quote })} className="font-medium hover:text-primary">
    {base}
    <span className="text-muted">/{quote}</span>
  </Link>
);

// Komponent wartości ze znakiem w kolorze zysku lub straty.
export const Signed = ({
  value,
  format = formatUsdt,
  suffix = "",
  className,
}: {
  value: number;
  format?: (v: number) => string;
  suffix?: string;
  className?: string;
}) => (
  <span className={cx(value >= 0 ? "text-success" : "text-danger", className)}>
    {formatSigned(value, format)}
    {suffix}
  </span>
);
