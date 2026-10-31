import { api } from "../../../config/axios";
import type { Course } from "../course/course.api";
import type { CourseLesson } from "../course/course-lesson.api";

export interface CommentReply {
  author: string;
  time: string;
  text: string;
}

export interface ReviewComment {
  id: string;
  type: "Required" | "Suggestion" | "Resolved";
  time: string;
  lessonRef: string;
  quote: string;
  author: string;
  authorRole?: string;
  postedAgo: string;
  pinned?: boolean;
  reply?: CommentReply;
}

export interface CourseReviewStatus {
  id: string;
  entityType: string;
  entityId: string;
  submittedById: string;
  reviewerId: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  comment?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface ReviewHistoryItem {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  remarks?: string;
}

export const getCourseReview = async (courseId: string): Promise<CourseReviewStatus | null> => {
  try {
    const res = await api.get(`/reviews/course/${courseId}/history`);
    const reviews = res.data?.data?.reviews || [];
    // Return the latest review status or default to null
    return reviews.length > 0 ? reviews[0] : null;
  } catch (error) {
    console.error("Failed to get course review history:", error);
    return null;
  }
};

export const getCourse = async (courseId: string): Promise<Course> => {
  const res = await api.get(`/courses/${courseId}`);
  return res.data?.data || res.data;
};

export const getCourseLessons = async (courseId: string): Promise<CourseLesson[]> => {
  const res = await api.get(`/courses/${courseId}/lessons`);
  return res.data?.lessons || res.data?.data || [];
};

export const getReviewComments = async (courseId: string): Promise<ReviewComment[]> => {
  try {
    const res = await api.get(`/reviews/course/${courseId}/history`);
    const reviews = res.data?.data?.reviews || [];

    const comments: ReviewComment[] = [];

    // Map each review decision comment to a comment card in the comments pane
    reviews.forEach((item: any, idx: number) => {
      if (item.comment) {
        const dateObj = new Date(item.reviewedAt || item.submittedAt);
        const timestamp = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const actorName = item.reviewer 
          ? `${item.reviewer.firstName || ""} ${item.reviewer.lastName || ""}`.trim()
          : item.submittedBy 
            ? `${item.submittedBy.firstName || ""} ${item.submittedBy.lastName || ""}`.trim()
            : "Reviewer";

        comments.push({
          id: item.id || `hist_${idx}`,
          type: item.status === "APPROVED" ? "Resolved" : item.status === "REJECTED" ? "Required" : "Suggestion",
          time: timestamp,
          lessonRef: "",
          quote: item.comment,
          author: actorName,
          authorRole: item.status === "APPROVED" ? "Approver" : "SME",
          postedAgo: "from history",
          pinned: item.status === "REJECTED",
        });
      }
    });

    return comments;
  } catch (error) {
    console.error("Failed to map review history to comments:", error);
    return [];
  }
};

export const getReviewHistory = async (courseId: string): Promise<ReviewHistoryItem[]> => {
  try {
    const res = await api.get(`/reviews/course/${courseId}/history`);
    const reviews = res.data?.data?.reviews || [];
    
    return reviews.map((item: any) => {
      const dateObj = new Date(item.submittedAt || item.reviewedAt);
      const timestamp = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const actorName = item.reviewer ? `${item.reviewer.firstName || ""} ${item.reviewer.lastName || ""}`.trim() : "SME";
      
      return {
        id: item.id,
        action: item.status === "APPROVED" ? "Approved" : item.status === "REJECTED" ? "Rejected" : "Submitted for review",
        actor: actorName,
        timestamp,
        remarks: item.comment || "",
      };
    });
  } catch (error) {
    console.error("Failed to fetch review history:", error);
    return [];
  }
};

export const approveCourseReview = async (courseId: string, reviewerId: string, comment?: string) => {
  const res = await api.post(`/reviews/course/${courseId}/publish`, {
    publishedById: reviewerId,
    comment,
  });
  return res.data;
};

export const requestCourseChanges = async (courseId: string, reviewerId: string, comment: string) => {
  const res = await api.post(`/reviews/course/${courseId}/reject`, {
    reviewerId,
    comment,
  });
  return res.data;
};

export const submitReviewComment = async (courseId: string, commentData: Partial<ReviewComment>) => {
  // Read-only/No-op as backend doesn't support inline comment endpoints
  console.log("Submit comment (unsupported by backend):", commentData);
  return Promise.resolve({
    id: `temp_${Date.now()}`,
    type: commentData.type || "Suggestion",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    lessonRef: commentData.lessonRef || "",
    quote: commentData.quote || "",
    author: commentData.author || "Reviewer",
    postedAgo: "Just now",
  });
};

export const submitReviewApi = async (
  entityType: string,
  entityId: string,
  payload: {
    submittedById: string;
    reviewerId: string;
    comment?: string;
  }
) => {
  const res = await api.post(`/reviews/${entityType}/${entityId}/submit`, payload);
  return res.data;
};

export const publishEntityApi = async (
  entityType: string,
  entityId: string,
  payload: {
    publishedById: string;
    comment?: string;
  }
) => {
  const res = await api.post(`/reviews/${entityType}/${entityId}/publish`, payload);
  return res.data;
};
