export interface CourseLessonDto {
  id: string;
  courseId: string;
  lessonId: string;
  sequenceOrder: number;
  isRequired: boolean;
  lesson?: {
    id: string;
    title: string;
    description?: string;
    shortDescription?: string;
    difficulty: string;
    language: string;
    duration?: number;
    lessonType: string;
    thumbnailAsset?: {
      id: string;
      fileUrl: string | null;
    };
    skills?: { skill: { id: string; name: string } }[];
    lessonTags?: { tag: { id: string; name: string } }[];
  };
}

export interface CourseDetailDto {
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
  ownerId: string;
  categoryId: string;
  subcategoryId?: string;
  isFeatured: boolean;
  isTrending: boolean;
  isNewRelease: boolean;
  publishType: string;
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
  previewAsset?: {
    id: string;
    fileUrl: string | null;
  };
  subjects?: { subject: { id: string; name: string } }[];
  tags?: { tag: { id: string; name: string } }[];
  skills?: { skill: { id: string; name: string } }[];
  courseLessons?: CourseLessonDto[];
  learningObjectives?: any;
  learningOutcomes?: any;
  prerequisites?: any;
}

export interface ReviewDto {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CourseStatisticsDto {
  enrolledCount: number;
  ratingAverage: number;
  totalHours: number;
  totalLessons: number;
}
