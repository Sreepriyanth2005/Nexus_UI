import { api } from "../../../config/axios";

export interface ReorderCoursePayload {
  courseId: string;
  sequenceOrder: number;
}

export interface ReorderCoursesInput {
  courses: ReorderCoursePayload[];
}

export const reorderCareerPathCoursesApi = async (
  careerPathId: string,
  data: ReorderCoursesInput
): Promise<any> => {
  const res = await api.put(`/career-paths/${careerPathId}/courses/reorder`, data);
  return res.data;
};
