import type { ReactNode } from "react";
import { Card } from "./ui";

// Komponent dużego komunikatu na środku strony (404, błąd).
export const PageMessage = ({
  code,
  title,
  text,
  children,
}: {
  code: string;
  title: string;
  text: string;
  children: ReactNode;
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
    <p className="font-mono text-5xl font-semibold text-primary">{code}</p>
    <h1 className="text-2xl font-semibold">{title}</h1>
    <p className="max-w-md text-muted">{text}</p>
    <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>
  </div>
);

// Komponent szarego prostokąta w miejscu ładowanej treści.
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-surface-muted ${className}`} aria-hidden />
);

// Komponent opakowujący szkielet ładowania.
const Loading = ({ children }: { children: ReactNode }) => (
  <div role="status" className="flex flex-col gap-6">
    <span className="sr-only">Ładowanie…</span>
    {children}
  </div>
);

// Szkielet ładowania tabeli.
const TableSkeleton = ({ rows = 8 }: { rows?: number }) => (
  <Card className="flex flex-col gap-3">
    <Skeleton className="h-5 w-40" />
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-9" />
    ))}
  </Card>
);

// Szkielet ładowania strony portfela.
export const DashboardSkeleton = () => (
  <Loading>
    <Skeleton className="h-8 w-56" />
    <div className="grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
    <TableSkeleton rows={5} />
  </Loading>
);

// Szkielet ładowania listy rynku.
export const MarketsSkeleton = () => (
  <Loading>
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 7 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-20" />
      ))}
    </div>
    <Skeleton className="h-10 w-full sm:max-w-md" />
    <TableSkeleton rows={12} />
  </Loading>
);

// Szkielet ładowania strony pary.
export const PairSkeleton = () => (
  <Loading>
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Skeleton className="h-[480px] rounded-2xl" />
      <Skeleton className="h-[480px] rounded-2xl" />
    </div>
  </Loading>
);

// Szkielet ładowania stron z sekcjami.
export const SectionsSkeleton = ({ count = 4 }: { count?: number }) => (
  <Loading>
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-56 rounded-2xl" />
      ))}
    </div>
  </Loading>
);
