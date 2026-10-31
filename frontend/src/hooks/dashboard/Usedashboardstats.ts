// src/hooks/dashboard/useDashboardStats.ts

import { useQueries } from "@tanstack/react-query";

import { getCareerPathsApi } from "../../core/api/career-path/career-path.api";
import { courseApi } from "../../core/api/course/course.api";
import { getLessonsApi } from "../../core/api/lesson/lesson.api";

// ---------------------------------------------------------------------------
// STATUS MAP
// LessonStatus, CourseStatus, and CareerPathStatus all share the same enum
// shape: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, PUBLISHED, REJECTED, ARCHIVED
//
// APPROVED means SME sign-off is done but the SME (not the content developer)
// still has to hit publish — so from the dashboard owner's point of view it's
// still "in SME's hands," and counts toward In SME review.
//
// ARCHIVED is intentionally left unmapped (not counted) — archived items
// shouldn't inflate active-work stats.
// ---------------------------------------------------------------------------
type StatBucket = "draft" | "smeReview" | "published" | "changesRequested";

const STATUS_MAP: Record<string, StatBucket> = {
  DRAFT: "draft",

  SUBMITTED: "smeReview",
  UNDER_REVIEW: "smeReview",
  APPROVED: "smeReview",

  PUBLISHED: "published",

  REJECTED: "changesRequested",

  // ARCHIVED: intentionally omitted — not counted in any bucket
};

export interface DashboardStats {
  draft: number;
  smeReview: number;
  published: number;
  changesRequested: number;
}

interface StatusItem {
  status?: string | null;
  [key: string]: any;
}

function countByBucket(items: StatusItem[]): DashboardStats {
  const counts: DashboardStats = {
    draft: 0,
    smeReview: 0,
    published: 0,
    changesRequested: 0,
  };

  for (const item of items) {
    const bucket = item.status ? STATUS_MAP[item.status] : undefined;
    if (bucket) {
      counts[bucket] += 1;
    }
  }

  return counts;
}

function mergeStats(a: DashboardStats, b: DashboardStats): DashboardStats {
  return {
    draft: a.draft + b.draft,
    smeReview: a.smeReview + b.smeReview,
    published: a.published + b.published,
    changesRequested: a.changesRequested + b.changesRequested,
  };
}

/**
 * Combines career paths + standalone courses + standalone lessons into one
 * set of status counts for the dashboard stat cards.
 *
 * NOTE — pagination: all three underlying endpoints are paginated and
 * validate `limit` server-side (a large limit like 1000 gets rejected with
 * 400). So instead of guessing the max allowed limit, we fetch with a safe
 * page size, read `total` from the first response, then fetch the remaining
 * pages in parallel. This stays correct no matter what the real backend cap
 * is or how large a content developer's catalog grows — up to MAX_PAGES as
 * a hard safety ceiling.
 *
 * Once item counts get large, replace this whole hook with a lightweight
 * backend endpoint doing COUNT(*) ... GROUP BY status in SQL instead —
 * cheaper and doesn't multiply network calls as data grows.
 */
const PAGE_SIZE = 50;
const MAX_PAGES = 20; // safety ceiling: up to 1000 items per source

interface PageResult<T> {
  items: T[];
  total: number;
}

async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PageResult<T>>
): Promise<T[]> {
  const first = await fetchPage(1, PAGE_SIZE);
  const items = [...first.items];

  const totalPages = Math.min(
    Math.ceil(first.total / PAGE_SIZE) || 1,
    MAX_PAGES
  );

  if (totalPages > 1) {
    const remainingPageNumbers = Array.from(
      { length: totalPages - 1 },
      (_, i) => i + 2
    );

    const remainingResults = await Promise.all(
      remainingPageNumbers.map((page) => fetchPage(page, PAGE_SIZE))
    );

    for (const result of remainingResults) {
      items.push(...result.items);
    }
  }

  return items;
}

export function useDashboardStats() {
const results = useQueries({
  queries: [
    {
      queryKey: ["career-paths", "stats"],
      queryFn: async () => {
        const response = await getCareerPathsApi();

        return response.data ?? [];
      },
    },
    {
      queryKey: ["courses", "stats"],
      queryFn: async () => {
        const res = await courseApi.list();

        return res.data.data ?? [];
      },
    },
    {
      queryKey: ["lessons", "stats"],
      queryFn: async () => {
        const response = await getLessonsApi();

        const data = response?.data ?? response ?? [];

        return Array.isArray(data) ? data : [];
      },
    },
  ],
});

  const [careerPathsQuery, coursesQuery, lessonsQuery] = results;

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const error = results.find((r) => r.error)?.error as Error | undefined;

  let stats: DashboardStats | null = null;

  if (!isLoading && !isError) {
    const careerPathStats = countByBucket(
      (careerPathsQuery.data as StatusItem[]) ?? []
    );
    const courseStats = countByBucket(
      (coursesQuery.data as StatusItem[]) ?? []
    );
    const lessonStats = countByBucket(
      (lessonsQuery.data as StatusItem[]) ?? []
    );

    stats = mergeStats(
      mergeStats(careerPathStats, courseStats),
      lessonStats
    );
  }

  return {
    stats,
    isLoading,
    isError,
    error,
  };
}
