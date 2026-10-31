export interface SubjectDto {
  id: string;
  name: string;
}

export interface CourseSelectionDto {
  id: string;
  title: string;
}

export interface AdminLearningPathDto {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  fullDescription?: string;
  categoryId?: string;
  subjectId?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert" | string;
  visibility: "Public" | "Private" | string;
  status: "Draft" | "Under Review" | "Published" | "In SME Review" | "Rejected" | string;
  personaIds?: string[];
  tenantIds?: string[];
  duration?: number;
  estimatedDuration?: number;
  instructor?: string;
  authorName?: string;
  instructorId?: string;
  pricing?: string;
  priceTier?: string;
  whatIsIncluded?: string | string[];
  learningOutcome?: string | string[];
  learningOutcomes?: string | string[];
  tags?: string[];
  careerPathTags?: any[];
  skills?: string[];
  skillTags?: any[];
  coverImageUrl?: string;
  coverImageAsset?: any;
  previewUrl?: string;
  previewAsset?: any;
  careerPathTenants?: any[];
  careerPathPersonas?: any[];
  assessmentRequired?: boolean;
  courses: {
    id: string;
    title: string;
    instructor?: string;
    duration?: string | number;
    isMandatory?: boolean;
    sequence?: number;
    sequenceOrder?: number;
  }[];
  [key: string]: any;
}

export interface LearningPathUpdateDto {
  title?: string;
  subtitle?: string;
  description?: string;
  fullDescription?: string;
  categoryId?: string;
  subjectId?: string;
  difficulty?: string;
  visibility?: string;
  status?: string;
  personaIds?: string[];
  tenantIds?: string[];
  duration?: number;
  estimatedDuration?: number;
  instructor?: string;
  authorName?: string;
  pricing?: string;
  priceTier?: string;
  whatIsIncluded?: any;
  learningOutcome?: any;
  learningOutcomes?: any;
  tags?: string[];
  skills?: string[];
  assessmentRequired?: boolean;
  [key: string]: any;
}

export interface LearningPathFormModel {
  title: string;
  categoryId?: string;
  subjectId: string;
  description: string;
  personas: string[];
  difficulty: string;
  whatIsIncluded: string;
  learningOutcome: string;
  duration: string;
  instructor: string;
  status: string;
  pricing: string;
  visibility: string;
  tags?: string[];
  skills?: string[];
}
