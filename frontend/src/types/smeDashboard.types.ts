// src/types/smeDashboard.types.ts

export interface DashboardStatistic {
  label: string;
  value: string;
  accent?: boolean;
  unit?: string;
}

export interface AssignedReviewQueueItem {
  id: string;
  course: string;
  submittedBy: string;
  domain: string;
  waiting: string;
  priority: "High" | "Medium" | "Normal";
  type: string;
}

export interface RecentlyReviewedItem {
  title: string;
  reviewer: string;
  status: "Approved" | "Rejected";
  time: string;
  dot: "green" | "red";
}