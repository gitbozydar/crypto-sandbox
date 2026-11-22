"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { inputClass } from "@/components/ui";
import { QUOTE_ASSETS } from "@/lib/market/binance";
import { marketsUrl, type FilterState } from "./filters";

// Komponent zakładek walut kwotowania i wyszukiwarki par.
export const MarketFilters = ({ state, counts }: { state: FilterState; counts: Record<string, number> }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(state.q);

  const go = (next: Partial<FilterState>) =>
    startTransition(() => router.replace(marketsUrl({ ...state, page: 1, ...next }), { scroll: false }));

  useEffect(() => {
    if (search.trim() === state.q) return;
    const timer = setTimeout(() => go({ q: search.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className={`flex flex-col gap-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap gap-1">
        {QUOTE_ASSETS.map((quote) => (
          <button
            key={quote}
            onClick={() => go({ quote, q: search.trim() })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              quote === state.quote
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {quote} <span className="opacity-60">{counts[quote]}</span>
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Szukaj monety, np. bitcoin lub ETH…"
        aria-label="Szukaj monety"
        className={`${inputClass} w-full sm:max-w-md`}
      />
    </div>
  );
};
