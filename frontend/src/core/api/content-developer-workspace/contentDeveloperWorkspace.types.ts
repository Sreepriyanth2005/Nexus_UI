export type CourseStatus = "changes" | "review" | "draft" | "published";

export interface WorkspaceCourseDto {
  id: string;
  name: string;
  type: "Career Path" | "Standalone Course" | "Standalone Lesson";
  status: CourseStatus;
  statusLabel: string;
  lastEdited: string;
  action: "view-feedback" | "view" | "edit" | "none";
  thumbnailUrl?: string;
  durationMinutes?: number;
  level?: string;
  authorName?: string;
  enrollmentCount?: number;
  rating?: number;
}

export interface WorkspaceStatisticsDto {
  draft: number;
  smeReview: number;
  published: number;
  changesRequested: number;
}

export interface RecentActivityDto {
  id: string;
  title: string;
  detail: string;
  time: string;
  dotColor: string;
  actionLabel: string;
}

export type WorkspaceActivityDto = RecentActivityDto;
export type WorkspaceViewModel = WorkspaceCourseDto;

export interface WorkspaceDashboardDto {
  courses: WorkspaceCourseDto[];
  recentFeedback?: RecentActivityDto[];
  statistics?: WorkspaceStatisticsDto;
  engagement?: {
    totalEnrollments: number;
    publishedItemsCount: number;
    averageRating: number;
  };
  feedbackInbox?: any[];
  recentActivity?: any[];
  learnerReactions?: any[];
}

/* -------------------------------------------------------------------------- */
/*                           Course Overview Types                            */
/* -------------------------------------------------------------------------- */
export interface CourseMetadata {
  id: string;
  title: string;
  careerPath: string;
  version: string;
  status: "Draft" | "Changes Requested" | "Published" | "Review Pending";
  createdDate: string;
  lastEdited: string;
  domain: string;
}

export interface LessonItem {
  id: string;
  order: string;
  title: string;
  type: "Video" | "PDF" | "Text";
  duration: string;
  hasFeedback: boolean;
  completed: boolean;
}

export interface AssessmentMetadata {
  questions: number;
  passMark: number;
}

export interface SubmissionEvent {
  version: string;
  submittedDate: string;
  statusText: string;
  type: "success" | "pending" | "info";
  label?: string;
  outcome?: string;
  detail?: string;
}

export interface SMEMetadata {
  name: string;
  domain: string;
  turnaround: string;
}

/* -------------------------------------------------------------------------- */
/*                            Course Preview Types                            */
/* -------------------------------------------------------------------------- */
export interface ReviewItem {
  id: string;
  reviewer: string;
  review: string;
  date: string;
}

export interface PreviewCourseMetadata {
  id: string;
  title: string;
  category: string;
  description: string;
  lessonsCount: number;
  durationHours: number;
  level: string;
  certificateName: string;
  enrolledCount: number;
  domain?: string;
  coverImage?: string;
  status?: string;
}

export interface InstructorDetails {
  name: string;
  designation: string;
  avatarInitials: string;
}

export interface CurriculumLesson {
  id: string;
  order: number;
  title: string;
  type?: "Video" | "PDF" | "Text";
  modes?: ("Video" | "PDF" | "Text")[];
  duration: string;
  status: string;
  isFree?: boolean;
  videoUrl?: string;
  fileUrl?: string;
  signedUrl?: string;
  contentAsset?: any;
  transcriptAsset?: any;
  subtitleUrl?: string;
  lessonContents?: any[];
  description?: string;
  shortDescription?: string;
  contentAssetId?: string;
}

export interface FinalAssessmentDetails {
  questions: number;
  passMark: number;
  status: string;
}
