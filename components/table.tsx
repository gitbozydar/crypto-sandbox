import type { ReactNode } from "react";
import { Card, cx } from "./ui";

// Komponent tabeli z nagłówkiem i przewijaniem w poziomie.
export const Table = ({
  head,
  minWidth = 640,
  children,
}: {
  head: ReactNode;
  minWidth?: number;
  children: ReactNode;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm" style={{ minWidth }}>
      <thead>
        <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted">{head}</tr>
      </thead>
      <tbody className="divide-y divide-border">{children}</tbody>
    </table>
  </div>
);

type CellProps = { right?: boolean; className?: string; children?: ReactNode };
const edge = "px-3 first:pl-6 last:pr-6";

// Komórka nagłówka tabeli.
export const Th = ({ right, className, children }: CellProps) => (
  <th className={cx(edge, "py-2 font-medium", right && "text-right", className)}>{children}</th>
);

// Komórka tabeli.
export const Td = ({ right, className, children }: CellProps) => (
  <td className={cx(edge, "py-2.5", right && "text-right tabular-nums", className)}>{children}</td>
);

// Komponent karty z tytułem i tabelą albo komunikatem o braku danych.
export const TableCard = ({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: string | false;
  children: ReactNode;
}) => (
  <Card className="p-0">
    <h2 className="px-6 pt-5 pb-3 text-lg font-semibold">{title}</h2>
    {empty ? <p className="px-6 pb-6 text-sm text-muted">{empty}</p> : children}
  </Card>
);
