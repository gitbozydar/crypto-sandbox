import { ButtonLink } from "@/components/ui";
import { marketsUrl, type FilterState } from "./filters";

// Komponent przycisków przechodzenia między stronami listy.
export const Pagination = ({ state, pages, total }: { state: FilterState; pages: number; total: number }) => {
  const { page } = state;
  const link = (to: number, label: string) => (
    <ButtonLink href={marketsUrl({ ...state, page: to })} variant="outline" size="sm" scroll={false}>
      {label}
    </ButtonLink>
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <span>{pages > 1 ? `Strona ${page} z ${pages} · ${total} par` : `${total} par`}</span>
      <div className="flex gap-2">
        {page > 1 && link(page - 1, "← Poprzednia")}
        {page < pages && link(page + 1, "Następna →")}
      </div>
    </div>
  );
};
