import { create } from "zustand";

export interface CourseState {
  id: string;
  title?: string;
  sequenceOrder?: number;
  [key: string]: any;
}

interface ReorderCourseStore {
  courses: CourseState[];
  selectedCareerPathId: string;
  
  setCourses: (courses: CourseState[]) => void;
  setCareerPathId: (id: string) => void;
  reorderCoursesLocally: (startIndex: number, endIndex: number) => void;
  updateCourseLocally: (courseId: string, data: Partial<CourseState>) => void;
  removeCourseLocally: (courseId: string) => void;
}

export const useReorderCourseStore = create<ReorderCourseStore>((set) => ({
  courses: [],
  selectedCareerPathId: "",

  setCourses: (courses) => set({ courses }),
  setCareerPathId: (id) => set({ selectedCareerPathId: id }),
  
  reorderCoursesLocally: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.courses);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { courses: result };
    }),

  updateCourseLocally: (courseId, data) =>
    set((state) => ({
      courses: state.courses.map((course) =>
        course.id === courseId ? { ...course, ...data } : course
      ),
    })),

  removeCourseLocally: (courseId) =>
    set((state) => ({
      courses: state.courses.filter((course) => course.id !== courseId),
    })),
}));
