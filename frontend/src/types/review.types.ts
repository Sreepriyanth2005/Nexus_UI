// src/api/review/review.types.ts

/* -------------------------------------------------------------------------- */
/*                                 ENUMS                                      */
/* -------------------------------------------------------------------------- */

export type ReviewEntityType =
    | "CAREER_PATH"
    | "COURSE"
    | "LESSON"
    | "QUIZ";

export type ReviewStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "CHANGES_REQUESTED"
    | "APPROVED"
    | "REJECTED"
    | "PUBLISHED";

export type ReviewPriority =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

export type ReviewDecision =
    | "APPROVED"
    | "REJECTED"
    | "REQUEST_CHANGES";

export type FeedbackType =
    | "REQUIRED"
    | "SUGGESTION"
    | "INFO";

/* -------------------------------------------------------------------------- */
/*                               REVIEW                                        */
/* -------------------------------------------------------------------------- */

export interface Review {
    id: string;
    entityType: ReviewEntityType;
    entityId: string;
    title: string;
    description?: string;
    status: ReviewStatus;
    priority: ReviewPriority;
    reviewerId?: string;
    reviewerName?: string;
    submittedById: string;
    submittedByName: string;
    publishedById?: string;
    publishedByName?: string;
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    reviewedAt?: string;
    approvedAt?: string;
    publishedAt?: string;

}

/* -------------------------------------------------------------------------- */
/*                               COMMENT                                       */
/* -------------------------------------------------------------------------- */

export interface ReviewComment {
    id: string;
    reviewId: string;
    authorId: string;
    authorName: string;
    message: string;
    createdAt: string;
    updatedAt?: string;

}

/* -------------------------------------------------------------------------- */
/*                                REPLY                                        */
/* -------------------------------------------------------------------------- */

export interface ReviewReply {
    id: string;
    commentId: string;
    authorId: string;
    authorName: string;
    message: string;
    createdAt: string;

}

/* -------------------------------------------------------------------------- */
/*                               FEEDBACK                                      */
/* -------------------------------------------------------------------------- */

export interface ReviewFeedback {
    id: string;
    reviewId: string;
    type: FeedbackType;
    message: string;
    resolved: boolean;
    authorId: string;
    authorName: string;
    createdAt: string;
    resolvedAt?: string;

}

/* -------------------------------------------------------------------------- */
/*                               WORKFLOW                                      */
/* -------------------------------------------------------------------------- */

export interface ReviewWorkflow {

    id: string;
    reviewId: string;
    action: string;
    fromStatus: ReviewStatus;
    toStatus: ReviewStatus;
    actorId: string;
    actorName: string;
    remarks?: string;
    createdAt: string;

}

/* -------------------------------------------------------------------------- */
/*                             ASSIGNMENT                                      */
/* -------------------------------------------------------------------------- */

export interface ReviewAssignment {
    id: string;
    reviewId: string;
    reviewerId: string;
    reviewerName: string;
    assignedById: string;
    assignedByName: string;
    assignedAt: string;

}

/* -------------------------------------------------------------------------- */
/*                              DASHBOARD                                      */
/* -------------------------------------------------------------------------- */

export interface ReviewDashboard {
    totalReviews: number;
    pendingReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
    publishedReviews: number;
    changesRequested: number;

}

/* -------------------------------------------------------------------------- */
/*                              STATISTICS                                     */
/* -------------------------------------------------------------------------- */

export interface ReviewStatistics {
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    published: number;
    changesRequested: number;

}

/* -------------------------------------------------------------------------- */
/*                                FILTER                                       */
/* -------------------------------------------------------------------------- */

export interface ReviewFilter {
    search?: string;
    status?: ReviewStatus;
    entityType?: ReviewEntityType;
    reviewerId?: string;
    submittedById?: string;
    priority?: ReviewPriority;
    page?: number;
    limit?: number;

}

/* -------------------------------------------------------------------------- */
/*                              PAGINATION                                     */
/* -------------------------------------------------------------------------- */

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;

}

/* -------------------------------------------------------------------------- */
/*                             API RESPONSE                                    */
/* -------------------------------------------------------------------------- */

export interface ReviewListResponse {
    items: Review[];
    pagination: PaginationMeta;

}

/* -------------------------------------------------------------------------- */
/*                              REQUEST DTOs                                   */
/* -------------------------------------------------------------------------- */

export interface CreateReviewDto {
    entityType: ReviewEntityType;
    entityId: string;
    title: string;
    description?: string;
    priority?: ReviewPriority;
    reviewerId?: string;

}

export interface UpdateReviewDto {
    title?: string;
    description?: string;
    priority?: ReviewPriority;
    reviewerId?: string;

}

export interface SubmitReviewDto {
    comment?: string;

}

export interface ApproveReviewDto {
    comment?: string;
    publishedById?: string;
    reviewerId?: string;
}

export interface RejectReviewDto {
    comment?: string;
    reviewerId?: string;
    items?: {
        issueDescription: string;
        elementId?: string;
    }[];
}

export interface ResolveReviewDto {
    resolvedById?: string;
    items: {
        itemId: string;
        developerReply?: string;
    }[];
}

export interface RequestChangesDto {
    comment?: string;
    reviewerId?: string;
    items?: {
        issueDescription: string;
        elementId?: string;
    }[];
}

export interface PublishReviewDto {
    remarks?: string;
    publishedById: string;
}

/* -------------------------------------------------------------------------- */
/*                             COMMENT DTOs                                    */
/* -------------------------------------------------------------------------- */

export interface CreateCommentDto {
    message: string;

}

export interface UpdateCommentDto {
    message: string;

}

export interface ReplyCommentDto {
    message: string;

}

/* -------------------------------------------------------------------------- */
/*                             FEEDBACK DTOs                                   */
/* -------------------------------------------------------------------------- */

export interface CreateFeedbackDto {
    type: FeedbackType;
    message: string;

}

export interface UpdateFeedbackDto {
    type?: FeedbackType;
    message?: string;

}

export interface ResolveFeedbackDto {
    resolved: boolean;

}

/* -------------------------------------------------------------------------- */
/*                             ASSIGN REVIEWER                                 */
/* -------------------------------------------------------------------------- */

export interface AssignReviewerDto {
    reviewerId: string;

}

/* -------------------------------------------------------------------------- */
/*                               QUERY PARAMS                                  */
/* -------------------------------------------------------------------------- */

export interface ReviewQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: ReviewStatus;
    entityType?: ReviewEntityType;
    reviewerId?: string;
    submittedById?: string;
    priority?: ReviewPriority;

}


