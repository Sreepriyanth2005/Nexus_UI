import type { Key, ReactNode, TableHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export type ColumnAlign = 'left' | 'right' | 'center';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: ColumnAlign;
  render?: (row: T, rowIndex: number) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> extends Omit<TableHTMLAttributes<HTMLTableElement>, 'children'> {
  columns: Column<T>[];
  rows: T[];
  dense?: boolean;
  headFill?: boolean;
  rowKey?: (row: T, index: number) => Key;
}

const ALIGN_TD: Record<ColumnAlign, string | undefined> = {
  left: undefined,
  right: "text-right tabular-nums",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  rows,
  dense = false,
  headFill = false,
  rowKey,
  className,
  ...rest
}: DataTableProps<T>) {
  return (
    <table className={cn("w-full border-collapse font-sans text-[14px] text-left", className)} {...rest}>
      <thead className={cn(headFill && "bg-paper-2")}>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={cn("px-6 py-4 text-[12px] font-semibold text-ink-mute text-center border-b border-line whitespace-nowrap", dense && "px-3 py-2.5", headFill && "border-b-0")}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowKey ? rowKey(row, rowIndex) : rowIndex} className="hover:bg-paper-2 transition-colors">
            {columns.map((col) => (
              <td key={col.key} className={cn("px-6 pt-6 pb-[22px] border-b border-line text-ink align-middle text-left", dense && "px-3 py-2.5", col.align && ALIGN_TD[col.align], col.className)}>
                {col.render
                  ? col.render(row, rowIndex)
                  : ((row as Record<string, unknown>)[col.key] as ReactNode)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}