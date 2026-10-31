export interface MemberCourseDto {
  id: string;
  title: string;
  tagline?: string;
  subtitle?: string;
  fullDescription: string;
  shortDescription?: string;
  language: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  priceTier: "FREE" | "PAID";
  visibility: string;
  viewCount?: number;
  tenantId?: string | null;
  courseTenants?: { tenantId: string }[];
  ownerId: string;
  categoryId: string;
  subcategoryId?: string;
  isFeatured: boolean;
  isTrending: boolean;
  isNewRelease: boolean;
  isStandalone: boolean;
  publishType: string;
  duration?: number;
  estimatedDuration?: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
    };
  };
  category?: {
    id: string;
    name: string;
  };
  thumbnailAsset?: {
    id: string;
    fileUrl: string | null;
  };
  courseLessons?: {
    id: string;
    sequenceOrder: number;
    lesson?: {
      id: string;
      title: string;
      duration?: number;
      lessonType: string;
    };
  }[];
  subjects?: {
    subject: {
      id: string;
      name: string;
    };
  }[];
}

export interface MemberCourseViewModel {
  id: string;
  type?: "course" | "career-path" | "lesson";
  category: string;
  subjectNames?: string[];
  skillNames?: string[];
  language?: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  instructor?: string;
  durationText: string;
  price: string;
  isEnrolled: boolean;
  progress?: number;
  statusText?: string;
  thumbnailUrl?: string;
  isWishlisted: boolean;
  wishlistedAt?: string;
  isFeatured: boolean;
  isTrending: boolean;
  isNewRelease: boolean;
  publishType: string;
  lessonsCount: number;
  totalDurationHours: number;
  totalDurationMins?: number;
  subjectName?: string;
  isStandalone?: boolean;
  createdAt?: string;
  lastAccessedAt?: string;
  visibility?: string;
  viewCount?: number;
  tenantIds?: string[];
  pathName?: string;
  pathId?: string;
}

export interface LearningStatistics {
  totalCoursesCount: number;
  enrolledCount: number;
  inProgressCount: number;
  completedCount: number;
  wishlistCount: number;
}
