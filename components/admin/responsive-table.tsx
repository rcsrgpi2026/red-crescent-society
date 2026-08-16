import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  /** Optional renderer for the mobile card; defaults to `render`. */
  mobileRender?: (row: T) => React.ReactNode;
  className?: string;
  /** Hide this column from the mobile card (e.g. interactive controls that only work on desktop). */
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyFor: (row: T) => string;
  /** Optional card title block above the table. */
  title?: string;
  description?: string;
  /** Actions rendered as the last desktop column and on the mobile card. */
  actions?: (row: T) => React.ReactNode;
  actionsHeader?: string;
  /** Rendered instead of the table when there are no rows. */
  empty?: React.ReactNode;
  /** Min-width (px) for the desktop table so it keeps readable columns. */
  minWidth?: string;
  /** Columns in the mobile card field grid — 1 stacks each field full-width. */
  mobileCardColumns?: 1 | 2;
  className?: string;
}

export function ResponsiveTable<T>({
  columns,
  rows,
  keyFor,
  title,
  description,
  actions,
  actionsHeader,
  empty,
  minWidth = "min-w-[640px]",
  mobileCardColumns = 2,
  className,
}: ResponsiveTableProps<T>) {
  const cardColumns = columns.filter((c) => !c.hideOnMobile);

  return (
    <Reveal className={className}>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-black/[0.02]">
        {(title || description) && (
          <div className="border-b border-line bg-gradient-to-r from-mist/80 to-transparent px-5 py-4">
            {title && <h2 className="font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {rows.length === 0 && empty ? (
          empty
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className={minWidth}>
                <TableHeader>
                  <TableRow className="bg-mist/60">
                    {columns.map((col) => (
                      <TableHead key={col.header} className={col.className}>
                        {col.header}
                      </TableHead>
                    ))}
                    {actions && (
                      <TableHead className="text-right">
                        {actionsHeader ?? "Actions"}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={keyFor(row)}>
                      {columns.map((col) => (
                        <TableCell key={col.header} className={col.className}>
                          {col.render(row)}
                        </TableCell>
                      ))}
                      {actions && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {actions(row)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((row) => {
                const titleCol = cardColumns[0];
                return (
                  <li key={keyFor(row)} className="p-4">
                    {titleCol && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">{titleCol.render(row)}</div>
                        {actions && (
                          <div className="flex shrink-0 items-center gap-1.5">
                            {actions(row)}
                          </div>
                        )}
                      </div>
                    )}
                    {cardColumns.length > 1 && (
                      <dl
                        className={cn(
                          "mt-3 grid gap-x-4 gap-y-2.5",
                          mobileCardColumns === 1
                            ? "grid-cols-1 sm:grid-cols-2"
                            : "grid-cols-2 [&:nth-last-child(-n+2):only-child]:col-span-2"
                        )}
                      >
                        {cardColumns.slice(1).map((col) => (
                          <div key={col.header} className="min-w-0">
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              {col.header}
                            </dt>
                            <dd className="mt-0.5 break-words text-sm text-foreground">
                              {col.mobileRender ? col.mobileRender(row) : col.render(row)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Reveal>
  );
}
