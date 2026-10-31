import { api } from "../../../config/axios";

export interface CareerPathCourse {
  id?: string;
  courseId: string;
  sequence?: number;
}

export const getCareerPathCoursesApi =
  async (careerPathId: string) => {
    const res = await api.get(
      `/career-paths/${careerPathId}/courses`
    );

    // Backend returns { success, items, meta }
    // Fallback to legacy shapes for safety
    return (
      res.data?.items ||
      res.data?.courses ||
      res.data?.data ||
      []
    );
  };

export const createCareerPathCourseApi =
  async (
    careerPathId: string,
    data: {
      courseId: string;
      sequenceOrder?: number;
      isMandatory?: boolean;
      isPreview?: boolean;
    }
  ) => {
    const res = await api.post(
      `/career-paths/${careerPathId}/courses`,
      data
    );

    return (
      res.data?.course ||
      res.data?.data ||
      res.data
    );
  };

export const updateCareerPathCourseApi =
  async (
    careerPathId: string,
    courseId: string,
    data: {
      sequenceOrder?: number;
      isMandatory?: boolean;
      isPreview?: boolean;
    }
  ) => {
    const res = await api.put(
      `/career-paths/${careerPathId}/courses/${courseId}`,
      data
    );

    return (
      res.data?.course ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCareerPathCourseApi =
  async (
    careerPathId: string,
    courseId: string
  ) => {
    const res = await api.delete(
      `/career-paths/${careerPathId}/courses/${courseId}`
    );

    return res.data;
  };

/**
 * Reorder courses in a career path.
 *
 * Backend schema (reorderCareerPathCourseSchema) expects:
 *   { courses: [{ courseId: string, sequenceOrder: number }] }
 *
 * Pass the ordered courseId array and this function derives
 * sequenceOrder from the array index (1-based).
 */
export const reorderCareerPathCourseApi =
  async (
    careerPathId: string,
    orderedCourseIds: string[]
  ) => {
    const courses = orderedCourseIds.map(
      (courseId, index) => ({
        courseId,
        sequenceOrder: index + 1,
      })
    );

    const res = await api.put(
      `/career-paths/${careerPathId}/courses/reorder`,
      { courses }
    );

    return res.data;
  };