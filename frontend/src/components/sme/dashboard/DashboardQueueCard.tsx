import React, { useState, useMemo } from "react";
import { ArrowRight, Clock3, ChevronsUpDown } from "lucide-react";
import { AssignedReviewQueueItem } from "../../../types/smeDashboard.types";

export interface DashboardQueueCardProps {
  items: AssignedReviewQueueItem[];
  onReview: (item: AssignedReviewQueueItem) => void;
  onViewAll?: () => void;
}

type SortField =
  | "course"
  | "submittedBy"
  | "domain"
  | "waiting"
  | "priority"
  | null;
type SortOrder = "asc" | "desc";

export const DashboardQueueCard: React.FC<DashboardQueueCardProps> = ({
  items = [],
  onReview,
  onViewAll,
}) => {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortField) return items;
    return [...items].sort((a, b) => {
      let valA: any = a[sortField as keyof AssignedReviewQueueItem] || "";
      let valB: any = b[sortField as keyof AssignedReviewQueueItem] || "";

      if (sortField === "priority") {
        const priorityVal = (p: string) =>
          p.toLowerCase() === "high" ? 3 : p.toLowerCase() === "medium" ? 2 : 1;
        valA = priorityVal(valA as string);
        valB = priorityVal(valB as string);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortOrder]);

  const renderHeader = (label: string, field: SortField, alignLeft = true) => (
    <th
      className={`cursor-pointer px-6 py-4 transition-colors hover:bg-[var(--paper-2)] ${
        !alignLeft ? "text-right" : "text-left"
      }`}
      onClick={() => field && handleSort(field)}
    >
      <div
        className={`flex items-center gap-1.5 ${
          !alignLeft ? "justify-end" : ""
        }`}
      >
        {label}
        {field && (
          <ChevronsUpDown
            className={`h-3 w-3 ${
              sortField === field
                ? "text-[var(--ink)]"
                : "text-[var(--ink-faint)]"
            }`}
          />
        )}
      </div>
    </th>
  );

  return (
    <div className="group overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--tn)] hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-8 py-7">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[var(--fs-h3)] font-[var(--fw-bold)] leading-none text-[var(--ink)]"
            style={{
              fontSize: "16px",
            }}>
            Review queue
          </h3>
          <span className="text-[var(--fs-micro)] font-[var(--fw-regular)] text-[var(--ink-mute)]">
            (assigned to me)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="rounded-full border border-[var(--line)] bg-transparent px-3 py-1 text-[11px] font-[var(--fw-medium)] text-[var(--ink-soft)]">
            {items.length} {items.length === 1 ? "course" : "courses"}
          </span>
          <button
            type="button"
            onClick={onViewAll}
            className="group flex items-center gap-1.5 text-[11px] font-[var(--fw-semibold)] uppercase tracking-[0.08em] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)]"
          >
            VIEW ALL
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--paper-2)] text-[10px] font-[var(--fw-medium)] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
              {renderHeader("LEARNING", "course")}
              {renderHeader("SUBMITTED BY", "submittedBy")}
              {renderHeader("SUBJECT", "domain")}
              {renderHeader("WAITING", "waiting")}
              {renderHeader("PRIORITY", "priority")}
              <th className="px-6 py-4 text-left font-[var(--fw-medium)] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
                ACTION
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-[var(--fs-micro)] font-[var(--fw-regular)] text-[var(--ink-mute)]"
                >
                  No courses awaiting review in your queue.
                </td>
              </tr>
            ) : (
              sortedItems.map((item, index) => {
                const priority = (item.priority || "Normal").toLowerCase();
                const high = priority === "high";
                const medium = priority === "medium";

                return (
                  <tr
                    key={item.id}
                    className="group/row transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]"
                  >
                    <td className="px-6 py-5">
                      <div className="truncate text-[var(--fs-label)] font-[var(--fw-medium)] text-[var(--ink)]">
                        {item.course}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="max-w-[180px] truncate text-[var(--fs-label)] font-[var(--fw-medium)] text-[var(--ink-soft)]">
                        {item.submittedBy}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex max-w-[180px] items-center truncate rounded-full border border-[var(--line)] bg-transparent px-3 py-1.5 text-[11px] font-[var(--fw-medium)] text-[var(--ink-soft)]">
                        {item.domain}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[var(--fs-label)] font-[var(--fw-medium)] ${
                          high
                            ? "text-[var(--c-clay)]"
                            : "text-[var(--ink-soft)]"
                        }`}
                      >
                        <Clock3
                          className={`h-3.5 w-3.5 ${
                            high
                              ? "text-[var(--c-clay)]"
                              : "text-[var(--ink-mute)]"
                          }`}
                        />
                        {item.waiting || "1 day"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex min-w-[64px] items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-[var(--fw-medium)] capitalize ${
                          high
                            ? "border-[var(--c-clay)] bg-transparent text-[var(--c-clay)]"
                            : medium
                              ? "border-[var(--c-honey)] bg-transparent text-[var(--c-honey)]"
                              : "border-[var(--line-strong)] bg-transparent text-[var(--ink-soft)]"
                        }`}
                      >
                        {item.priority || "Normal"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => onReview(item)}
                        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-[var(--fs-label)] font-[var(--fw-medium)] transition-all duration-[var(--dur-fast)] ease-[var(--tn)] outline-none active:scale-[0.98] ${
                          index === 0
                            ? "border-[var(--btn)] bg-[var(--btn)] text-[var(--btn-ink)] hover:border-[var(--btn-hover)] hover:bg-[var(--btn-hover)]"
                            : "border-[var(--line)] bg-transparent text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--paper-2)]"
                        }`}
                      >
                        Review
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardQueueCard;