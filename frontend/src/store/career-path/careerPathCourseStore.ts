// src/store/careerPathCourseStore.ts

import { create } from "zustand";

export interface CareerPathCourse {
  id?: string;
  /** The courseId is the stable identity key for a CareerPathCourse mapping */
  courseId: string;
  sequenceOrder?: number;
  isMandatory?: boolean;
  [key: string]: any;
}

interface CareerPathCourseState {
  courses: CareerPathCourse[];

  setCourses: (courses: CareerPathCourse[]) => void;

  addCourse: (course: CareerPathCourse) => void;

  updateCourse: (course: CareerPathCourse) => void;

  /** Delete mapping by courseId */
  deleteCourse: (courseId: string) => void;

  clearCourses: () => void;
}

export const useCareerPathCourseStore =
  create<CareerPathCourseState>((set) => ({
    courses: [],

    setCourses: (courses) => set({ courses }),

    addCourse: (course) =>
      set((state) => {
        // Dedup by courseId — if same course already added, merge
        const exists = state.courses.find(
          (item) => item.courseId === course.courseId
        );

        if (exists) {
          return {
            courses: state.courses.map((item) =>
              item.courseId === course.courseId
                ? { ...item, ...course }
                : item
            ),
          };
        }

        return { courses: [...state.courses, course] };
      }),

    updateCourse: (updatedCourse) =>
      set((state) => ({
        courses: state.courses.map((item) =>
          item.courseId === updatedCourse.courseId
            ? { ...item, ...updatedCourse }
            : item
        ),
      })),

    deleteCourse: (courseId) =>
      set((state) => ({
        courses: state.courses.filter(
          (item) => item.courseId !== courseId
        ),
      })),

    clearCourses: () => set({ courses: [] }),
  }));