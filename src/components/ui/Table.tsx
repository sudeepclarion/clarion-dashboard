import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  className?: string;
}

/**
 * The dense table used across the product. Deliberately simple — sorting and
 * filtering happen upstream in the page, so the table only renders.
 */
export const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
}: DataTableProps<T>) => {
  if (!rows.length && empty) return <>{empty}</>;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[40rem] border-collapse text-xs">
        <thead>
          <tr className="border-b border-hairline">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-faint",
                  column.headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-hairline/50 transition-colors last:border-0",
                onRowClick && "cursor-pointer hover:bg-surface-raised/70"
              )}
            >
              {columns.map((column) => (
                <td key={column.key} className={cn("px-3 py-2.5 align-middle text-ink-muted", column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
