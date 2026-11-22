import { Suspense, type ReactNode } from "react";

// Komponent strony z nagłówkiem i treścią ładowaną w Suspense.
export const Page = ({
  title,
  description,
  fallback,
  children,
}: {
  title?: string;
  description?: string;
  fallback: ReactNode;
  children: ReactNode;
}) => (
  <>
    {title && (
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
    )}
    <Suspense fallback={fallback}>{children}</Suspense>
  </>
);
