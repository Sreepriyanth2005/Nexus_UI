import { CareerPath } from "../career-path/career-path.api";

export interface AdminLearningPathDto extends CareerPath {
  courses?: any[];
  learnersEnrolled?: number;
  completionRate?: number | null;
  difficulty?: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface LearningPathStatisticsDto {
  activePaths: number;
  coursesMapped: number;
  learnersEnrolled: number;
  draft: number;
}

export interface LearningPathViewModel {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  visibility: string;
  coursesCount: number;
  learnersEnrolled: number;
  completionRate: number | null;
  difficulty: string;
  courses: Array<{ id: string; title: string }>;
  hasAssessment: boolean;
  hasCertificate: boolean;
}

export interface LearningPathCardDto {
  id: string;
  title: string;
  difficulty: string;
  coursesCount: number;
  learnersEnrolled: number;
  completionRate: number | null;
  status: string;
  courses: Array<{ id: string; title: string }>;
  hasAssessment: boolean;
  hasCertificate: boolean;
}
