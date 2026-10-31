// ---------------------------------------------------------------------------
// Admin Courses — API types
// Maps to backend GET /courses (paginated), GET /courses/all, GET /courses/:id
// ---------------------------------------------------------------------------

// Enum-like string unions mirroring Prisma enums on the backend
export type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type PriceTier = "FREE" | "PAID" | "PREMIUM";
export type CourseVisibility = "PUBLIC_CATALOG" | "TENANT_ONLY";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "APPROVED" | "SUBMITTED" | "REJECTED";

// ---------------------------------------------------------------------------
// Nested relation shapes (returned by courseInclude in the repository)
// ---------------------------------------------------------------------------

export interface CourseOwner {
  id: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface CourseCategory {
  id: string;
  name: string;
}

export interface CourseTenant {
  id: string;
  name: string;
}

export interface CourseTagJoin {
  tag: {
    id: string;
    name: string;
  };
}

export interface CourseSkillJoin {
  skill: {
    id: string;
    name: string;
  };
}

export interface CourseSubjectJoin {
  subject: {
    id: string;
    name: string;
  };
}

export interface CourseLessonJoin {
  sequenceOrder: number;
  lesson: {
    id: string;
    title: string;
    lessonType: string;
    status: string;
  };
}

export interface CourseAsset {
  id: string;
  url?: string;
  fileName?: string;
}

// ---------------------------------------------------------------------------
// Main Course DTO — the full shape returned by the backend
// ---------------------------------------------------------------------------

export interface AdminCourseDto {
  id: string;
  ownerId: string;
  tenantId: string | null;
  categoryId: string;
  subcategoryId: string | null;
  title: string;
  tagline: string | null;
  subtitle: string | null;
  fullDescription: string;
  shortDescription: string | null;
  language: string;
  difficulty: DifficultyLevel;
  priceTier: PriceTier;
  visibility: CourseVisibility;
  status: CourseStatus;
  isStandalone: boolean;
  assessmentRequired: boolean;
  certificatePolicyId: string | null;
  videoThreshold: number;
  isFeatured: boolean;
  isTrending: boolean;
  isNewRelease: boolean;
  thumbnailAssetId: string | null;
  previewAssetId: string | null;
  shareToken: string | null;
  slug: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;

  // Relations (populated via courseInclude)
  owner?: CourseOwner;
  category?: CourseCategory;
  subcategory?: CourseCategory | null;
  tenant?: CourseTenant | null;
  thumbnailAsset?: CourseAsset | null;
  previewAsset?: CourseAsset | null;
  tags?: CourseTagJoin[];
  skills?: CourseSkillJoin[];
  subjects?: CourseSubjectJoin[];
  courseLessons?: CourseLessonJoin[];
}

// ---------------------------------------------------------------------------
// Response wrappers
// ---------------------------------------------------------------------------

export interface AdminCourseListResponse {
  success: boolean;
  data: AdminCourseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminCourseDetailResponse {
  success: boolean;
  data: AdminCourseDto;
}

export interface AdminCourseAllResponse {
  success: boolean;
  data: AdminCourseDto[];
}

// ---------------------------------------------------------------------------
// Query params (mirrors backend CourseListQuery)
// ---------------------------------------------------------------------------

export interface AdminCourseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tenantId?: string;
  ownerId?: string;
  categoryId?: string;
  subcategoryId?: string;
  subjectId?: string;
  difficulty?: DifficultyLevel;
  priceTier?: PriceTier;
  visibility?: CourseVisibility;
  status?: CourseStatus;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewRelease?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "title" | "enrollmentCount" | "averageRating";
  sortOrder?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Admin view model — flattened shape for table/card rendering
// ---------------------------------------------------------------------------

export interface AdminCourseViewModel {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  authorName: string;
  authorRole: string;
  authorId: string;
  category: string;
  difficulty: DifficultyLevel;
  status: CourseStatus;
  visibility: string;
  courseType: string;
  domain: string;
  enrollmentCount: string;
  updatedAt: string;
  thumbnailUrl: string | null;
  lessonCount: number;
  lessons?: any[];
  tags: string[];
  priceTier: PriceTier;
}

// ---------------------------------------------------------------------------
// Statistics computed from course list
// ---------------------------------------------------------------------------

export interface AdminCourseStatistics {
  published: number;
  inReview: number;
  draft: number;
  archived: number;
  approved: number;
  submitted: number;
  rejected: number;
}
