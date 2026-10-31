// src/core/api/review-queue/reviewQueue.types.ts

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReviewQueueDto {
  id: string;
  entityType: "CAREER_PATH" | "COURSE" | "LESSON";
  entityId: string;
  submittedById: string;
  reviewerId: string;
  status: ReviewStatus;
  comment?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  submittedBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  resolvedBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

export interface ReviewQueueItem {
  id: string; // Maps to entityId (Course/Lesson/CareerPath ID) for navigation
  reviewId: string; // The unique ID of the ContentReview row
  submittedDate: string;
  timestamp: string;
  submittedBy: string;
  title: string;
  type: "Course" | "Lesson" | "Career Path" | string;
  typeTag?: string;
  lessonsDetail: string;
  waitTime: string;
  approvedDate?: string;
  approvedBy?: string;
  comment?: string;
  duration?: string;
  visibility?: string;
  subject?: string;
  dueDate?: string;
  status?: ReviewStatus;
  rawStatus?: string;
  submittedAt?: string;
  reviewedAt?: string | null;
  reviewerName?: string;
  submitterName?: string;
  rawDto?: ReviewQueueDto;
  thumbnailAssetId?: string;
}

export interface ReviewQueueStatistics {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}


