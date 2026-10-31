import {
  getCareerPathsApi,
  getCareerPathApi,
  getAllCareerPathsApi,
  CareerPath,
  CareerPathListParams,
} from "../career-path/career-path.api";
import { getCareerPathCoursesApi } from "../career-path/careerpath-course.api";
import {
  AdminLearningPathDto,
  LearningPathStatisticsDto,
  LearningPathViewModel,
} from "./adminLearningPaths.types";

export const mapLearningPathToViewModel = async (
  path: CareerPath
): Promise<LearningPathViewModel> => {
  // Fetch courses dynamically for this career path
  let courses: any[] = [];
  try {
    courses = await getCareerPathCoursesApi(path.id);
  } catch (error) {
    console.error(`Failed to fetch courses for career path ${path.id}:`, error);
  }

  // Map backend status to user-friendly label
  const statusLower = path.status?.toLowerCase();
  const statusLabel =
    statusLower === "published"
      ? "Active"
      : statusLower === "draft"
      ? "Draft"
      : path.status;

  // Retrieve real learner enrollment count from backend _count or properties
  const learnersEnrolled = (path as any)._count?.enrollments ?? (path as any).learnersCount ?? (path as any).enrollmentsCount ?? 0;

  // Real completion rate or null for draft / unprovided paths
  const completionRate = (path as any).completionRate !== undefined && (path as any).completionRate !== null
    ? Number((path as any).completionRate)
    : null;

  return {
    id: path.id,
    title: path.title,
    subtitle: path.subtitle ?? "",
    description: path.description ?? "",
    status: path.status,
    visibility: path.visibility,
    coursesCount: courses.length,
    learnersEnrolled,
    completionRate,
    difficulty: (path as any).difficulty ?? "Associate",
    courses: courses.map((c: any) => ({
      id: c.courseId || c.id,
      title: c.course?.title || c.title || "Course",
      lessons: (c.course?.courseLessons || c.courseLessons || []).map((cl: any) => cl.lesson || cl),
    })),
    hasAssessment: true, // Default based on wireframe
    hasCertificate: true, // Default based on wireframe
  };
};

export const adminLearningPathsApi = {
  /**
   * Get paginated learning paths.
   */
  getLearningPaths: async (
    params?: CareerPathListParams
  ): Promise<{ success: boolean; data: LearningPathViewModel[]; total: number }> => {
    const response = await getCareerPathsApi(params);
    const mapped = await Promise.all(
      (response.data || []).map((path) => mapLearningPathToViewModel(path))
    );

    return {
      success: response.success,
      data: mapped,
      total: response.total ?? response.data?.length ?? 0,
    };
  },

  /**
   * Get details of a single learning path.
   */
  getLearningPath: async (id: string): Promise<{ success: boolean; data: LearningPathViewModel }> => {
    const response = await getCareerPathApi(id);
    const mapped = await mapLearningPathToViewModel(response.data);

    return {
      success: response.success,
      data: mapped,
    };
  },

  /**
   * Get learning path statistics calculated from the all list.
   */
  getLearningPathStatistics: async (): Promise<LearningPathStatisticsDto> => {
    const response = await getAllCareerPathsApi();
    const paths = response.data || [];

    const stats: LearningPathStatisticsDto = {
      activePaths: 0,
      coursesMapped: 0,
      learnersEnrolled: 0,
      draft: 0,
    };

    stats.activePaths = paths.filter((p) => p.status?.toLowerCase() === "published").length;
    stats.draft = paths.filter((p) => p.status?.toLowerCase() === "draft").length;

    // Fetch course counts in parallel for precise courses mapped calculations
    const courseCounts = await Promise.all(
      paths.map(async (p) => {
        try {
          const courses = await getCareerPathCoursesApi(p.id);
          return courses.length;
        } catch {
          return 0;
        }
      })
    );

    stats.coursesMapped = courseCounts.reduce((sum, count) => sum + count, 0);

    // Dynamic enrollment counts sum from backend _count or properties
    stats.learnersEnrolled = paths.reduce(
      (sum, p) => sum + ((p as any)._count?.enrollments ?? (p as any).learnersCount ?? (p as any).enrollmentsCount ?? 0),
      0
    );

    return stats;
  },
};
